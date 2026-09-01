import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Play, 
  Zap, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';

export default function DocumentUploader({ 
  stagedFile, 
  onStageFile, 
  onRunExtract, 
  isLoading, 
  extractionStep 
}) {
  const [dragActive, setDragActive] = useState(false);
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
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        onStageFile(file);
      } else {
        alert("Please upload a valid PDF document.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onStageFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Drag & Drop Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--brand-cyan)' : 'var(--border-subtle)'}`,
            borderRadius: '14px',
            padding: '1.75rem 2rem',
            backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)',
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            style={{ display: 'none' }}
          />

          <div style={{
            background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(59,130,246,0.15))',
            border: '1px solid rgba(56,189,248,0.35)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UploadCloud size={34} color="var(--brand-cyan)" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Upload PDF Filing for Extraction
              </h3>
              <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                Multi-Page PDF
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Drag and drop any regulatory filing or click to browse. Automatically extracts H1/H2 headings, key-value fields, and body text.
            </p>
          </div>
        </div>

        {/* Staged File Banner & Extract Trigger Button */}
        {stagedFile && (
          <div className="card" style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--bg-card)',
            border: '1.5px solid var(--brand-cyan)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="var(--brand-cyan)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {stagedFile.name}
                  </span>
                  <span className="badge badge-h1" style={{ fontSize: '0.65rem' }}>
                    Ready
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stagedFile.size ? `${(stagedFile.size / 1024).toFixed(1)} KB` : 'Filing Document'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRunExtract && onRunExtract()}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.4rem',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: 'none',
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              {isLoading ? (
                <>
                  <Zap size={16} className="animate-pulse-subtle" color="#FDE047" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="#FFFFFF" />
                  <span>Click to Extract Filing Data</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Real-time Stepper when Loading */}
        {isLoading && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--brand-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={15} className="animate-pulse-subtle" />
            <span>{extractionStep || "Processing PDF structure..."}</span>
          </div>
        )}
      </div>
    </div>
  );
}
