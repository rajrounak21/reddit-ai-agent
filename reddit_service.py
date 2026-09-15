import os
from dotenv import load_dotenv
import praw

def get_reddit_client():
    load_dotenv(override=True)
    
    username = os.getenv("username")
    user_agent = f"python:my_mira:v1.0 (by /u/{username})" if username else os.getenv("user_agent")
    
    client_id = os.getenv("client_id")
    client_secret = os.getenv("client_secret")
    password = os.getenv("password")
    
    if not all([client_id, client_secret, user_agent]):
        raise ValueError("Missing required Reddit API credentials in .env file.")
        
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        username=username,
        password=password
    )
    return reddit

def fetch_subreddit_comments(subreddits: list[str], limit: int = 5) -> list[dict]:
    reddit = get_reddit_client()
    comments_list = []
    
    for sub_name in subreddits:
        sub_name = sub_name.strip()
        if not sub_name:
            continue
        try:
            subreddit = reddit.subreddit(sub_name)
            for comment in subreddit.comments(limit=limit):
                author_name = comment.author.name if comment.author else "[deleted]"
                
                # Avoid fetching comments created by the authenticated bot account itself
                try:
                    me = reddit.user.me()
                    if me and comment.author and comment.author.name == me.name:
                        continue
                except Exception:
                    pass

                comments_list.append({
                    "id": comment.id,
                    "subreddit": sub_name,
                    "author": author_name,
                    "body": comment.body,
                    "permalink": f"https://reddit.com{comment.permalink}",
                    "created_utc": comment.created_utc
                })
        except Exception as e:
            print(f"Error fetching from r/{sub_name}: {e}")
            
    return comments_list

def post_reddit_reply(comment_id: str, reply_text: str) -> dict:
    reddit = get_reddit_client()
    try:
        comment = reddit.comment(id=comment_id)
        reply_obj = comment.reply(reply_text)
        return {
            "success": True,
            "reply_id": reply_obj.id,
            "reply_permalink": f"https://reddit.com{reply_obj.permalink}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
