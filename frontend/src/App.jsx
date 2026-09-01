import React, { useState, useEffect } from 'react';
import { 
  uploadAndExtractPdf, 
  listUserDocuments,
  getDocumentData 
} from './api';
import { auth, firebaseSignOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import MyFilings from './components/MyFilings';
import UploadView from './components/UploadView';
import StructuredView from './components/StructuredView';
import HierarchyTree from './components/HierarchyTree';
import FilingCompare from './components/FilingCompare';
import ExportModal from './components/ExportModal';
import LoginModal from './components/LoginModal';

import { 
  FileText, 
  Download, 
  AlertCircle, 
  RefreshCw,
  Search,
  Layers,
  ListTree
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'filings' | 'upload' | 'workspace' | 'compare'
  const [workspaceMode, setWorkspaceMode] = useState('dual'); // 'dual' | 'tree'
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompact, setIsCompact] = useState(false);
  
  const [documentData, setDocumentData] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [extractionStep, setExtractionStep] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          localStorage.setItem('lexi_jwt_token', token);
          setCurrentUser({
            id: user.uid,
            email: user.email,
            full_name: user.displayName || user.email.split('@')[0],
            photo_url: user.photoURL,
            token: token
          });
        } catch (e) {
          console.error("Token error:", e);
          localStorage.removeItem('lexi_jwt_token');
          setCurrentUser(null);
        }
      } else {
        localStorage.removeItem('lexi_jwt_token');
        setCurrentUser(null);
        setDocumentData(null);
        setActiveDocId(null);
        setRecentDocs([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch and restore recent documents when user changes
  useEffect(() => {
    if (currentUser) {
      // 1. Immediately restore from local persistent cache
      try {
        const cached = localStorage.getItem(`lexi_docs_${currentUser.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentDocs(parsed);
          }
        }
        const activeCached = sessionStorage.getItem(`lexi_active_doc_${currentUser.id}`);
        if (activeCached) {
          const parsedDoc = JSON.parse(activeCached);
          if (parsedDoc && parsedDoc.document_id) {
            setDocumentData(parsedDoc);
            setActiveDocId(parsedDoc.document_id);
          }
        }
      } catch (e) {
        console.warn("Error reading local cache:", e);
      }

      // 2. Sync with backend
      loadDocuments();
    }
  }, [currentUser]);

  const loadDocuments = async () => {
    try {
      const res = await listUserDocuments();
      if (res && res.documents) {
        setRecentDocs(prev => {
          // Merge backend docs with any existing cached docs
          const mergedMap = new Map();
          (res.documents || []).forEach(d => mergedMap.set(d.id, d));
          (prev || []).forEach(d => {
            if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
          });
          const mergedList = Array.from(mergedMap.values());
          if (currentUser) {
            localStorage.setItem(`lexi_docs_${currentUser.id}`, JSON.stringify(mergedList));
          }
          return mergedList;
        });
      }
    } catch (e) {
      console.warn("Could not list documents from backend:", e);
    }
  };

  // Upload and Extract PDF
  const handleExtractFile = async (file) => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    setExtractionStep('Reading PDF visual layout...');

    try {
      setTimeout(() => setExtractionStep('Segmenting H1/H2 hierarchical headings...'), 600);
      setTimeout(() => setExtractionStep('Parsing multi-column regulatory fields...'), 1200);

      const result = await uploadAndExtractPdf(file);
      
      setDocumentData(result);
      setActiveDocId(result.document_id);
      setActiveTab('workspace');

      // Create immediate persistent summary
      const newDocSummary = {
        id: result.document_id,
        filename: result.document?.filename || file.name,
        company_name: result.metadata?.company_name || 'Regulatory Document',
        product_name: result.metadata?.product_name || file.name,
        state: result.metadata?.state || 'N/A',
        total_pages: result.statistics?.total_pages || 1,
        total_headings: result.statistics?.total_headings || (result.sections || []).length,
        total_words: result.statistics?.total_words || 0
      };

      setRecentDocs(prev => {
        const filtered = (prev || []).filter(d => d.id !== result.document_id);
        const updated = [newDocSummary, ...filtered];
        if (currentUser) {
          localStorage.setItem(`lexi_docs_${currentUser.id}`, JSON.stringify(updated));
          sessionStorage.setItem(`lexi_active_doc_${currentUser.id}`, JSON.stringify(result));
        }
        return updated;
      });

      // Refresh list from backend
      loadDocuments();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to extract PDF filing.');
    } finally {
      setIsLoading(false);
      setExtractionStep('');
    }
  };

  const handleOpenDocFromList = async (docSummaryOrId) => {
    const docId = typeof docSummaryOrId === 'string' ? docSummaryOrId : (docSummaryOrId?.id || null);
    if (!docId) return;

    setActiveDocId(docId);
    setActiveTab('workspace');

    // If active document data matches docId, keep it
    if (documentData && documentData.document_id === docId) {
      return;
    }

    try {
      // Check session cache first
      if (currentUser) {
        const activeCached = sessionStorage.getItem(`lexi_active_doc_${currentUser.id}`);
        if (activeCached) {
          const parsed = JSON.parse(activeCached);
          if (parsed && parsed.document_id === docId) {
            setDocumentData(parsed);
            return;
          }
        }
      }

      // Fetch full document structure from backend
      const data = await getDocumentData(docId);
      if (data) {
        setDocumentData(data);
        if (currentUser) {
          sessionStorage.setItem(`lexi_active_doc_${currentUser.id}`, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.warn("Could not fetch document structure:", e);
    }
  };

  const handleLogout = async () => {
    await firebaseSignOut();
    localStorage.removeItem('lexi_jwt_token');
    if (currentUser) {
      sessionStorage.removeItem(`lexi_active_doc_${currentUser.id}`);
    }
    setCurrentUser(null);
    setDocumentData(null);
    setActiveDocId(null);
    setRecentDocs([]);
  };

  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--brand-cyan)',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          Initializing LexiExtract Document Engine...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Mobile Sidebar Overlay Backdrop */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recentDocs={recentDocs}
        activeDocId={activeDocId}
        onSelectDoc={handleOpenDocFromList}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenExport={() => setIsExportOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Workspace Layout */}
      <main className="main-content" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        overflowY: 'auto'
      }}>
        {/* Modern Top Header Bar */}
        <Header 
          theme={theme}
          toggleTheme={toggleTheme}
          activeDoc={documentData ? { filename: documentData.filename, stats: documentData.statistics } : null}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isCompact={isCompact}
          setIsCompact={setIsCompact}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        {/* Global Error Alert */}
        {errorMessage && (
          <div style={{
            margin: '1rem 2rem 0 2rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={16} flexShrink={0} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F87171',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Mode Sub-Header (When in Extraction Workspace) */}
        {activeTab === 'workspace' && documentData && (
          <div style={{
            padding: '0.65rem 2rem',
            backgroundColor: 'var(--bg-sidebar)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-card)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setWorkspaceMode('dual')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: workspaceMode === 'dual' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: workspaceMode === 'dual' ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <Layers size={14} />
                <span>Dual View</span>
              </button>
              <button
                onClick={() => setWorkspaceMode('tree')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: workspaceMode === 'tree' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: workspaceMode === 'tree' ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <ListTree size={14} />
                <span>AST Tree</span>
              </button>
            </div>

            <button
              onClick={() => setIsExportOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--brand-emerald)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export Hub</span>
            </button>
          </div>
        )}

        {/* Dynamic Route Content with generous padding and margins */}
        <div className="content-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              currentUser={currentUser}
              recentDocs={recentDocs}
              onOpenDoc={handleOpenDocFromList}
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToFilings={() => setActiveTab('filings')}
              onNavigateToCompare={() => setActiveTab('compare')}
            />
          )}

          {activeTab === 'filings' && (
            <MyFilings 
              recentDocs={recentDocs}
              onOpenDoc={handleOpenDocFromList}
              onNavigateToUpload={() => setActiveTab('upload')}
              onExportDoc={() => setIsExportOpen(true)}
            />
          )}

          {activeTab === 'upload' && (
            <UploadView 
              onExtract={handleExtractFile}
              onUploadAndExtract={handleExtractFile}
              isLoading={isLoading}
              extractionStep={extractionStep}
            />
          )}

          {activeTab === 'workspace' && (
            documentData ? (
              workspaceMode === 'dual' ? (
                <StructuredView 
                  documentData={documentData}
                  docId={activeDocId}
                  isCompact={isCompact}
                  searchQuery={searchQuery}
                  onOpenExport={() => setIsExportOpen(true)}
                />
              ) : (
                <HierarchyTree 
                  hierarchy={documentData?.hierarchy || []}
                  metadata={documentData?.metadata}
                  statistics={documentData?.statistics}
                  onOpenExport={() => setIsExportOpen(true)}
                />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', margin: 'auto' }}>
                <FileText size={48} color="var(--brand-cyan)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700 }}>No Active Document in Workspace</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
                  Please upload a regulatory filing to extract and inspect its structured data.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    backgroundColor: 'var(--brand-cyan)',
                    color: '#090D16',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Upload Filing
                </button>
              </div>
            )
          )}

          {activeTab === 'compare' && (
            <FilingCompare 
              recentDocs={recentDocs}
              currentDocId={activeDocId}
            />
          )}
        </div>

        {/* Global Polished Footer */}
        <Footer totalDocs={recentDocs.length} />
      </main>

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        docId={activeDocId}
        documentData={documentData} 
      />
    </div>
  );
}
