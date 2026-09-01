import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  Copy, 
  Check 
} from 'lucide-react';
import { getExportUrl } from '../api';

export default function ExportModal({ isOpen, onClose, docId, documentData }) {
  const [copiedFormat, setCopiedFormat] = useState(null);

  if (!isOpen || !docId || !documentData) return null;

  const handleCopy = (format) => {
    let content = "";
    if (format === "json") {
      content = JSON.stringify(documentData, null, 2);
    } else if (format === "markdown") {
      const meta = documentData.metadata || {};
      content = `# ${meta.product_name || meta.filename}\nCompany: ${meta.company_name}\n\n`;
      documentData.extracted_data.forEach(s => {
        content += `## ${s.heading} (Page ${s.page})\n${s.text}\n\n`;
      });
    }

    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '1.75rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Export Structured Filing Data
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Select your preferred export schema for compliance tracking and data ingestion.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* JSON Option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.15)' }}>
                <FileJson size={22} color="var(--accent-cyan)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Structured JSON
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Complete AST with bounding boxes, key-values, and hierarchy tree.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => handleCopy("json")}
                className="btn btn-secondary btn-sm"
                title="Copy to clipboard"
              >
                {copiedFormat === "json" ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              </button>
              <a
                href={getExportUrl(docId, 'json')}
                download
                className="btn btn-primary btn-sm"
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>

          {/* Markdown Option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                <FileText size={22} color="var(--accent-purple)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Clean Markdown (.md)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Formatted document headings, tables, and sections.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => handleCopy("markdown")}
                className="btn btn-secondary btn-sm"
                title="Copy to clipboard"
              >
                {copiedFormat === "markdown" ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              </button>
              <a
                href={getExportUrl(docId, 'markdown')}
                download
                className="btn btn-primary btn-sm"
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>

          {/* CSV Option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <FileSpreadsheet size={22} color="var(--accent-emerald)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Excel / CSV Spreadsheet
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Tabular heading/text pairs with page numbers and categories.
                </div>
              </div>
            </div>

            <a
              href={getExportUrl(docId, 'csv')}
              download
              className="btn btn-primary btn-sm"
            >
              <Download size={14} /> Download
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
