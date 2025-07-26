from fastapi import FastAPI
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

@app.post("/search")
async def search(query: dict):
    # First search for content
    content = await search_service.search_content(query["query"])
    
    # Then summarize the content
    summary = await summary_service.summarize_content(content)

    # Process content if instruction is provided
    result = None
    if "instruction" in query and query["instruction"]:
        result = await process_service.process(content, query["instruction"])
    
    return {
        "response": summary,
        "result": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 