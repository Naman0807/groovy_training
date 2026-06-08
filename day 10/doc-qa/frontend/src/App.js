import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [citations, setCitations] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* ignore */ }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setError("");
    setUploadResult(null);

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
      fetchStats();
    } catch (err) {
      setError("Failed to upload file: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer(null);
    setCitations([]);
    setChunks([]);

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
      setChunks(data.chunks || []);
      setCost(data.cost);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await fetch(`${API_BASE}/api/clear`, { method: "POST" });
      setUploadResult(null);
      setAnswer(null);
      setCitations([]);
      setChunks([]);
      setCost(null);
      fetchStats();
    } catch { /* ignore */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const scoreColor = (score) => {
    if (score >= 0.7) return "#22c55e";
    if (score >= 0.4) return "#f59e0b";
    return "#ef4444";
  };

  const scoreLabel = (score) => {
    if (score >= 0.7) return "high";
    if (score >= 0.4) return "medium";
    return "low";
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Doc Q&A</h1>
        <p>Upload a document, then ask questions. Uses RAG with chunking and semantic search.</p>
      </header>

      {stats && stats.hasData && (
        <section className="section-card stats-panel">
          <div className="stats-row">
            <span className="stat-item">Documents: <strong>{stats.documentCount}</strong></span>
            <span className="stat-item">Chunks: <strong>{stats.chunkCount}</strong></span>
            <button className="clear-btn" onClick={handleClear}>Clear Store</button>
          </div>
        </section>
      )}

      <section className="section-card">
        <h2>Upload Document</h2>
        <div className="file-upload-area">
          <button className="file-upload-btn" onClick={() => fileInputRef.current?.click()}>
            Upload File (.txt / .pdf)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          {uploading && <span className="file-info uploading">Uploading & embedding...</span>}
          {fileName && !uploading && <span className="file-info">{fileName}</span>}
        </div>

        {uploadResult && (
          <div className="upload-result">
            <div className="upload-result-item">File: <strong>{uploadResult.filename || 'Unknown'}</strong></div>
            <div className="upload-result-item">Characters: <strong>{(uploadResult.totalChars || 0).toLocaleString()}</strong></div>
            <div className="upload-result-item">Chunks created: <strong>{uploadResult.chunkCount ?? 0}</strong></div>
            <div className="upload-result-item">Embedded: <strong className="embed-success">Yes</strong></div>
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
            placeholder="e.g., What are the main topics covered?"
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

        {answer && (
          <div className="answer-section">
            <div className="answer-text">{answer}</div>

            {chunks.length > 0 && (
              <div className="chunks-section">
                <h3>Retrieved Chunks</h3>
                <div className="chunks-list">
                  {chunks.map((chunk, i) => (
                    <div key={i} className="chunk-card">
                      <div className="chunk-header">
                        <span className="chunk-source">{chunk.source}</span>
                        <span className={`score-badge score-${scoreLabel(chunk.score)}`}
                              style={{ backgroundColor: scoreColor(chunk.score) }}>
                          {(chunk.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="relevance-bar-container">
                        <div className="relevance-bar" style={{
                          width: `${Math.min(chunk.score * 100, 100)}%`,
                          backgroundColor: scoreColor(chunk.score),
                        }} />
                      </div>
                      <div className="chunk-text-preview">{chunk.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {citations.length > 0 && (
              <div className="citations-section">
                <h3>Citations</h3>
                {citations.map((cite, i) => (
                  <div key={i} className="citation-card">
                    <div className="citation-source">Chunk {cite.chunk} from {cite.source}</div>
                    <div className="citation-text">"{cite.text}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!answer && !loading && !error && (
          <div className="empty-state">
            <p>Upload a document, type a question, and click Ask to get started with RAG.</p>
          </div>
        )}
      </section>

        {cost && typeof cost.promptTokens === 'number' && (
          <div className="cost-badge">
            <span className="tokens">
              {cost.promptTokens.toLocaleString()} in · {cost.completionTokens.toLocaleString()} out
            </span>
            <hr className="divider" />
            <span className="amount">$ {(cost.totalCost || 0).toFixed(4)}</span>
          <div className="tooltip">
            Gemini 2.5 Flash<br />
            Input: ${((cost.promptTokens * 0.10) / 1_000_000).toFixed(4)} · Output: $
            {((cost.completionTokens * 0.40) / 1_000_000).toFixed(4)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
