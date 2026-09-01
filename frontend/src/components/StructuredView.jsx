import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Tag, 
  Search, 
  Maximize2, 
  Table, 
  FileSearch,
  ExternalLink,
  SlidersHorizontal,
  Bookmark,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Eye
} from 'lucide-react';
import { getPageImageUrl, getDocumentPdfUrl } from '../api';
import RegulatoryAssistant from './RegulatoryAssistant';

function renderFormattedSectionText(text, isSelected) {
  if (!text) return null;
  if (!text.includes('|')) {
    return (
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        whiteSpace: 'pre-line',
        backgroundColor: 'var(--bg-app)',
        padding: '0.65rem 0.85rem',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        maxHeight: isSelected ? '320px' : '100px',
        overflowY: isSelected ? 'auto' : 'hidden',
        textOverflow: isSelected ? 'clip' : 'ellipsis'
      }}>
        {text}
      </div>
    );
  }

  const parts = text.split(/\n\s*\n/);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: isSelected ? '450px' : '160px', overflowY: isSelected ? 'auto' : 'hidden' }}>
      {parts.map((part, pIdx) => {
        const lines = part.trim().split('\n').filter(l => l.trim().startsWith('|'));
        if (lines.length >= 2 && lines[1].includes('---')) {
          const headerCells = lines[0].split('|').slice(1, -1).map(c => c.trim());
          const bodyRows = lines.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
          return (
            <div key={pIdx} style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--brand-cyan)', fontWeight: 700 }}>
                    {headerCells.map((h, i) => (
                      <th key={i} style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '0.45rem 0.75rem', color: 'var(--text-secondary)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <div key={pIdx} style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
            backgroundColor: 'var(--bg-app)',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            {part}
          </div>
        );
      })}
    </div>
  );
}

export default function StructuredView({ 
  documentData, 
  docId, 
  searchQuery = "",
  isCompact = false 
}) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(1.0);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [viewerMode, setViewerMode] = useState("canvas"); // 'canvas' or 'native'
  const [imgLoadError, setImgLoadError] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [showXRay, setShowXRay] = useState(false);

  const cardListRef = useRef(null);
  const cardRefs = useRef({});

  const extractedData = Array.isArray(documentData?.extracted_data) 
    ? documentData.extracted_data 
    : (Array.isArray(documentData?.sections) ? documentData.sections : []);

  const metadata = documentData?.metadata || {};
  const totalPages = documentData?.statistics?.total_pages || 1;

  useEffect(() => {
    if (extractedData.length > 0 && !selectedSectionId) {
      setSelectedSectionId(extractedData[0].id);
      setActivePage(extractedData[0].page || 1);
    }
  }, [extractedData]);

  // Category counts
  const categoryCounts = { "ALL": extractedData.length };
  extractedData.forEach(s => {
    if (s && s.category) {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    }
  });
  const categories = Object.keys(categoryCounts);

  // Filter logic
  const filteredSections = extractedData.filter(s => {
    if (!s) return false;
    if (selectedCategory !== "ALL" && s.category !== selectedCategory) return false;
    if (selectedLevel !== "ALL" && s.level !== selectedLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHeading = (s.heading || "").toLowerCase().includes(q);
      const matchText = (s.text || "").toLowerCase().includes(q);
      const matchFields = s.fields && Object.entries(s.fields).some(([k, v]) => 
        k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
      );
      if (!matchHeading && !matchText && !matchFields) return false;
    }
    return true;
  });

  const selectedSection = extractedData.find(s => s && s.id === selectedSectionId);

  const handleSelectSection = (sec) => {
    if (!sec) return;
    setSelectedSectionId(sec.id);
    if (sec.page && sec.page !== activePage) {
      setActivePage(sec.page);
      setImgLoadError(false);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyFieldValue = (val, fieldKey) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handlePrevPage = () => {
    if (activePage > 1) {
      setActivePage(prev => prev - 1);
      setImgLoadError(false);
    }
  };

  const handleNextPage = () => {
    if (activePage < totalPages) {
      setActivePage(prev => prev + 1);
      setImgLoadError(false);
    }
  };

  const currentScale = 1.6 * pdfZoom;
  const currentImageUrl = docId ? getPageImageUrl(docId, activePage, 2.0) : '';

  return (
    <div className="dual-pane-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(420px, 1.15fr) minmax(400px, 1fr)',
      gap: '1.25rem',
      height: 'calc(100vh - 250px)',
      minHeight: '620px'
    }}>
      {/* ================= LEFT PANE: EXTRACTED STRUCTURE ================= */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Executive Regulatory HUD & Copilot Trigger */}
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--brand-emerald)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '6px'
            }}>
              <ShieldCheck size={13} />
              <span>SERFF Verified</span>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{metadata.company_name || 'Carrier Document'}</strong>
              {metadata.state && <span> • State: <strong style={{ color: 'var(--brand-cyan)' }}>{metadata.state}</strong></span>}
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-cyan)',
              color: '#090D16',
              fontWeight: 700,
              fontSize: '0.76rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)'
            }}
          >
            <Bot size={14} />
            <span>Ask AI Copilot</span>
            <Sparkles size={12} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} color="var(--brand-cyan)" />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                Extracted Sections
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                {filteredSections.length} of {extractedData.length}
              </span>
            </div>

            {/* Level Pills */}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {["ALL", "H1", "H2"].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: selectedLevel === lvl ? 'var(--brand-cyan)' : 'transparent',
                    color: selectedLevel === lvl ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            paddingBottom: '0.2rem'
          }}>
            {categories.map(cat => {
              const isCatActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    border: `1px solid ${isCatActive ? 'var(--brand-cyan)' : 'var(--border-subtle)'}`,
                    backgroundColor: isCatActive ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                    color: isCatActive ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {cat} ({categoryCounts[cat]})
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Section Cards Stream */}
        <div
          ref={cardListRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          {filteredSections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <FileSearch size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>No sections matched your active filters.</p>
            </div>
          ) : (
            filteredSections.map((sec) => {
              if (!sec) return null;
              const isSelected = sec.id === selectedSectionId;
              const hasFields = sec.fields && Object.keys(sec.fields).length > 0;
              const isH1 = sec.level === 'H1';

              return (
                <div
                  key={sec.id}
                  ref={el => cardRefs.current[sec.id] = el}
                  onClick={() => handleSelectSection(sec)}
                  style={{
                    borderRadius: '10px',
                    border: `1.5px solid ${isSelected ? 'var(--brand-cyan)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-card)',
                    boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.18)' : 'none',
                    padding: isCompact ? '0.75rem 0.9rem' : '1rem 1.15rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${isH1 ? 'badge-h1' : 'badge-h2'}`}>
                        {sec.level}
                      </span>
                      <h4 style={{
                        fontSize: isH1 ? '0.98rem' : '0.88rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--brand-cyan)' : 'var(--text-main)',
                        lineHeight: 1.3
                      }}>
                        {sec.heading}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                        Pg {sec.page}
                      </span>
                      <button
                        title="Copy section text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(sec.text || sec.heading, sec.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === sec.id ? 'var(--brand-emerald)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                      >
                        {copiedId === sec.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Category Stamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Category: <strong style={{ color: 'var(--text-secondary)' }}>{sec.category}</strong>
                    </span>
                    {sec.word_count > 0 && (
                      <>
                        <span style={{ color: 'var(--border-subtle)' }}>•</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {sec.word_count} words
                        </span>
                      </>
                    )}
                  </div>

                  {/* Key-Value Fields Grid */}
                  {hasFields && (
                    <div style={{
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.5rem',
                      marginBottom: sec.text ? '0.65rem' : '0',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {Object.entries(sec.fields).map(([k, v]) => (
                        <div
                          key={k}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyFieldValue(String(v), `${sec.id}-${k}`);
                          }}
                          title="Click to copy field value"
                          style={{
                            fontSize: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            padding: '0.2rem 0.3rem',
                            borderRadius: '4px'
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                            {k}
                          </span>
                          <span style={{ color: copiedField === `${sec.id}-${k}` ? 'var(--brand-emerald)' : 'var(--text-main)', fontWeight: 600 }}>
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Narrative Body Text & Structured Tables */}
                  {sec.text && renderFormattedSectionText(sec.text, isSelected)}

                  {/* Empty Parent Section Helper & Child Subsections Preview */}
                  {(() => {
                    const childSubsections = extractedData.filter(cs => cs && cs.parent_heading === sec.heading && cs.id !== sec.id);
                    if (childSubsections.length > 0) {
                      return (
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Layers size={12} color="var(--brand-cyan)" />
                            <span>Nested Subsections ({childSubsections.length}):</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {childSubsections.map(cs => (
                              <button
                                key={cs.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSection(cs);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--brand-cyan)';
                                  e.currentTarget.style.color = 'var(--brand-cyan)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                  e.currentTarget.style.color = 'var(--text-main)';
                                }}
                              >
                                <span className="badge badge-h2" style={{ padding: '0.05rem 0.35rem', fontSize: '0.65rem' }}>H2</span>
                                <span>{cs.heading}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>• Pg {cs.page}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (!hasFields && !sec.text) {
                      return (
                        <div style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          padding: '0.45rem 0.75rem',
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: '6px',
                          border: '1px dashed var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem'
                        }}>
                          <Layers size={13} color="var(--brand-cyan)" />
                          <span>Parent Section Heading • Structure details organized in child subsection(s)</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= RIGHT PANE: SYNCHRONIZED PDF CANVAS ================= */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* PDF Viewer Header Toolbar */}
        <div style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Page Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={handlePrevPage}
              disabled={activePage <= 1}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem 0.45rem' }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', minWidth: '95px', textAlign: 'center' }}>
              Page {activePage} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={activePage >= totalPages}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem 0.45rem' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {viewerMode === 'canvas' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  onClick={() => setPdfZoom(z => Math.max(0.7, z - 0.15))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.4rem' }}
                >
                  <ZoomOut size={14} />
                </button>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', minWidth: '40px', textAlign: 'center' }}>
                  {Math.round(pdfZoom * 100)}%
                </span>
                <button
                  onClick={() => setPdfZoom(z => Math.min(2.0, z + 0.15))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.4rem' }}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}

            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              padding: '0.15rem',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => { setViewerMode('canvas'); setImgLoadError(false); }}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: viewerMode === 'canvas' ? 'var(--brand-cyan)' : 'transparent',
                  color: viewerMode === 'canvas' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Canvas
              </button>
              <button
                onClick={() => setViewerMode('native')}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: viewerMode === 'native' ? 'var(--brand-cyan)' : 'transparent',
                  color: viewerMode === 'native' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Native PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF Visual Canvas Body */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: '#0F172A'
        }}>
          {/* Main Visual Stage */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            {viewerMode === 'canvas' && !imgLoadError ? (
              <div style={{
                position: 'relative',
                boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                borderRadius: '4px',
                overflow: 'hidden',
                transform: `scale(${pdfZoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease'
              }}>
                {/* High-Res Page Render */}
                <img
                  src={getPageImageUrl(docId, activePage, 2.0)}
                  alt={`PDF Page ${activePage}`}
                  onError={() => setImgLoadError(true)}
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    width: '600px',
                    height: 'auto',
                    backgroundColor: '#FFFFFF'
                  }}
                />

                {/* Animated Bounding Box Highlight Overlay */}
                {selectedSection && selectedSection.page === activePage && Array.isArray(selectedSection.bbox) && selectedSection.bbox.length >= 4 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(selectedSection.bbox[0] / 612) * 100}%`,
                      top: `${(selectedSection.bbox[1] / 792) * 100}%`,
                      width: `${((selectedSection.bbox[2] - selectedSection.bbox[0]) / 612) * 100}%`,
                      height: `${Math.max(18, (selectedSection.bbox[3] - selectedSection.bbox[1]) / 792 * 100)}%`,
                      backgroundColor: 'rgba(56, 189, 248, 0.38)',
                      border: '2px solid #38BDF8',
                      borderRadius: '4px',
                      boxShadow: '0 0 20px rgba(56, 189, 248, 0.8)',
                      pointerEvents: 'none',
                      animation: 'pulseGlow 2s infinite ease-in-out'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-22px',
                      left: 0,
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}>
                      {selectedSection.level}: {selectedSection.heading?.slice(0, 26)}...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <iframe
                src={`${getDocumentPdfUrl(docId)}#page=${activePage}`}
                title="Native PDF Viewer"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>

          {/* Quick Page Jump Rail */}
          {totalPages > 1 && (
            <div style={{
              width: '60px',
              borderLeft: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              overflowY: 'auto',
              padding: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => {
                const isActive = activePage === pNum;
                return (
                  <button
                    key={pNum}
                    onClick={() => { setActivePage(pNum); setImgLoadError(false); }}
                    style={{
                      border: `1px solid ${isActive ? 'var(--brand-cyan)' : 'var(--border-subtle)'}`,
                      borderRadius: '6px',
                      padding: '0.35rem 0.2rem',
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                      color: isActive ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    P.{pNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Regulatory AI Copilot Modal Drawer */}
      <RegulatoryAssistant 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
        documentData={documentData} 
        onSelectSection={handleSelectSection} 
      />
    </div>
  );
}
