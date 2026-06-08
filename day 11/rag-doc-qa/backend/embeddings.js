const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_PRICE_PER_MILLION_CHARS = 0.0375;

let genAI = null;
let embeddingModel = null;

function getClient() {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to your .env file.\n" +
          "Get a key at: https://aistudio.google.com/apikey"
      );
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  }
  return { genAI, embeddingModel };
}

async function generateEmbedding(text) {
  const { embeddingModel } = getClient();
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function generateEmbeddings(texts) {
  if (texts.length === 0) return [];
  const { embeddingModel } = getClient();
  const results = await Promise.all(
    texts.map((text) => embeddingModel.embedContent(text))
  );
  return results.map((r) => r.embedding.values);
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

function getEmbeddingCost(texts) {
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
  const cost = (totalChars / 1_000_000) * EMBEDDING_PRICE_PER_MILLION_CHARS;
  return {
    model: EMBEDDING_MODEL,
    totalTokens: 0,
    totalChars,
    cost: Math.round(cost * 100000) / 100000,
    pricePerMillionChars: EMBEDDING_PRICE_PER_MILLION_CHARS,
  };
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  getEmbeddingCost,
  EMBEDDING_MODEL,
};
