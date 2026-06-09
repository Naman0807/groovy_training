require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { upload, extractText } = require("./upload");
const { chunkText } = require("./chunking");
const { generateEmbedding, generateEmbeddings } = require("./embeddings");
const vectorStore = require("./vectorstore");

const app = express();
const PORT = process.env.PORT || 3001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
async function queryGemini(systemPrompt, userMessage) {
	const model = genAI.getGenerativeModel({
		model: "gemini-2.5-flash-lite",
		systemInstruction: systemPrompt,
	});

	const result = await model.generateContent(userMessage);
	const response = result.response;
	const usageMetadata = response.usageMetadata;

	return {
		content: [{ text: response.text() }],
		usage: {
			input_tokens: usageMetadata?.promptTokenCount ?? 0,
			output_tokens: usageMetadata?.candidatesTokenCount ?? 0,
		},
	};
}

function calculateCost(usage) {
	const inputRate = 0.1 / 1_000_000;
	const outputRate = 0.4 / 1_000_000;
	const inputCost = usage.input_tokens * inputRate;
	const outputCost = usage.output_tokens * outputRate;
	return {
		promptTokens: usage.input_tokens,
		completionTokens: usage.output_tokens,
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
			const text = await extractText(req.file.path, req.file.mimetype);

			const chunks = chunkText(text);
			const embeddings = await generateEmbeddings(chunks.map((c) => c.text));

			await vectorStore.addDocument(
				{
					originalName: req.file.originalname,
					storedName: req.file.filename,
					size: req.file.size,
					totalChars: text.length,
					uploadedAt: new Date().toISOString(),
				},
				chunks,
				embeddings,
			);

			res.json({
				filename: req.file.originalname,
				totalChars: text.length,
				chunkCount: chunks.length,
				embedded: true,
			});
		} catch (extractErr) {
			console.error("Upload error:", extractErr.message);
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
			return res.status(400).json({ error: "question is required" });
		}

		const stats = vectorStore.getStats();
		if (!stats.hasData) {
			return res
				.status(400)
				.json({
					error: "No documents in the vector store. Upload a file first.",
				});
		}

		const questionEmbedding = await generateEmbedding(question);
		const topChunks = await vectorStore.search(questionEmbedding, 3);

		const context = topChunks
			.map(
				(c, i) =>
					`[Chunk ${i + 1}] (relevance: ${(c.score * 100).toFixed(1)}%)\n${c.text}\n(source: ${c.source})`,
			)
			.join("\n\n---\n\n");

		const systemPrompt = `You are a document Q&A assistant. You are given relevant chunks from a document.

Your job:
1. Answer the user's question based ONLY on the provided chunks.
2. For each statement, cite the specific chunk number and source filename.
3. If the chunks do not contain information to answer the question, say so.
4. Keep answers concise but complete.

Return your answer in this JSON format:
{
  "answer": "Your answer text here...",
  "citations": [
    { "chunk": 1, "source": "filename.pdf", "text": "Excerpt from source..." },
    { "chunk": 2, "source": "filename.pdf", "text": "Another excerpt..." }
  ]
}`;

		const userMessage = `Context from document chunks:
${context}

Question: ${question}

Answer based on the chunks above. Cite chunk numbers and sources for each claim.`;

		const apiResponse = await queryGemini(systemPrompt, userMessage);

		const content = apiResponse.content?.[0]?.text || "";
		let parsed;
		try {
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			parsed = jsonMatch
				? JSON.parse(jsonMatch[0])
				: { answer: content, citations: [] };
		} catch {
			parsed = { answer: content, citations: [] };
		}

		const cost = calculateCost(apiResponse.usage);

		res.json({
			answer: parsed.answer || content,
			citations: parsed.citations || [],
			chunks: topChunks.map((c) => ({
				index: c.index,
				text: c.text.slice(0, 300) + (c.text.length > 300 ? "..." : ""),
				score: Math.round(c.score * 1000) / 1000,
				source: c.source,
			})),
			cost,
		});
	} catch (err) {
		console.error("POST /api/ask error:", err.message);
		res.status(500).json({ error: err.message });
	}
});

app.get("/api/stats", (req, res) => {
	res.json(vectorStore.getStats());
});

app.post("/api/clear", (req, res) => {
	vectorStore.clearStore();
	res.json({ message: "Vector store cleared" });
});

app.get("/api/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
	console.log(`Doc QA backend running on http://localhost:${PORT}`);
});
