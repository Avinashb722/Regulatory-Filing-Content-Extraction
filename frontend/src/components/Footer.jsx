import React from 'react';
import { ShieldCheck, Database, Lock, Cpu, Sparkles } from 'lucide-react';

export default function Footer({ totalDocs = 0 }) {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '1rem 1.5rem 1.5rem 1.5rem',
      width: '100%',
      maxWidth: '1200px',
      margin: 'auto auto 0 auto'
    }}>
      <div className="footer-container" style={{
        padding: '0.85rem 1.5rem',
        backgroundColor: 'rgba(13, 18, 31, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        {/* Left: System Status & Security Badges */}
        <div className="footer-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--brand-emerald)',
            fontWeight: 700,
            fontSize: '0.72rem'
          }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-emerald)',
              boxShadow: '0 0 8px var(--brand-emerald)'
            }}></span>
            <span>AI Engine v2.3 Pro Online</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <Lock size={13} color="var(--brand-cyan)" />
            <span>AES-256 Isolated</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={13} color="var(--brand-cyan)" />
            <span>SERFF & NAIC Compliant</span>
          </div>
        </div>

        {/* Right: Metrics & Attribution */}
        <div className="footer-row" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <Database size={13} color="var(--brand-cyan)" />
            <span><strong style={{ color: 'var(--text-main)' }}>{totalDocs}</strong> Filings Processed</span>
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} <strong style={{ color: 'var(--brand-cyan)' }}>LexiExtract</strong> • Avinash Biradar
          </span>
        </div>
      </div>
    </footer>
  );
}
