require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { upload, extractText } = require("./upload");
const { chunkText } = require("./chunking");
const {
	generateEmbedding,
	generateEmbeddings,
	getEmbeddingCost,
} = require("./embeddings");
const vectorstore = require("./vectorstore");

const app = express();
const PORT = process.env.PORT || 3004;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json({ limit: "50mb" }));

async function queryGemini(systemPrompt, userMessage) {
	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash-lite",
		systemInstruction: systemPrompt,
		generationConfig: { maxOutputTokens: 4096 },
	});
	const result = await model.generateContent(userMessage);
	return result.response;
}

function calculateCost(promptTokens, completionTokens) {
	const inputRate = 0.1 / 1_000_000;
	const outputRate = 0.4 / 1_000_000;
	const inputCost = promptTokens * inputRate;
	const outputCost = completionTokens * outputRate;
	return {
		promptTokens,
		completionTokens,
		totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
	};
}

app.post("/api/upload", async (req, res) => {
	upload.single("file")(req, res, async (err) => {
		if (err) {
			return res.status(400).json({ error: err.message });
		}
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}
		try {
			const rawText = await extractText(req.file.path, req.file.mimetype);

			if (!rawText || !rawText.trim()) {
				return res.status(400).json({
					error:
						"No text could be extracted from this file. The file may be empty, scanned (image-based PDF), or contain only non-extractable content.",
				});
			}

			const chunks = chunkText(rawText, 500, 50);
			const chunkTexts = chunks.map((c) => c.text);

			const embeddings = await generateEmbeddings(chunkTexts);
			const embedCost = getEmbeddingCost(chunkTexts);

			await vectorstore.addDocument(
				{
					filename: req.file.filename,
					originalName: req.file.originalname,
					totalChars: rawText.length,
				},
				chunks,
				embeddings,
			);

			const stats = vectorstore.getStats();

			res.json({
				success: true,
				filename: req.file.originalname,
				totalChars: rawText.length,
				totalChunks: chunks.length,
				chunkSize: 500,
				chunkOverlap: 50,
				embeddingCost: embedCost,
				stats,
			});
		} catch (extractErr) {
			console.error("Upload processing error:", extractErr.message);
			res
				.status(500)
				.json({ error: "Failed to process file: " + extractErr.message });
		}
	});
});

app.post("/api/ask", async (req, res) => {
	try {
		const { question } = req.body;

		if (!question) {
			return res.status(400).json({ error: "'question' is required" });
		}

		const questionEmbedding = await generateEmbedding(question);
		const topChunks = await vectorstore.search(questionEmbedding, 3);

		if (topChunks.length === 0) {
			return res.json({
				answer:
					"No documents have been uploaded yet. Please upload a document first.",
				citations: [],
				chunks: [],
				cost: null,
			});
		}

		const contextText = topChunks
			.map(
				(c, i) =>
					`[Chunk ${c.index + 1}] (relevance: ${(c.score * 100).toFixed(1)}%) [Source: ${c.source}]\n${c.text}`,
			)
			.join("\n\n---\n\n");

		const systemPrompt = `You are a document Q&A assistant. You are given the most relevant excerpts from a document retrieved by a vector search.

Your job:
1. Answer the user's question based ONLY on the provided excerpts.
2. For each statement, cite the specific chunk number and source filename.
3. If the excerpts don't contain enough information, say so clearly.
4. Keep answers concise but complete.

Return your answer in this JSON format:
{
  "answer": "Your answer text here...",
  "citations": [
    { "chunk": 1, "source": "filename.txt", "text": "Excerpt from source..." },
    { "chunk": 3, "source": "filename.txt", "text": "Another excerpt..." }
  ]
}`;

		const userMessage = `Relevant document excerpts:
---
${contextText}
---

Question: ${question}

Answer based on the excerpts above. Cite chunk numbers and sources.`;

		const geminiResponse = await queryGemini(systemPrompt, userMessage);

		const content = geminiResponse.text() || "";
		const usage = geminiResponse.usageMetadata || {};
		const promptTokens = usage.promptTokenCount || 0;
		const completionTokens = usage.candidatesTokenCount || 0;

		let parsed;
		try {
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			parsed = jsonMatch
				? JSON.parse(jsonMatch[0])
				: { answer: content, citations: [] };
		} catch {
			parsed = { answer: content, citations: [] };
		}

		const cost = calculateCost(promptTokens, completionTokens);

		const ragCost = {
			...cost,
			retrievalChunks: topChunks.length,
			totalChunksInStore: vectorstore.getStats().chunkCount,
		};

		res.json({
			answer: parsed.answer || content,
			citations: parsed.citations || [],
			chunks: topChunks.map((c) => ({
				id: c.chunkId,
				text: c.text,
				score: Math.round(c.score * 1000) / 1000,
				source: c.source,
			})),
			cost: ragCost,
		});
	} catch (err) {
		console.error("POST /api/ask error:", err.message);
		res.status(500).json({ error: err.message });
	}
});

app.get("/api/stats", (req, res) => {
	res.json(vectorstore.getStats());
});

app.post("/api/clear", (req, res) => {
	vectorstore.clearStore();
	res.json({ success: true, message: "Vector store cleared" });
});

app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		storeStats: vectorstore.getStats(),
	});
});

app.listen(PORT, () => {
	console.log(`RAG Doc QA backend running on http://localhost:${PORT}`);
	console.log(
		`Vector store: ${require("path").join(__dirname, "store", "vectors.json")}`,
	);
});
