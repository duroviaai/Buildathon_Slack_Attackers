import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

_SYSTEM_PROMPT = "You are a concise study assistant. Give direct answers in 3-5 lines maximum. No markdown, no bullet points unless asked."

def get_ai_reply(user_message: str) -> str:
    try:
        response = _client.chat.completions.create(
            model="Meta-Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": "Answer briefly and clearly: " + user_message},
            ],
            temperature=0.7,
            max_tokens=200,
        )
        text = response.choices[0].message.content.strip()
        return text or "⚠️ No response generated."
    except Exception as e:
        print("[chatbot_service] ERROR:", e)
        return f"⚠️ AI error: {str(e)}"
