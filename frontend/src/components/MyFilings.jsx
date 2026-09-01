import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  UploadCloud, 
  ArrowRight, 
  Download, 
  Layers, 
  Calendar,
  Building,
  PlusCircle,
  FileCheck
} from 'lucide-react';

export default function MyFilings({ 
  recentDocs = [], 
  onOpenDoc, 
  onNavigateToUpload,
  onExportDoc 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = recentDocs.filter(d => {
    const q = searchTerm.toLowerCase();
    return (
      (d.filename && d.filename.toLowerCase().includes(q)) ||
      (d.company_name && d.company_name.toLowerCase().includes(q)) ||
      (d.state && d.state.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            My Regulatory Filings
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            All documents processed and stored in your authenticated workspace
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToUpload && onNavigateToUpload()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: 'var(--brand-cyan)',
            color: '#090D16',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
          }}
        >
          <PlusCircle size={16} />
          <span>Upload Filing</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Filter filings by document name, insurance company, or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            width: '100%'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filings Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} color="var(--brand-cyan)" />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {searchTerm ? 'No matching filings found' : 'No Filings Uploaded Yet'}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '400px', margin: 0 }}>
              {searchTerm ? 'Try searching with a different filing name or company keyword.' : 'Upload your first regulatory filing PDF to view its extracted structure and sections.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => onNavigateToUpload && onNavigateToUpload()}
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--brand-cyan)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
                <span>Upload New Filing</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Document Name</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Filing Company</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Pages</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Headings</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Words</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, idx) => (
                  <tr 
                    key={doc.id || idx}
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={18} color="var(--brand-cyan)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{doc.filename}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.state ? `State: ${doc.state}` : 'Regulatory Filing'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building size={14} color="var(--text-muted)" />
                        <span>{doc.company_name || 'Not specified'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {doc.total_pages}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: 'var(--brand-cyan)', fontWeight: 700, fontSize: '0.78rem' }}>
                        {doc.total_headings} sections
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {doc.total_words?.toLocaleString() || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onOpenDoc && onOpenDoc(doc.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.9rem',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: 'var(--brand-cyan)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>Open</span>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
