"""
Clustering pipeline: load reddit_posts.json -> embed -> UMAP -> HDBSCAN -> save clusters.json.
"""
import json
from pathlib import Path

import pandas as pd
from sentence_transformers import SentenceTransformer
import umap
import hdbscan

def main():
    data_dir = Path(__file__).resolve().parent.parent / "data"
    with open(data_dir / "reddit_posts.json", encoding="utf-8") as f:
        posts = json.load(f)
    df = pd.DataFrame(posts)
    df["text"] = df["title"].fillna("") + " " + df["body"].fillna("")
    df = df[df["text"].str.len() > 50]

    if len(df) == 0:
        print("No posts with enough text; writing empty clusters.")
        with open(data_dir / "clusters.json", "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2)
        return

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(df["text"].tolist(), show_progress_bar=True)

    reducer = umap.UMAP(n_components=5, random_state=42)
    reduced = reducer.fit_transform(embeddings)

    clusterer = hdbscan.HDBSCAN(min_cluster_size=15)
    df["cluster"] = clusterer.fit_predict(reduced)

    clusters = {}
    for cid in df["cluster"].unique():
        if cid == -1:
            continue
        cluster_posts = df[df["cluster"] == cid]
        clusters[int(cid)] = {
            "size": len(cluster_posts),
            "sample_posts": cluster_posts["text"].head(5).tolist(),
            "label": f"Cluster {cid}",  # Manually label or use Claude later
        }
    with open(data_dir / "clusters.json", "w", encoding="utf-8") as f:
        json.dump(clusters, f, indent=2)
    print(f"Saved {len(clusters)} clusters to {data_dir / 'clusters.json'}")


if __name__ == "__main__":
    main()
