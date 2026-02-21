"""
Ingest USCIS docs from data/uscis_docs/: chunk (~500 tokens), embed with sentence-transformers,
store in Actian VectorAI DB (if ACTIAN_VECTORAI_URL set) or ChromaDB.
See https://github.com/hackmamba-io/actian-vectorAI-db-beta
"""
import os
from pathlib import Path

from sentence_transformers import SentenceTransformer

# ~500 tokens ≈ ~2000 chars per chunk (rough)
CHUNK_CHARS = 2000
OVERLAP = 200
COLLECTION_NAME = "uscis_docs"
EMBED_DIM = 384  # all-MiniLM-L6-v2


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
    n = len(all_chunks)
    use_actian = bool(os.getenv("ACTIAN_VECTORAI_URL", "").strip())
    if use_actian:
        try:
            from cortex import CortexClient, DistanceMetric
        except ImportError:
            print("ACTIAN_VECTORAI_URL is set but cortex client not installed. Install from actian-vectorAI-db-beta repo.")
            return
        url = os.getenv("ACTIAN_VECTORAI_URL", "localhost:50051").strip()
        if url.startswith("http://"):
            url = url[7:]
        if url.startswith("https://"):
            url = url[8:]
        host, _, port = url.partition(":")
        addr = f"{host}:{port}" if port else f"{url}:50051"
        ids = list(range(n))
        payloads = [{"source": m["source"], "text": c} for c, m in zip(all_chunks, all_metas)]
        with CortexClient(addr) as client:
            if not client.has_collection(COLLECTION_NAME):
                client.create_collection(
                    name=COLLECTION_NAME,
                    dimension=EMBED_DIM,
                    distance_metric=DistanceMetric.COSINE,
                )
            batch_size = 100
            for i in range(0, n, batch_size):
                batch_ids = ids[i : i + batch_size]
                batch_vectors = embeddings[i : i + batch_size]
                batch_payloads = payloads[i : i + batch_size]
                client.batch_upsert(COLLECTION_NAME, batch_ids, batch_vectors, batch_payloads)
        print(f"Ingested {len(all_chunks)} chunks from {len(txt_files)} files into Actian VectorAI DB at {addr}")
    else:
        import chromadb
        from chromadb.config import Settings
        persist_dir = str(data_dir / "chroma_db")
        client = chromadb.PersistentClient(path=persist_dir, settings=Settings(anonymized_telemetry=False))
        coll = client.get_or_create_collection(COLLECTION_NAME, metadata={"description": "USCIS policy chunks"})
        chroma_ids = [f"doc_{i}" for i in range(n)]
        coll.upsert(ids=chroma_ids, documents=all_chunks, metadatas=all_metas, embeddings=embeddings)
        print(f"Ingested {len(all_chunks)} chunks from {len(txt_files)} files into ChromaDB at {persist_dir}")


if __name__ == "__main__":
    main()
