import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  ListTree 
} from 'lucide-react';

export default function HierarchyTree({ hierarchy = [] }) {
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const treeNodes = Array.isArray(hierarchy) ? hierarchy : [];

  const toggleNode = (id) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (treeNodes.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '12px',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <ListTree size={26} color="var(--brand-cyan)" />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Document Outline Tree (AST)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
          Upload a document to view the parent-child outline hierarchy of sections and subsections.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem', minHeight: '500px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ListTree size={20} color="var(--brand-purple)" />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Hierarchical Document Tree (AST)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Structured parent-child outline of sections and subsections.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setCollapsedNodes({})}
            className="btn btn-secondary btn-sm"
          >
            Expand All
          </button>
          <button
            onClick={() => {
              const all = {};
              treeNodes.forEach(n => { if (n?.id) all[n.id] = true; });
              setCollapsedNodes(all);
            }}
            className="btn btn-secondary btn-sm"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {treeNodes.map((node) => {
          if (!node) return null;
          const isCollapsed = !!collapsedNodes[node.id];
          const hasChildren = Array.isArray(node.children) && node.children.length > 0;
          const fields = node.fields || node.key_values || {};
          const hasKv = Object.keys(fields).length > 0;

          return (
            <div
              key={node.id || Math.random()}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                overflow: 'hidden'
              }}
            >
              {/* Parent Row */}
              <div
                onClick={() => toggleNode(node.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-app)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {hasChildren ? (
                    isCollapsed ? <ChevronRight size={18} color="var(--brand-cyan)" /> : <ChevronDown size={18} color="var(--brand-cyan)" />
                  ) : (
                    <Folder size={18} color="var(--brand-cyan)" />
                  )}

                  <span className="badge badge-h1">{node.level || "H1"}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {node.heading}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {node.category && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                      {node.category}
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pg {node.page || 1}
                  </span>
                  {hasChildren && (
                    <span className="badge badge-h2" style={{ fontSize: '0.65rem' }}>
                      {node.children.length} sub-items
                    </span>
                  )}
                </div>
              </div>

              {/* Node Body */}
              {!isCollapsed && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
                  {/* Key values */}
                  {hasKv && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.65rem',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {Object.entries(fields).map(([k, v]) => (
                        <div key={k} style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k}: </span>
                          <span style={{ color: 'var(--text-main)' }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Body Text */}
                  {node.text && (
                    <div style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-line',
                      marginBottom: hasChildren ? '1rem' : '0',
                      backgroundColor: 'var(--bg-app)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {node.text}
                    </div>
                  )}

                  {/* Children H2 Nodes */}
                  {hasChildren && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem', borderLeft: '2px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                      {node.children.map((child) => {
                        const childFields = child.fields || child.key_values || {};
                        return (
                          <div
                            key={child.id || Math.random()}
                            style={{
                              padding: '0.75rem',
                              backgroundColor: 'var(--bg-app)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="badge badge-h2">{child.level || "H2"}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                  {child.heading}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Pg {child.page || 1}
                              </span>
                            </div>

                            {Object.keys(childFields).length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                {Object.entries(childFields).map(([k, v]) => (
                                  <div key={k}><strong style={{ color: 'var(--text-muted)' }}>{k}:</strong> {String(v)}</div>
                                ))}
                              </div>
                            )}

                            {child.text && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                                {child.text}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
