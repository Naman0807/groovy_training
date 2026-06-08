const fs = require("fs");
const path = require("path");
const { cosineSimilarity } = require("./embeddings");

const STORE_DIR = path.join(__dirname, "store");
const STORE_FILE = path.join(STORE_DIR, "vectors.json");

let store = { documents: [], chunks: [], embeddings: [] };

function ensureStoreDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function loadStore() {
  ensureStoreDir();
  if (fs.existsSync(STORE_FILE)) {
    try {
      store = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
    } catch {
      store = { documents: [], chunks: [], embeddings: [] };
    }
  }
}

function saveStore() {
  ensureStoreDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

loadStore();

async function addDocument(documentInfo, chunks, chunkEmbeddings) {
  const docId = `doc-${Date.now()}`;
  store.documents.push({
    id: docId,
    filename: documentInfo.filename,
    originalName: documentInfo.originalName,
    totalChars: documentInfo.totalChars,
    totalChunks: chunks.length,
    uploadedAt: new Date().toISOString(),
  });

  for (let i = 0; i < chunks.length; i++) {
    store.chunks.push({
      id: chunks[i].id,
      docId,
      text: chunks[i].text,
      index: chunks[i].index,
      startChar: chunks[i].startChar,
      endChar: chunks[i].endChar,
    });
    store.embeddings.push({
      chunkId: chunks[i].id,
      docId,
      vector: chunkEmbeddings[i],
    });
  }

  saveStore();
  return docId;
}

async function search(queryEmbedding, topK = 3) {
  if (store.embeddings.length === 0) {
    return [];
  }

  const scored = store.embeddings.map((emb) => {
    const chunk = store.chunks.find((c) => c.id === emb.chunkId);
    const doc = store.documents.find((d) => d.id === emb.docId);
    const score = cosineSimilarity(queryEmbedding, emb.vector);
    return {
      chunkId: emb.chunkId,
      docId: emb.docId,
      text: chunk ? chunk.text : "",
      index: chunk ? chunk.index : -1,
      score,
      source: doc ? doc.originalName : "unknown",
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function getStats() {
  return {
    documentCount: store.documents.length,
    chunkCount: store.chunks.length,
    documents: store.documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      originalName: d.originalName,
      totalChars: d.totalChars,
      totalChunks: d.totalChunks,
      uploadedAt: d.uploadedAt,
    })),
  };
}

function clearStore() {
  store = { documents: [], chunks: [], embeddings: [] };
  saveStore();
}

module.exports = { addDocument, search, getStats, clearStore };
