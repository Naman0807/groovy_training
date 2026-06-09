import React, { useState, useRef } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3004";
  
function App() {
	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState(null);
	const [citations, setCitations] = useState([]);
	const [retrievedChunks, setRetrievedChunks] = useState([]);
	const [cost, setCost] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [fileName, setFileName] = useState("");
	const [uploadResult, setUploadResult] = useState(null);
	const [storeStats, setStoreStats] = useState(null);
	const fileInputRef = useRef(null);

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		setFileName(file.name);
		setUploadResult(null);
		setError("");

		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch(`${API_BASE}/api/upload`, {
				method: "POST",
				body: formData,
			});
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || "Upload failed");
			}
			const data = await res.json();
			setUploadResult(data);
			setStoreStats(data.stats);
		} catch (err) {
			setError("Upload failed: " + err.message);
		}
	};

	const handleAsk = async () => {
		if (!question.trim()) return;

		setLoading(true);
		setError("");
		setAnswer(null);
		setCitations([]);
		setRetrievedChunks([]);

		try {
			const res = await fetch(`${API_BASE}/api/ask`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question }),
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || "API request failed");
			}

			const data = await res.json();
			setAnswer(data.answer);
			setCitations(data.citations || []);
			setRetrievedChunks(data.chunks || []);
			setCost(data.cost);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleAsk();
		}
	};

	const scoreColor = (score) => {
		if (score > 0.7) return "var(--score-high)";
		if (score > 0.4) return "var(--score-mid)";
		return "var(--score-low)";
	};

	const scoreClass = (score) => {
		if (score > 0.7) return "score-high";
		if (score > 0.4) return "score-mid";
		return "score-low";
	};

	return (
		<div className="app">
			<header className="app-header">
				<h1>RAG Doc Q&A v2</h1>
				<p>
					Upload a document &rarr; chunks are embedded with Google &rarr; stored
					in vector store &rarr; retrieve top-3 relevant chunks per question.
				</p>
			</header>

			<section className="section-card">
				<h2>Upload Document</h2>
				<div className="file-upload-area">
					<button
						className="file-upload-btn"
						onClick={() => fileInputRef.current?.click()}
					>
						Choose File (.txt / .md / .pdf)
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".txt,.md,.pdf"
						onChange={handleFileUpload}
						style={{ display: "none" }}
					/>
					{fileName && <span className="file-info">{fileName}</span>}
				</div>

				{uploadResult && (
					<div className="upload-result">
						<div className="upload-stat">
							<span className="stat-label">Chunks created</span>
							<span className="stat-value">{uploadResult.totalChunks}</span>
						</div>
						<div className="upload-stat">
							<span className="stat-label">Chunk size</span>
							<span className="stat-value">{uploadResult.chunkSize} chars</span>
						</div>
						<div className="upload-stat">
							<span className="stat-label">Overlap</span>
							<span className="stat-value">
								{uploadResult.chunkOverlap} chars
							</span>
						</div>
						<div className="upload-stat">
							<span className="stat-label">Total chars</span>
							<span className="stat-value">
								{uploadResult.totalChars.toLocaleString()}
							</span>
						</div>
						<div className="upload-stat">
							<span className="stat-label">Embedding cost</span>
							<span className="stat-value">
								${uploadResult.embeddingCost.cost.toFixed(6)}
							</span>
						</div>
						<div className="upload-stat">
							<span className="stat-label">Model</span>
							<span className="stat-value">
								{uploadResult.embeddingCost.model}
							</span>
						</div>
					</div>
				)}

				{storeStats && storeStats.documentCount > 0 && (
					<div className="store-info">
						<strong>Vector store:</strong> {storeStats.documentCount}{" "}
						document(s), {storeStats.chunkCount} chunks total
					</div>
				)}
			</section>

			<section className="section-card">
				<h2>Ask a Question</h2>
				<div className="qa-input-row">
					<input
						className="qa-input"
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="e.g., What is this document about?"
						disabled={loading}
					/>
					<button
						className="ask-btn"
						onClick={handleAsk}
						disabled={loading || !question.trim()}
					>
						{loading ? (
							<>
								<span className="spinner" /> Searching...
							</>
						) : (
							"Ask"
						)}
					</button>
				</div>

				{error && <div className="error-banner">{error}</div>}

				{retrievedChunks.length > 0 && (
					<div className="chunks-section fade-in-up">
						<h3>Retrieved Chunks (top {retrievedChunks.length})</h3>
						<div className="chunks-list">
							{retrievedChunks.map((chunk, i) => (
								<div
									key={i}
									className={`chunk-card ${scoreClass(chunk.score)}`}
									style={{ borderLeftColor: scoreColor(chunk.score) }}
								>
									<div className="chunk-header">
										<span className="chunk-source">{chunk.source}</span>
										<span
											className="chunk-score"
											style={{ color: scoreColor(chunk.score) }}
										>
											{(chunk.score * 100).toFixed(1)}% match
										</span>
									</div>
									<div className="chunk-text">{chunk.text}</div>
								</div>
							))}
						</div>
					</div>
				)}

				{answer && (
					<div className="answer-section">
						<div className="answer-text">{answer}</div>

						{citations.length > 0 && (
							<div className="citations-section fade-in-up">
								<h3>Citations</h3>
								{citations.map((cite, i) => (
									<div key={i} className="citation-card">
										<div className="citation-page">
											Chunk {cite.chunk} &middot; {cite.source}
										</div>
										<div className="citation-text">
											&ldquo;{cite.text}&rdquo;
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{!answer && !retrievedChunks.length && !loading && !error && (
					<div className="empty-state">
						<div className="empty-icon">&#9881;</div>
						<p>Upload a document, then type a question to search with RAG.</p>
					</div>
				)}
			</section>

			{cost && (
				<div className="cost-badge fade-in">
					<span className="cost-title">RAG Query</span>
					<span className="tokens">
						{cost.promptTokens.toLocaleString()} in &middot;{" "}
						{cost.completionTokens.toLocaleString()} out
					</span>
					<hr className="divider" />
					<span className="amount">&asymp; ${cost.totalCost.toFixed(4)}</span>
					<span className="retrieval-info">
						{cost.retrievalChunks} chunks retrieved from{" "}
						{cost.totalChunksInStore} total
					</span>
					<div className="tooltip">
						Google Gemini 2.5 Flash
						<br />
						Input: ${((cost.promptTokens * 0.1) / 1_000_000).toFixed(4)}{" "}
						&middot; Output: $
						{((cost.completionTokens * 0.4) / 1_000_000).toFixed(4)}
						<br />
						Embedding model: text-embedding-004
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
