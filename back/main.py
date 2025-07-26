from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from search_service import SearchService
from summary_service import SummaryService
from process_service import ProcessService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

search_service = SearchService()
summary_service = SummaryService()
process_service = ProcessService()

# Global variable to store session data
session_data = {
    "search_results": None,
    "search_summary": None,
    "search_query": None
}

@app.post("/search")
async def search(query: dict):
    """
    Phase 1: Search for content and store in session
    """
    search_query = query.get("query")
    if not search_query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    # Search for content
    content = await search_service.search_content(search_query)
    
    # Summarize the content 
    summary = await summary_service.summarize_content(content)
    
    # Store in session
    session_data["search_results"] = content
    session_data["search_summary"] = summary
    session_data["search_query"] = search_query
    
    return {
        "message": "Search completed and data stored in session",
        "query": search_query,
        "summary": summary,
        "results_count": len(content) if isinstance(content, list) else 1
    }

@app.post("/instruct")
async def instruct(instruction: dict):
    """
    Phase 2: Process stored search data with instructions
    """
    instruction_text = instruction.get("instruction")
    if not instruction_text:
        raise HTTPException(status_code=400, detail="Instruction is required")
    
    if not session_data["search_results"]:
        raise HTTPException(status_code=400, detail="No search data found. Please search first.")
    
    # Process the stored content with the instruction
    result = await process_service.process(session_data["search_results"], instruction_text)
    
    # Update stored search results if they were modified
    if result.get("results_modified", False) and result.get("filtered_results"):
        session_data["search_results"] = result["filtered_results"]
        session_data["search_summary"] = None  # Clear old summary since data changed
        
        # Update results count
        previous_count = len(session_data["search_results"]) if session_data["search_results"] else 0
        print(f"Search results updated: {previous_count} -> {len(result['filtered_results'])} items")
    
    return {
        "instruction": instruction_text,
        "chat_response": result.get("chat_response", ""),
        "filtered_results": result.get("filtered_results", []),
        "results_modified": result.get("results_modified", False),
        "results_count": len(result.get("filtered_results", [])),
        "original_query": session_data["search_query"]
    }

@app.get("/session/status")
async def get_session_status():
    """
    Get current session status
    """
    has_data = session_data["search_results"] is not None
    return {
        "has_search_data": has_data,
        "search_query": session_data["search_query"] if has_data else None,
        "results_count": len(session_data["search_results"]) if has_data and isinstance(session_data["search_results"], list) else (1 if has_data else 0)
    }

@app.post("/session/clear")
async def clear_session():
    """
    Clear session data
    """
    global session_data
    session_data = {
        "search_results": None,
        "search_summary": None,
        "search_query": None
    }
    return {"message": "Session cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 