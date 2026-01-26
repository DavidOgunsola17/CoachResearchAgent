import uuid
from datetime import datetime, timedelta, timezone
from typing import Union, List
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status, Response
from fastapi.middleware.cors import CORSMiddleware  # ← NEW
from api.db import supabase, run_supabase_query
from api.models import SearchRequest, JobResponse, Job, CoachProfile
from api.auth import get_current_user_id
from api.services import run_agent_pipeline
from api.utils import retry_async
import os
import jwt  # PyJWT library (already in your requirements.txt)
from fastapi import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

def get_user_identifier(request: Request):
    """
    Extract user_id from JWT token for rate limiting.
    Falls back to IP if user is not authenticated.
    """
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return request.client.host
        
        token = auth_header.split(" ")[1]
        secret = os.environ.get("SUPABASE_JWT_SECRET")
        
        if not secret:
            # Log warning but don't crash - fallback to IP
            print("WARNING: SUPABASE_JWT_SECRET not set, using IP-based rate limiting")
            return request.client.host
        
        payload = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
        user_id = payload.get("sub")
        
        return user_id if user_id else request.client.host
        
    except jwt.ExpiredSignatureError:
        # Token expired - use IP as fallback
        return request.client.host
    except jwt.InvalidTokenError:
        # Invalid token - use IP as fallback
        return request.client.host
    except Exception as e:
        # Unexpected error - log it and use IP
        print(f"Rate limiter error: {str(e)}")
        return request.client.host

limiter = Limiter(key_func=get_user_identifier)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# NEW - Allow mobile app to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post(
    "/api/search/coaches",
    response_model=Union[JobResponse, List[CoachProfile]],
    status_code=status.HTTP_202_ACCEPTED,
)
@limiter.limit("10/minute")
async def search_coaches(
    request: Request,  # ← ADD THIS LINE
    search_request: SearchRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """
    Starts a new search for coaches. Checks for a recent cached result first.
    If no valid cache is found, it creates a background job to run the agent pipeline.
    """
    # 1. Check for a recent cached result
    query = supabase.table("search_cache") \
        .select("results, created_at") \
        .eq("school_name", search_request.school_name) \
        .eq("sport_name", search_request.sport_name) \
        .order("created_at", desc=True) \
        .limit(1)
    cache_query = await retry_async(
    lambda: run_supabase_query(query), 
    max_retries=2
    )

    if cache_query.data:
        cached_result = cache_query.data[0]
        # Use timezone-aware datetime for comparison
        cached_time = datetime.fromisoformat(cached_result["created_at"])
        if cached_time > datetime.now(timezone.utc) - timedelta(hours=24):
            response.status_code = status.HTTP_200_OK
            return [CoachProfile(**coach) for coach in cached_result["results"]]

    # 2. If no cache, create a new background job
    job_id = uuid.uuid4()
    job_payload = {
        "school": search_request.school_name,
        "sport": search_request.sport_name,
    }

    insert_query = supabase.table("background_jobs")\
        .insert({
            "id": str(job_id),
            "user_id": user_id,
            "status": "processing",
            "payload": job_payload,
        })
    insert_job_query = await run_supabase_query(insert_query)
    

    if not insert_job_query.data:
        raise HTTPException(status_code=500, detail="Failed to create background job.")

    # 3. Add the agent pipeline to background tasks
    background_tasks.add_task(
        run_and_update_job,
        job_id=job_id,
        school_name=search_request.school_name,
        sport_name=search_request.sport_name,
    )

    return JobResponse(job_id=job_id, status="processing")


@app.get("/api/search/status/{job_id}", response_model=Job)
async def get_job_status(job_id: uuid.UUID, user_id: str = Depends(get_current_user_id)):
    """
    Retrieves the status and results of a background job.
    Ensure users can only access their own jobs
    """
    query = supabase.table("background_jobs") \
        .select("*") \
        .eq("id", str(job_id)) \
        .eq("user_id", user_id)
    job_query = await run_supabase_query(query)

    if not job_query.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    return job_query.data[0]


async def run_and_update_job(job_id: uuid.UUID, school_name: str, sport_name: str):
    """
    A wrapper function for the background task that runs the agent pipeline
    and updates the job status in the database.
    """
    try:
        # Run the agent pipeline
        results = await run_agent_pipeline(school_name, sport_name)

        # Update job as completed
        update_query = supabase.table("background_jobs") \
            .update({
                "status": "completed",
                "results": results,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }) \
            .eq("id", str(job_id))
        await retry_async(
            lambda: run_supabase_query(update_query),
            max_retries=3
        )

        # Add to cache
        insert_query = supabase.table("search_cache") \
            .insert({
                "school_name": school_name,
                "sport_name": sport_name,
                "results": results,
            })
        await run_supabase_query(insert_query)

    except Exception as e:
        # Update job as failed
        fail_query = supabase.table("background_jobs") \
            .update({
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }) \
            .eq("id", str(job_id))
        await run_supabase_query(fail_query)

    # Add this new endpoint (no auth required)
@app.post("/api/search/coaches/dev", response_model=List[CoachProfile])
async def dev_search_coaches(search_request: SearchRequest):
    """
    DEV ONLY - No auth, no background jobs, no database.
    Just runs the pipeline and returns results immediately.
    """
    results = await run_agent_pipeline(
        search_request.school_name, 
        search_request.sport_name
    )
    return [CoachProfile(**coach) for coach in results]
