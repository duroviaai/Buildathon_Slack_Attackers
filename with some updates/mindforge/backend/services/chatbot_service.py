import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=_api_key)

_model = genai.GenerativeModel(
    model_name="models/gemini-2.5-flash",
    system_instruction="You are a concise study assistant. Give direct answers in 3-5 lines maximum. No markdown, no bullet points unless asked.",
    generation_config={
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "max_output_tokens": 200,
    }
)

def get_ai_reply(user_message: str) -> str:
    try:
        prompt = "Answer briefly and clearly: " + user_message
        response = _model.generate_content(prompt)
        text = response.text.strip() if response.text else ""
        return text or "⚠️ No response generated."
    except Exception as e:
        print("[chatbot_service] ERROR:", e)
        return f"⚠️ AI error: {str(e)}"
