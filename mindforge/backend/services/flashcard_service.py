import os, json, re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

def generate_flashcards(text: str, count: int = 10) -> list:
    prompt = (
        f"Generate exactly {count} flashcards from the text below. "
        f"Return ONLY a JSON array like: "
        f'[{{"front":"...","back":"..."}}]. No markdown, no explanation.\n\n{text[:4000]}'
    )
    response = _client.chat.completions.create(
        model="Meta-Llama-3.3-70B-Instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=2000,
    )
    raw = response.choices[0].message.content.strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    return json.loads(match.group()) if match else []
