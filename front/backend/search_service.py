import os
from dotenv import load_dotenv
from exa_py import Exa

load_dotenv()

class SearchService:
    def __init__(self):
        self.exa = Exa(os.getenv("EXA_API_KEY"))
    
    async def search_content(self, query: str) -> str:
        """
        Search for content using Exa.ai and return the text content
        """
        # Get URL from Exa
        result = self.exa.search_and_contents(query, text=True)

        final_result = []
        for r in result.results :
            c = {"title":r.title, "content":r.text}
            final_result.append(c)

        return final_result