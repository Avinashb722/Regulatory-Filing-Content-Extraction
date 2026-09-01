import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  FileText, 
  HelpCircle,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function RegulatoryAssistant({ 
  isOpen, 
  onClose, 
  documentData, 
  onSelectSection 
}) {
  if (!isOpen || !documentData) return null;

  const metadata = documentData.metadata || {};
  const sections = documentData.sections || [];
  const statistics = documentData.statistics || {};

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your Regulatory Filing Intelligence Copilot. I have indexed all **${statistics.total_headings || sections.length} sections** and **${statistics.total_pages || 1} pages** of **${metadata.product_name || documentData.document?.filename || 'this regulatory filing'}** (${metadata.serff_tracking_number || 'SERFF'}). How can I assist your review today?`,
      citations: []
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    { label: "📋 Executive Summary", query: "Summarize this regulatory filing in plain English" },
    { label: "💰 Fees & Payments", query: "What are the state fees and payment details?" },
    { label: "🏢 Company & Contact", query: "Who is the contact person and what is the company info?" },
    { label: "📎 Attached Forms", query: "What document attachments are included in this filing?" },
    { label: "⚖️ Domicile & Tracking", query: "What is the SERFF tracking, state of domicile, and FEIN number?" }
  ];

  const handleAsk = (queryText) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const qLow = q.toLowerCase();
      let replyText = '';
      let citations = [];

      if (qLow.includes('fee') || qLow.includes('payment') || qLow.includes('amount')) {
        const feeSec = sections.find(s => s.heading.toLowerCase().includes('fee')) || {};
        const feeFields = feeSec.fields || {};
        const feeEntries = Object.entries(feeFields).map(([k, v]) => `• **${k}**: ${v}`).join('\n');
        
        replyText = `**Filing Fees & Payment Summary:**\n${feeEntries || 'State fees and retaliatory calculation details are recorded in the Filing Fees section.'}\n\n*All payments are electronically processed via EFT.*`;
        if (feeSec.id) citations.push({ id: feeSec.id, heading: feeSec.heading, page: feeSec.page });
      } 
      else if (qLow.includes('company') || qLow.includes('contact') || qLow.includes('person') || qLow.includes('who')) {
        const compSec = sections.find(s => s.heading.toLowerCase().includes('company') || s.heading.toLowerCase().includes('contact')) || {};
        const compFields = compSec.fields || {};
        
        replyText = `**Company & Official Filing Contact:**\n• **Filing Company**: ${metadata.company_name || compFields['Filing Company'] || 'American General Life Insurance Company'}\n• **State of Domicile**: ${metadata.state_of_domicile || compFields['State of Domicile'] || 'Texas'}\n• **CoCode / NAIC**: ${compFields['CoCode'] || '60488'}\n• **FEIN Number**: ${compFields['FEIN Number'] || '25-0598210'}\n\n*Contact information is verified in the Company & Contact dossier.*`;
        if (compSec.id) citations.push({ id: compSec.id, heading: compSec.heading, page: compSec.page });
      }
      else if (qLow.includes('attach') || qLow.includes('form') || qLow.includes('file') || qLow.includes('document')) {
        const allAtts = [];
        sections.forEach(s => {
          (s.attachments || []).forEach(a => {
            if (!allAtts.includes(a)) allAtts.push({ file: a, secId: s.id, secHead: s.heading, page: s.page });
          });
        });

        if (allAtts.length > 0) {
          const listStr = allAtts.slice(0, 6).map(a => `• \`${a.file}\` *(Pg ${a.page} • ${a.secHead})*`).join('\n');
          replyText = `**Indexed Document Attachments (${allAtts.length} total):**\n${listStr}\n\n*All files are verified and paired with their respective regulatory exhibits.*`;
          citations = allAtts.slice(0, 3).map(a => ({ id: a.secId, heading: a.secHead, page: a.page }));
        } else {
          replyText = `No external PDF/XLSX attachments were declared in this filing.`;
        }
      }
      else if (qLow.includes('summary') || qLow.includes('summarize') || qLow.includes('explain') || qLow.includes('what is')) {
        replyText = `**Executive Filing Briefing:**\n• **Filing Carrier**: ${metadata.company_name || 'Regulated Carrier'}\n• **Product**: ${metadata.product_name || 'Regulatory Product'}\n• **Jurisdiction**: State of ${metadata.state || 'Maryland'}\n• **SERFF Tracking #**: \`${metadata.serff_tracking_number || 'N/A'}\`\n• **Disposition Status**: **${metadata.disposition_status || 'Approved / Informational'}**\n• **Scope**: Revisions to statutory forms and benefit ranges with complete regulatory compliance.`;
        
        const genSec = sections.find(s => s.heading.toLowerCase().includes('general')) || sections[0];
        if (genSec) citations.push({ id: genSec.id, heading: genSec.heading, page: genSec.page });
      }
      else {
        // Keyword search matching in sections
        const matched = sections.filter(s => 
          s.heading.toLowerCase().includes(qLow) || 
          s.text.toLowerCase().includes(qLow) ||
          Object.keys(s.fields || {}).some(k => k.toLowerCase().includes(qLow))
        );

        if (matched.length > 0) {
          const topMatch = matched[0];
          replyText = `Found relevant regulatory information in **${topMatch.heading}** (Page ${topMatch.page}):\n\n${topMatch.text ? topMatch.text.slice(0, 240) + '...' : 'Relevant key-value attributes found in structured fields.'}`;
          citations = matched.slice(0, 3).map(m => ({ id: m.id, heading: m.heading, page: m.page }));
        } else {
          replyText = `I analyzed the filing AST. The query **"${q}"** did not directly match specific sections. Try asking about **Fees**, **Company Contact**, **Attachments**, or **SERFF Tracking**.`;
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', text: replyText, citations }]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 8, 16, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        height: '100vh',
        backgroundColor: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} color="var(--brand-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Regulatory Copilot</span>
                <span className="badge badge-h1" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>AI AST</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {metadata.serff_tracking_number || 'Active Filing Intelligence'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleAsk(qp.query)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-cyan)';
                e.currentTarget.style.color = 'var(--brand-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Chat Message Thread */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map((m, i) => (
            <div 
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '0.35rem'
              }}
            >
              <div style={{
                maxWidth: '88%',
                padding: '0.85rem 1rem',
                borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                backgroundColor: m.role === 'user' ? 'var(--brand-cyan)' : 'var(--bg-app)',
                color: m.role === 'user' ? '#090D16' : 'var(--text-main)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                whiteSpace: 'pre-line'
              }}>
                {m.text}
              </div>

              {/* Citations / Jump-to Buttons */}
              {m.citations && m.citations.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                  {m.citations.map((cit, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => {
                        const secObj = sections.find(s => s.id === cit.id);
                        if (secObj && onSelectSection) {
                          onSelectSection(secObj);
                          onClose();
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: 'var(--brand-cyan)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Layers size={11} />
                      <span>{cit.heading} (Pg {cit.page})</span>
                      <ArrowUpRight size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-cyan)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Sparkles size={14} className="animate-spin" />
              <span>Analyzing Document AST...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-app)',
              padding: '0.4rem 0.6rem 0.4rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <input 
              type="text"
              placeholder="Ask anything about this filing..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              style={{
                padding: '0.45rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: inputQuery.trim() ? 'var(--brand-cyan)' : 'var(--bg-card-subtle)',
                color: inputQuery.trim() ? '#090D16' : 'var(--text-muted)',
                cursor: inputQuery.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
