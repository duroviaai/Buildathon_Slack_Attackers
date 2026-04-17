from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
