from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Optional
import os

from reddit_service import fetch_subreddit_comments, post_reddit_reply
from llm_service import generate_ai_reply, AVAILABLE_MODELS, DEFAULT_SYSTEM_PROMPT

app = FastAPI(title="Reddit AI Bot Dashboard")

# Mount static files and templates
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class FetchDraftRequest(BaseModel):
    subreddits: str
    limit: int = 4
    provider: str = "gemini"
    model_id: str = "gemini-3.6-flash"
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT

class RegenerateRequest(BaseModel):
    comment_body: str
    provider: str = "gemini"
    model_id: str = "gemini-3.6-flash"
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT

class SendReplyRequest(BaseModel):
    comment_id: str
    reply_text: str

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "available_models": AVAILABLE_MODELS,
            "default_system_prompt": DEFAULT_SYSTEM_PROMPT
        }
    )

@app.post("/api/fetch-and-draft")
async def fetch_and_draft(req: FetchDraftRequest):
    sub_list = [s.strip() for s in req.subreddits.split(",") if s.strip()]
    if not sub_list:
        raise HTTPException(status_code=400, detail="Please enter at least one subreddit name.")
        
    try:
        raw_comments = fetch_subreddit_comments(sub_list, limit=req.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Reddit comments: {str(e)}")

    drafts = []
    for c in raw_comments:
        try:
            ai_reply = generate_ai_reply(
                comment_body=c["body"],
                provider=req.provider,
                model_id=req.model_id,
                system_prompt=req.system_prompt
            )
        except Exception as e:
            ai_reply = f"[Failed to generate AI response: {str(e)}]"

        drafts.append({
            "id": c["id"],
            "subreddit": c["subreddit"],
            "author": c["author"],
            "body": c["body"],
            "permalink": c["permalink"],
            "draft_reply": ai_reply,
            "status": "draft"
        })

    return {"success": True, "count": len(drafts), "drafts": drafts}

@app.post("/api/regenerate-draft")
async def regenerate_draft(req: RegenerateRequest):
    try:
        new_reply = generate_ai_reply(
            comment_body=req.comment_body,
            provider=req.provider,
            model_id=req.model_id,
            system_prompt=req.system_prompt
        )
        return {"success": True, "draft_reply": new_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate response: {str(e)}")

@app.post("/api/send-reply")
async def send_reply(req: SendReplyRequest):
    if not req.reply_text.strip():
        raise HTTPException(status_code=400, detail="Reply text cannot be empty.")
        
    res = post_reddit_reply(req.comment_id, req.reply_text.strip())
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("error", "Unknown error posting to Reddit"))
        
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)