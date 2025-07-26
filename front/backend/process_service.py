import os
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

class ProcessService:
    def __init__(self):
        self.claude = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
    
    async def process(self, content: list, instruction: str) -> str:
        """
        Process content according to the given instruction using Claude
        """
        prompt = f"""
        You are given the following content and an instruction on how to process it.
        
        Content: {content}
        
        Instruction: {instruction}
        
        Please execute the instruction on the content and return the result.
        """
        
        message = self.claude.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return message.content[0].text 