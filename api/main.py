import uuid
from datetime import datetime, timedelta, timezone
from typing import Union, List
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status, Response
from api.db import supabase, run_supabase_query
from api.models import SearchRequest, JobResponse, Job, CoachProfile
from api.auth import get_current_user_id
from api.services import run_agent_pipeline

app = FastAPI()

@app.post(
    "/api/search/coaches",
    response_model=Union[JobResponse, List[CoachProfile]],
    status_code=status.HTTP_202_ACCEPTED,
)
async def search_coaches(
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
    cache_query = await run_supabase_query(query)
    

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
        await run_supabase_query(update_query)

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
