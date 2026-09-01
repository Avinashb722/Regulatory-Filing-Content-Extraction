import React from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Download, 
  FileText,
  Hash
} from 'lucide-react';

export default function DashboardStats({ 
  documentData, 
  onOpenExport, 
  activeTab, 
  setActiveTab 
}) {
  if (!documentData) return null;

  const { metadata = {}, statistics = {} } = documentData;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {/* Card 1: Document Identity */}
      <div className="card" style={{ padding: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Document Identity
          </span>
          <Building2 size={16} color="var(--brand-cyan)" />
        </div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {metadata.company_name || documentData.filename || "PDF Document"}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {metadata.state && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <MapPin size={13} color="var(--brand-amber)" /> {metadata.state}
              </span>
              <span>•</span>
            </>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            {metadata.serff_tracking_number || `${statistics.total_pages || 1} Pages`}
          </span>
        </div>
      </div>

      {/* Card 2: Structure Parsing */}
      <div className="card" style={{ padding: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Headings Detected
          </span>
          <Layers size={16} color="var(--brand-purple)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {statistics.total_headings || 0}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Sections ({statistics.h1_sections || 0} H1 / {statistics.h2_subsections || 0} H2)
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Hierarchical parent-child classification
        </div>
      </div>

      {/* Card 3: Content Volume */}
      <div className="card" style={{ padding: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Content Volume
          </span>
          <FileText size={16} color="var(--brand-emerald)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {statistics.total_words?.toLocaleString() || 0}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Body Words
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Across {statistics.total_pages || 1} pages
        </div>
      </div>

      {/* Card 4: Export Hub Action */}
      <div className="card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Export Hub
          </span>
          <span className="badge badge-h1" style={{ fontSize: '0.65rem' }}>
            Structured
          </span>
        </div>
        <button 
          onClick={onOpenExport} 
          className="btn btn-primary btn-sm" 
          style={{ width: '100%', marginTop: '0.5rem', gap: '0.4rem' }}
        >
          <Download size={14} /> Download JSON / CSV / MD
        </button>
      </div>
    </div>
  );
}
