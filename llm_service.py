import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from groq import Groq

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful, witty, and engaging Reddit user. "
    "Provide a concise, natural, and helpful reply (under 3-4 sentences) to the user's comment. "
    "Do not include hashtags, markdown title headers, or meta-comments."
)

AVAILABLE_MODELS = {
    "gemini": [
        {"id": "gemini-3.6-flash", "name": "Gemini 3.6 Flash (Fast & Recommended)"},
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"}
    ],
    "groq": [
        {"id": "groq/compound-mini", "name": "Groq Compound Mini (Fast & Recommended)"},
        {"id": "groq/compound", "name": "Groq Compound"}
    ]
}

def generate_ai_reply(comment_body: str, provider: str = "gemini", model_id: str = None, system_prompt: str = None) -> str:
    load_dotenv(override=True)
    system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
    provider = provider.lower().strip()

    if provider == "groq":
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            raise ValueError("GROQ_API_KEY is not configured in .env file.")
            
        selected_model = model_id or "groq/compound-mini"
        client = Groq(api_key=groq_key)
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Reddit Comment: {comment_body}"}
            ],
            model=selected_model,
            temperature=0.7,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()

    else:  # Default to Gemini
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            raise ValueError("GEMINI_API_KEY is not configured in .env file.")
            
        selected_model = model_id or "gemini-3.6-flash"
        client = genai.Client(api_key=gemini_key)
        
        try:
            response = client.models.generate_content(
                model=selected_model,
                contents=f"Reddit Comment: {comment_body}",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt
                )
            )
            return response.text.strip()
        except Exception as e:
            # Fallback if primary model fails
            if selected_model != "gemini-3.6-flash":
                print(f"Model {selected_model} failed ({e}). Retrying with gemini-3.6-flash...")
                response = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=f"Reddit Comment: {comment_body}",
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt
                    )
                )
                return response.text.strip()
            raise e
