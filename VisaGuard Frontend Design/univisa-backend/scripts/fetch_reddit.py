"""
One-time Reddit data pull. Requires REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
import praw

load_dotenv()

reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID", "YOUR_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET", "YOUR_CLIENT_SECRET"),
    user_agent="univisa_research",
)

SUBREDDITS = [
    "f1visa",
    "internationalstudents",
    "USCIS",
    "gradadmissions",
]

def main():
    posts = []
    for sub_name in SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub_name)
            for post in subreddit.hot(limit=500):
                posts.append({
                    "id": post.id,
                    "title": post.title,
                    "body": post.selftext or "",
                    "score": post.score,
                    "subreddit": sub_name,
                    "created": post.created_utc,
                })
        except Exception as e:
            print(f"Warning: could not fetch r/{sub_name}: {e}")
    data_dir = Path(__file__).resolve().parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    out_path = data_dir / "reddit_posts.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2)
    print(f"Saved {len(posts)} posts to {out_path}")


if __name__ == "__main__":
    main()
