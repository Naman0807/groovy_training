import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

/* ---------- SVG Icon Components ---------- */

function BrainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4a4 4 0 0 1 3.5 2.1 5 5 0 0 1 2.5 4.5 4 4 0 0 1-1 7.4" />
      <path d="M12 4a4 4 0 0 0-3.5 2.1A5 5 0 0 0 6 10.6a4 4 0 0 0 1 7.4" />
      <path d="M12 20v-6" />
      <path d="M9 13h6" />
      <path d="M12 9v4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function ChunkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M18 16l-1 2.5-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function EmptyDocIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="loading-dots">
      <circle cx="4" cy="12" r="2">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" begin="0s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="12" r="2">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="12" r="2">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ---------- Main App Component ---------- */

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
  const answerRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [answer]);

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
      {/* ---------- Header ---------- */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">
            <BrainIcon />
          </div>
          <div className="header-text">
            <h1>Smart Doc Q&amp;A</h1>
            <p>Upload a document, then ask questions. Uses RAG with chunking and semantic search.</p>
          </div>
        </div>
      </header>

      {/* ---------- Stats Panel ---------- */}
      {stats && stats.hasData && (
        <section className="section-card stats-panel">
          <div className="stats-row">
            <span className="stat-item">
              <DocumentIcon />
              Documents: <strong>{stats.documentCount}</strong>
            </span>
            <span className="stat-item">
              <ChunkIcon />
              Chunks: <strong>{stats.chunkCount}</strong>
            </span>
            <button className="clear-btn" onClick={handleClear}>
              <TrashIcon /> Clear Store
            </button>
          </div>
        </section>
      )}

      {/* ---------- Upload Section ---------- */}
      <section className="section-card">
        <div className="section-header">
          <UploadIcon />
          <h2>Upload Document</h2>
        </div>

        <div className="upload-zone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}>
          <div className="upload-zone-icon">
            <UploadIcon />
          </div>
          <div className="upload-zone-text">
            {uploading ? "Uploading & embedding..." : fileName || "Choose a file or drag it here"}
          </div>
          <div className="upload-zone-hint">
            .txt or .pdf files supported
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            className="file-input-hidden"
          />
        </div>

        {uploadResult && (
          <div className="upload-result">
            <div className="upload-result-item">
              <FileIcon /> File: <strong>{uploadResult.filename || 'Unknown'}</strong>
            </div>
            <div className="upload-result-item">
              <DocumentIcon /> Characters: <strong>{(uploadResult.totalChars || 0).toLocaleString()}</strong>
            </div>
            <div className="upload-result-item">
              <ChunkIcon /> Chunks created: <strong>{uploadResult.chunkCount ?? 0}</strong>
            </div>
            <div className="upload-result-item">
              <span className="embed-success-indicator"><CheckIcon /> Embedded: <strong className="embed-success">Yes</strong></span>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Q&A Section ---------- */}
      <section className="section-card">
        <div className="section-header">
          <SearchIcon />
          <h2>Ask a Question</h2>
        </div>

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
                <LoadingDots /> Searching...
              </>
            ) : (
              <>
                <SearchIcon /> Ask
              </>
            )}
          </button>
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <div className="error-banner">
            <ErrorIcon /> {error}
          </div>
        )}

        {/* ---------- Skeleton Loading ---------- */}
        {loading && (
          <div className="skeleton-loader">
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-medium" />
          </div>
        )}

        {/* ---------- Answer ---------- */}
        {answer && (
          <div className="answer-section" ref={answerRef}>
            <div className="answer-label">
              <SparkleIcon /> Answer
            </div>
            <div className="answer-text">{answer}</div>

            {/* Retrieved Chunks */}
            {chunks.length > 0 && (
              <div className="chunks-section">
                <div className="section-subheader">
                  <GridIcon /> Retrieved Chunks
                </div>
                <div className="chunks-list">
                  {chunks.map((chunk, i) => (
                    <div key={i} className="chunk-card">
                      <div className="chunk-header">
                        <span className="chunk-source">
                          <FileIcon /> {chunk.source}
                        </span>
                        <span
                          className="score-badge"
                          style={{ backgroundColor: scoreColor(chunk.score) }}
                        >
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

            {/* Citations */}
            {citations.length > 0 && (
              <div className="citations-section">
                <div className="section-subheader">
                  <QuoteIcon /> Citations
                </div>
                {citations.map((cite, i) => (
                  <div key={i} className="citation-card">
                    <div className="citation-source">
                      <QuoteIcon /> Chunk {cite.chunk} from {cite.source}
                    </div>
                    <div className="citation-text">"{cite.text}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- Empty State ---------- */}
        {!answer && !loading && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <EmptyDocIcon />
            </div>
            <p>Upload a document, type a question, and click Ask to get started with RAG.</p>
          </div>
        )}
      </section>

      {/* ---------- Cost Badge ---------- */}
      {cost && typeof cost.promptTokens === 'number' && (
        <div className="cost-badge">
          <div className="cost-badge-header">
            <SparkleIcon />
            <span className="badge-label">Token Usage</span>
          </div>
          <div className="tokens">
            <span>Input</span>
            <span>{cost.promptTokens.toLocaleString()}</span>
          </div>
          <div className="tokens">
            <span>Output</span>
            <span>{cost.completionTokens.toLocaleString()}</span>
          </div>
          <div className="amount">
            <span>Total Cost</span>
            <span className="amount-value">$ {(cost.totalCost || 0).toFixed(4)}</span>
          </div>
          <div className="tooltip">
            Gemini 2.5 Flash<br />
            Input: ${((cost.promptTokens * 0.10) / 1_000_000).toFixed(4)} &middot; Output: $
            {((cost.completionTokens * 0.40) / 1_000_000).toFixed(4)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
