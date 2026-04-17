# MindForge Setup

## 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

## 2. Add Your Gemini API Key
Edit `.env` and replace `<your-gemini-api-key-here>` with your actual API key:
```
GEMINI_API_KEY=YOUR_ACTUAL_KEY_HERE
```

## 3. Run the App
```bash
python run.py
```

## 4. Open in Browser
Navigate to: `http://127.0.0.1:5000/dashboard.html`

## 5. Test Chat
- Type a message in the chat input
- Click the send button (green icon)
- AI should respond instantly

---

**All features working:**
- ✅ Sidebar navigation
- ✅ Folder/file system
- ✅ Flashcards
- ✅ Dashboard UI
- ✅ AI Chat (Gemini 2.5 Flash)
