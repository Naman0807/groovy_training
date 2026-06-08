@echo off
echo Starting ChromaDB server...
pip install chromadb -q
chroma run --host localhost --port 8000
