import React from 'react';
import { 
  ShieldCheck, 
  Home, 
  Files, 
  UploadCloud, 
  Layers, 
  GitCompare, 
  Download, 
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenExport, 
  currentUser, 
  onLogout,
  hasDocument = false,
  isOpen = false,
  onClose
}) {
  const handleItemClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'filings', label: 'My Filings', icon: <Files size={18} /> },
    { id: 'upload', label: 'Upload Filing', icon: <UploadCloud size={18} /> },
  ];

  const analysisNavItems = [
    { id: 'workspace', label: 'Extraction Workspace', icon: <Layers size={18} />, disabled: !hasDocument },
    { id: 'compare', label: 'Compare Filings', icon: <GitCompare size={18} /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
            padding: '0.55rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <ShieldCheck size={22} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                LEXI<span style={{ color: 'var(--brand-cyan)' }}>EXTRACT</span>
              </h1>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              PDF Extraction Intelligence
            </span>
          </div>
        </div>

        {onClose && (
          <button
            className="mobile-nav-toggle"
            onClick={onClose}
            style={{ padding: '0.35rem' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.5rem 0.4rem 0.5rem' }}>
          Overview
        </div>

        {primaryNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: isActive ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ color: isActive ? 'var(--brand-cyan)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '1rem 0.5rem 0.4rem 0.5rem' }}>
          Intelligence Views
        </div>

        {analysisNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleItemClick(item.id)}
              disabled={item.disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: item.disabled ? 'rgba(148, 163, 184, 0.4)' : (isActive ? 'var(--brand-cyan)' : 'var(--text-secondary)'),
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.6 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ color: isActive ? 'var(--brand-cyan)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        {hasDocument && (
          <button
            onClick={onOpenExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '0.25rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={18} color="var(--brand-emerald)" />
            <span>Export Hub (JSON/CSV)</span>
          </button>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User Session Footer */}
      {currentUser && (
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'transparent'
        }}>
          <div style={{
            padding: '0.65rem 0.75rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
              }}>
                {(currentUser.full_name || currentUser.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.full_name || currentUser.email}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Logout Session"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-rose)'; e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
