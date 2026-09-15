# Reddit AI Agent

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-framework-009688?logo=fastapi&logoColor=white)
![PRAW](https://img.shields.io/badge/PRAW-Reddit%20API-FF4500?logo=reddit&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=flat&logo=groq&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

A Python Reddit bot with a web dashboard that reads subreddit comments and generates AI-powered reply drafts using Google Gemini or Groq. Replies are staged for human review before posting — keeping you in full control.

---

## ✨ Features

- 🌐 **Web Dashboard** (FastAPI + Jinja2) — view fetched comments and AI drafts in your browser
- 🤖 **Multi-LLM Support** — choose between Google Gemini or Groq models
- ✏️ **Human-in-the-Loop** — review, edit, or regenerate every draft before it posts
- 🔁 **Regenerate Drafts** — instantly re-generate an AI reply with one click
- 🛡️ **Self-reply Guard** — bot skips comments made by its own account
- 🔒 **Credential-safe** — all secrets loaded from a local `.env` file, never hardcoded

---

## ⚠️ Reddit API Access — Read This First

> This project requires access to **Reddit's Data API**.
>
> Reddit's current policy ([Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)) requires developers to **obtain appropriate approval/access** before using Reddit data through the API.

### If you receive `403 Forbidden`

This is **most likely an API access issue, not a code issue.**

The project author has also encountered a 403 where:
- OAuth token creation succeeds (HTTP 200)
- `/api/v1/me` returns HTTP 403
- Subreddit comment requests return HTTP 403

**What to check:**

1. Your Reddit app is registered at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) as a **script** type app
2. Your Reddit account has not been flagged or restricted
3. Your account meets Reddit's requirements for Data API access
4. Your `user_agent` string follows Reddit's format: `platform:app_id:version (by /u/username)`

> **Note:** Do not create new Reddit accounts to bypass access restrictions — this violates [Reddit's rules](https://support.reddithelp.com/hc/en-us/articles/360043512931-Don-t-break-the-site).

---

## 📁 Project Structure

```
reddit-ai-agent/
├── main.py              # FastAPI app & API routes
├── reddit_service.py    # PRAW Reddit client (fetch comments, post replies)
├── llm_service.py       # Gemini & Groq AI reply generation
├── requirements.txt     # Python dependencies
├── .env.example         # Template for your credentials
├── .gitignore
├── static/              # CSS / JS assets for the dashboard
├── templates/           # Jinja2 HTML templates
└── README.md
```

---

## 🚀 Setup

### 1. Clone the repository

```bash
git clone https://github.com/rajrounak21/reddit-ai-agent.git
cd reddit-ai-agent
```

### 2. Create a virtual environment

```bash
python -m venv myenv
# Windows
myenv\Scripts\activate
# macOS / Linux
source myenv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure credentials

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
client_id=YOUR_REDDIT_CLIENT_ID
client_secret=YOUR_REDDIT_CLIENT_SECRET
username=YOUR_REDDIT_USERNAME
password=YOUR_REDDIT_PASSWORD
user_agent=python:my_mira:v1.0 (by /u/YOUR_REDDIT_USERNAME)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

> **Warning:** Never commit your `.env` file to GitHub. It is already listed in `.gitignore`.

### 5. Obtain API credentials

| Credential | Where to get it |
|---|---|
| Reddit `client_id` / `client_secret` | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) — create a **script** app |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) (optional, for Groq models) |

### 6. Run the dashboard

```bash
python main.py
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## 🖥️ How to Use

1. Enter one or more subreddit names (e.g. `python, AskReddit`)
2. Select your preferred AI provider and model
3. Click **Fetch & Draft** — the bot fetches recent comments and generates AI reply drafts
4. Review each draft and edit if needed
5. Click **Regenerate** to get a fresh AI reply, or **Send Reply** to post it to Reddit

---

## 🤝 Responsible Use

This project is a tool for **human-assisted** Reddit engagement. By using it, you agree to:

- Comply with [Reddit's Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)
- Comply with [Reddit's API Terms of Service](https://www.reddit.com/wiki/api-terms/)
- Comply with [Reddit's User Agreement](https://www.redditinc.com/policies/user-agreement) and [Content Policy](https://www.redditinc.com/policies/content-policy)
- Disclose bot activity where required by subreddit rules
- Not use this tool to spam, manipulate votes, or bypass Reddit's access controls

> Reddit's policy specifically covers bots and AI agents and requires apps to be transparent and appropriately registered.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Reddit API | [PRAW](https://praw.readthedocs.io/) |
| AI — Google | [Google Gemini](https://ai.google.dev/) via `google-genai` |
| AI — Groq | [Groq](https://groq.com/) via `groq` SDK |
| Templating | Jinja2 |
| Config | `python-dotenv` |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
