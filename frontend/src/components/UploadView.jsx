import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  FileCode,
  Zap,
  Sparkles
} from 'lucide-react';

export default function UploadView({ onUploadAndExtract, onExtract, isLoading, extractionStep }) {
  const [stagedFile, setStagedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndStage(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndStage(e.target.files[0]);
    }
  };

  const validateAndStage = (file) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF document.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("PDF size exceeds the 50MB limit.");
      return;
    }
    setStagedFile(file);
  };

  const handleStartExtraction = () => {
    if (!stagedFile) return;
    const startFn = onExtract || onUploadAndExtract;
    if (typeof startFn === 'function') {
      startFn(stagedFile);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* View Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
          Upload PDF Filing for Extraction
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
          Ingest multi-page regulatory filings, policy contracts, or statutory exhibits to extract structured $H1/H2$ outlines and attributes.
        </p>
      </div>

      {/* Upload Dropzone Card */}
      <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf,application/pdf" 
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--brand-cyan)' : 'rgba(56, 189, 248, 0.3)'}`,
            borderRadius: '14px',
            backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
            padding: '3rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.2)'
          }}>
            <UploadCloud size={32} color="var(--brand-cyan)" />
          </div>

          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Drag and drop your PDF here, or <span style={{ color: 'var(--brand-cyan)' }}>browse files</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Supports regulatory insurance filings, SERFF submissions & multi-page PDFs (up to 50MB)
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {stagedFile && !isLoading && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textAlign: 'left' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="var(--brand-cyan)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {stagedFile.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(stagedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                </div>
              </div>
            </div>

            <button
              onClick={handleStartExtraction}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.4rem',
                backgroundColor: 'var(--brand-cyan)',
                color: '#090D16',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={16} fill="#090D16" />
              <span>Extract Filing Data</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isLoading && (
          <div style={{
            marginTop: '1.5rem',
            padding: '2rem 1.5rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Processing PDF Document
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--brand-cyan)', marginTop: '0.3rem', fontWeight: 600 }}>
                {extractionStep || 'Analyzing document layout and geometry...'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem' }}>
          <Sparkles size={18} color="var(--brand-cyan)" flexShrink={0} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Dynamic Classification</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Statistical font ratio & geometry scoring</div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem' }}>
          <ShieldCheck size={18} color="var(--brand-emerald)" flexShrink={0} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Watermark Filtration</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Automatic header & stamp stripping</div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem' }}>
          <FileCode size={18} color="#A78BFA" flexShrink={0} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Export Ready</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Structured JSON, CSV & Markdown outputs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
