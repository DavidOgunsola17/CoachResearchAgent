import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv
from postgrest import APIResponse

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

async def run_supabase_query(query) -> APIResponse:
    """
    Executes a Supabase query in a separate thread to avoid blocking the event loop.
    """
    return await asyncio.to_thread(query.execute)
