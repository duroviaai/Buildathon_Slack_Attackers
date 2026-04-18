import os, time
from openai import OpenAI, RateLimitError
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

_SYSTEM_PROMPT = "You are a concise study assistant. Give direct answers in 3-5 lines maximum. No markdown, no bullet points unless asked."
_MODELS = ["gemma-3-12b-it", "Llama-4-Maverick-17B-128E-Instruct", "Meta-Llama-3.3-70B-Instruct"]

def get_ai_reply(user_message: str) -> str:
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": "Answer briefly and clearly: " + user_message},
    ]
    for i, model in enumerate(_MODELS):
        try:
            response = _client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=200,
            )
            return response.choices[0].message.content.strip() or "⚠️ No response generated."
        except RateLimitError:
            if i < len(_MODELS) - 1:
                time.sleep(2)
                continue
            return "⚠️ The AI service is busy right now. Please try again in a moment."
        except Exception as e:
            print("[chatbot_service] ERROR:", e)
            return f"⚠️ AI error: {str(e)}"
