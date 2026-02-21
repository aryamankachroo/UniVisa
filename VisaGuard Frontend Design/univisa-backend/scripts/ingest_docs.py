"""
Ingest USCIS docs from data/uscis_docs/: chunk (~500 tokens), embed with sentence-transformers,
store in ChromaDB (hackathon). Replace with Actian vector DB when available.
"""
import os
from pathlib import Path

from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# ~500 tokens ≈ ~2000 chars per chunk (rough)
CHUNK_CHARS = 2000
OVERLAP = 200

def chunk_text(text: str, source: str) -> list[tuple[str, dict]]:
    """Split text into overlapping chunks; return list of (chunk_text, metadata)."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_CHARS
        chunk = text[start:end]
        if not chunk.strip():
            start = end - OVERLAP
            continue
        chunks.append((chunk, {"source": source}))
        start = end - OVERLAP
    return chunks


def main():
    data_dir = Path(__file__).resolve().parent.parent / "data"
    docs_dir = data_dir / "uscis_docs"
    if not docs_dir.exists():
        docs_dir.mkdir(parents=True, exist_ok=True)
    txt_files = list(docs_dir.glob("**/*.txt"))
    if not txt_files:
        print("No .txt files in data/uscis_docs/. Add USCIS plain-text docs and re-run.")
        return
    model = SentenceTransformer("all-MiniLM-L6-v2")
    persist_dir = str(data_dir / "chroma_db")
    client = chromadb.PersistentClient(path=persist_dir, settings=Settings(anonymized_telemetry=False))
    coll = client.get_or_create_collection("uscis_docs", metadata={"description": "USCIS policy chunks"})
    all_chunks = []
    all_metas = []
    for path in txt_files:
        text = path.read_text(encoding="utf-8", errors="ignore")
        for chunk_text_val, meta in chunk_text(text, source=path.stem):
            all_chunks.append(chunk_text_val)
            all_metas.append(meta)
    if not all_chunks:
        print("No chunks produced.")
        return
    embeddings = model.encode(all_chunks).tolist()
    ids = [f"doc_{i}" for i in range(len(all_chunks))]
    coll.upsert(ids=ids, documents=all_chunks, metadatas=all_metas, embeddings=embeddings)
    print(f"Ingested {len(all_chunks)} chunks from {len(txt_files)} files into ChromaDB at {persist_dir}")


if __name__ == "__main__":
    main()
