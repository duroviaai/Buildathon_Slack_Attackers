import os, json, re, time
from openai import OpenAI, RateLimitError
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("SAMBANOVA_API_KEY"),
    base_url="https://api.sambanova.ai/v1",
)

def generate_quiz(text: str, count: int = 10) -> list:
    prompt = (
        f"Generate exactly {count} multiple-choice quiz questions from the text below. "
        f"Return ONLY a JSON array like: "
        f'[{{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}}]. '
        f"No markdown, no explanation outside JSON.\n\n{text[:4000]}"
    )
    messages = [{"role": "user", "content": prompt}]

    last_err = None
    response = None
    for model in ["gemma-3-12b-it", "Meta-Llama-3.3-70B-Instruct"]:
        try:
            response = _client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.5,
                max_tokens=3000,
            )
            last_err = None
            break
        except RateLimitError as e:
            last_err = e
            time.sleep(3)

    if last_err:
        raise ValueError("The AI service is busy. Please wait a moment and try again.")

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```[a-z]*\n?", "", raw).rstrip("`").strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON array in AI response: {raw[:300]}")
    try:
        return json.loads(match.group())
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parse failed: {e}")
