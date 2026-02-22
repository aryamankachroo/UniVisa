# AI Advisor Chat – Gemini API Only

The AI Advisor uses **only the Gemini API** to generate answers.

## Setup

1. Get a free API key: [Google AI Studio – Create API Key](https://aistudio.google.com/app/apikey)
2. Add to `.env` in the backend directory:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
3. Restart the backend (`./run.sh`).

## Check

- `GET http://localhost:8000/chat/status` returns `{"ok": true, "gemini_configured": true}` when the key is loaded.

## Models

The backend tries these Gemini models in order: `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash-lite`.
