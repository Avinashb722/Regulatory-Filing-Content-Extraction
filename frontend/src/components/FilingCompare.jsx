import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { compareDocuments } from '../api';

export default function FilingCompare({ recentDocs = [], currentDocId = null }) {
  const docsList = Array.isArray(recentDocs) ? recentDocs : [];
  const [doc1Id, setDoc1Id] = useState(currentDocId || (docsList[0]?.id || ''));
  const [doc2Id, setDoc2Id] = useState(docsList[1]?.id || (docsList[0]?.id || ''));
  const [diffResult, setDiffResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (doc1Id && doc2Id && doc1Id !== doc2Id) {
      runCompare();
    }
  }, [doc1Id, doc2Id]);

  const runCompare = async () => {
    if (!doc1Id || !doc2Id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await compareDocuments(doc1Id, doc2Id);
      setDiffResult(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Comparison failed. Make sure both filings are uploaded.");
    } finally {
      setIsLoading(false);
    }
  };

  if (docsList.length < 2 && !currentDocId) {
    return (
      <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <GitCompare size={28} color="var(--brand-cyan)" />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Side-by-Side Filing Diff Comparator
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
          Upload at least two filings to compare section-level differences, detect modified clauses, and inspect added or removed provisions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Selector Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitCompare size={18} color="var(--brand-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Side-by-Side Filing Comparison & Diff
            </h3>
          </div>

          <button
            onClick={runCompare}
            disabled={isLoading || !doc1Id || !doc2Id || doc1Id === doc2Id}
            className="btn btn-primary btn-sm"
          >
            {isLoading ? <RefreshCw size={14} className="animate-pulse-subtle" /> : <GitCompare size={14} />} Compare Now
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              BASELINE FILING (DOC A)
            </label>
            <select
              value={doc1Id}
              onChange={(e) => setDoc1Id(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              {docsList.map(s => (
                <option key={s.id} value={s.id}>{s.filename} ({s.company_name})</option>
              ))}
              {docsList.length === 0 && currentDocId && (
                <option value={currentDocId}>Active Uploaded Document</option>
              )}
            </select>
          </div>

          <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <ArrowRight size={20} color="var(--text-muted)" />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              COMPARISON FILING (DOC B)
            </label>
            <select
              value={doc2Id}
              onChange={(e) => setDoc2Id(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              {docsList.map(s => (
                <option key={s.id} value={s.id}>{s.filename} ({s.company_name})</option>
              ))}
              {docsList.length === 0 && (
                <option value="">Upload another document to compare</option>
              )}
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '0.85rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: 'var(--brand-rose)',
            fontSize: '0.8rem'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {diffResult && (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modified Sections</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-amber)' }}>
                {diffResult.summary?.modified_sections || 0}
              </div>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique to Doc B (Added)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                {diffResult.summary?.added_sections || 0}
              </div>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique to Doc A (Removed)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-rose)' }}>
                {diffResult.summary?.removed_sections || 0}
              </div>
            </div>
          </div>

          {/* Section Diff Table */}
          <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
              Section-Level Differences
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Section Heading</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Change Type</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Doc A Content Preview</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Doc B Content Preview</th>
                </tr>
              </thead>
              <tbody>
                {(diffResult.section_differences || []).slice(0, 40).map((s, idx) => {
                  const isMod = s.status === 'MODIFIED';
                  const isAdd = s.status === 'ADDED_IN_DOC2';
                  const isRem = s.status === 'REMOVED_IN_DOC2';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.heading}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {isMod && <span className="badge badge-warning">Modified</span>}
                        {isAdd && <span className="badge badge-success">+ Added</span>}
                        {isRem && <span className="badge badge-danger">- Removed</span>}
                        {s.status === 'IDENTICAL' && <span className="badge badge-neutral">Identical</span>}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.doc1_text_preview || "—"}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.doc2_text_preview || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
