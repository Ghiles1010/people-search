import os
import json
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

class ProcessService:
    def __init__(self):
        self.claude = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
    
    async def process(self, content: list, instruction: str) -> dict:
        """
        Process content according to the given instruction using Claude
        Returns both a chat response and filtered search results
        """
        prompt = f"""
You are an AI assistant helping to process search results about people. You will receive:
1. A list of people profiles in JSON format
2. An instruction on how to process them

Your task is to:
1. Execute the instruction on the data
2. Return a response in the following JSON format:

{{
    "chat_response": "Your natural language response explaining what you did",
    "filtered_results": [
        {{
            "full_name": "Person Name",
            "description": "Person description"
        }}
    ],
    "results_modified": true/false
}}

IMPORTANT RULES:
- If the instruction involves filtering, removing, or selecting specific people, set "results_modified" to true and return only the matching profiles in "filtered_results"
- If the instruction is just analysis, formatting, or explanation without changing the data, set "results_modified" to false and return all original profiles in "filtered_results"
- Always maintain the exact same JSON structure for each person: {{"full_name": "...", "description": "..."}}
- The "chat_response" should explain what you did in a conversational way
- If filtering results in no matches, return an empty array for "filtered_results"

Examples of filtering instructions: "remove people who are not CEOs", "show only CTOs", "keep only people from Google", "filter out non-executives"
Examples of non-filtering instructions: "create a report", "format as bullet points", "analyze their backgrounds", "compare their experience"

Original search results:
{json.dumps(content, indent=2)}

User instruction: "{instruction}"

Please process this data according to the instruction and return the response in the specified JSON format.
        """
        
        message = self.claude.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        try:
            # Parse the JSON response from Claude
            response_text = message.content[0].text
            
            # Try to extract JSON from the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_content = response_text[json_start:json_end]
                parsed_response = json.loads(json_content)
                
                # Validate the response structure
                if all(key in parsed_response for key in ["chat_response", "filtered_results", "results_modified"]):
                    return parsed_response
            
            # Fallback if JSON parsing fails
            return {
                "chat_response": response_text,
                "filtered_results": content,  # Return original data
                "results_modified": False
            }
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            print(f"Error parsing Claude response: {e}")
            # Fallback response
            return {
                "chat_response": f"I processed your request: {instruction}\n\n{message.content[0].text}",
                "filtered_results": content,  # Return original data
                "results_modified": False
            } 