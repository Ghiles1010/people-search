import os
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

class SummaryService:
    def __init__(self):
        self.claude = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
    
    async def summarize_content(self, content: str) -> str:
        """
        Summarize content using Claude
        """

        prompt = f"""
            Given this list of people profiles, return a short description of each of those persons 
            the return format should be in json like with the key : full_name and description
            if a description doesn't represent a person, ignore it

            here's the list of people : {content}
        """

        message = self.claude.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return message.content[0].text 