import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Search, 
  SlidersHorizontal,
  UploadCloud,
  Layers,
  ChevronRight,
  Activity,
  Menu
} from 'lucide-react';

export default function Header({ 
  theme, 
  toggleTheme, 
  activeDoc, 
  searchQuery, 
  setSearchQuery,
  isCompact,
  setIsCompact,
  activeTab,
  setActiveTab,
  onToggleSidebar
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'filings': return 'Filing Repository';
      case 'upload': return 'Upload & Extract Filing';
      case 'workspace': return 'Extraction Workspace';
      case 'compare': return 'Filing Comparator';
      default: return 'Workspace';
    }
  };

  return (
    <header className="glass-header" style={{
      padding: '0.85rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(13, 18, 31, 0.85)'
    }}>
      {/* Left: Hamburger & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <button
          className="mobile-nav-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={18} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>LexiExtract</span>
          <ChevronRight size={14} color="var(--border-focus)" />
          <span style={{ color: 'var(--brand-cyan)', fontWeight: 500 }}>{getTabLabel()}</span>
        </div>

        {activeDoc && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.25rem 0.65rem',
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem'
          }}>
            <FileText size={13} color="var(--brand-cyan)" />
            <span style={{ fontWeight: 700, color: 'var(--text-main)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeDoc.filename}
            </span>
            {activeDoc.stats && (
              <span style={{ color: 'var(--brand-emerald)', fontSize: '0.7rem', fontWeight: 600 }}>
                • {activeDoc.stats.total_headings} headings
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Search Bar */}
      <div style={{
        position: 'relative',
        minWidth: '280px',
        maxWidth: '420px',
        flex: 1
      }}>
        <Search size={15} color="var(--text-muted)" style={{
          position: 'absolute',
          left: '0.85rem',
          top: '50%',
          transform: 'translateY(-50%)'
        }} />
        <input
          type="text"
          placeholder="Search extracted sections, statutory codes, fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.48rem 0.85rem 0.48rem 2.3rem',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--brand-cyan)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Quick Upload CTA */}
        {activeTab !== 'upload' && (
          <button
            onClick={() => setActiveTab('upload')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', gap: '0.35rem' }}
          >
            <UploadCloud size={14} color="var(--brand-cyan)" />
            <span>Upload</span>
          </button>
        )}

        {/* View Density Mode */}
        {activeTab === 'workspace' && (
          <button
            onClick={() => setIsCompact(c => !c)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', gap: '0.35rem' }}
            title="Toggle compact line density"
          >
            <SlidersHorizontal size={14} color="var(--brand-cyan)" />
            <span>{isCompact ? "Compact" : "Normal"}</span>
          </button>
        )}

        {/* Live Engine Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.65rem',
          borderRadius: '20px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.72rem',
          color: 'var(--brand-emerald)',
          fontWeight: 600
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-emerald)',
            boxShadow: '0 0 6px var(--brand-emerald)'
          }}></span>
          <span>Engine Online</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.45rem', borderRadius: '8px' }}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun size={15} color="var(--brand-amber)" />
          ) : (
            <Moon size={15} color="var(--brand-purple)" />
          )}
        </button>
      </div>
    </header>
  );
}
