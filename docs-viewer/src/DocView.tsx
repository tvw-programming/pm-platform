import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface DocViewProps {
  content: string;
  activeId: string;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function DocView({ content, activeId, onToggleSidebar, sidebarOpen }: DocViewProps) {
  if (!content) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📄</div>
        <div style={styles.emptyText}>Select a document from the sidebar</div>
      </div>
    );
  }

  const section = activeId.split('/')[0];
  const badge = section === 'user-guide' ? { text: 'User Guide', color: '#10b981' } : { text: 'Developer Guide', color: '#6366f1' };

  return (
    <main style={styles.main}>
      {/* Top bar */}
      <div style={styles.topbar}>
        {!sidebarOpen && (
          <button onClick={onToggleSidebar} style={styles.openBtn} title="Open sidebar (⌘[)">
            ☰
          </button>
        )}
        <span style={{ ...styles.badge, background: badge.color + '22', color: badge.color }}>
          {badge.text}
        </span>
        <span style={styles.filePath}>{activeId.split('/')[1]?.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/-/g, ' ')}</span>
      </div>

      {/* Markdown content */}
      <div style={styles.content}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={mdComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </main>
  );
}

const mdComponents: Components = {
  h1: ({ children }) => <h1 style={styles.h1}>{children}</h1>,
  h2: ({ children }) => <h2 style={styles.h2}>{children}</h2>,
  h3: ({ children }) => <h3 style={styles.h3}>{children}</h3>,
  h4: ({ children }) => <h4 style={styles.h4}>{children}</h4>,
  p: ({ children }) => <p style={styles.p}>{children}</p>,
  a: ({ href, children }) => <a href={href} style={styles.a} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    return isBlock
      ? <code style={styles.codeBlock}>{children}</code>
      : <code style={styles.codeInline}>{children}</code>;
  },
  pre: ({ children }) => <pre style={styles.pre}>{children}</pre>,
  table: ({ children }) => (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={styles.thead}>{children}</thead>,
  th: ({ children }) => <th style={styles.th}>{children}</th>,
  td: ({ children }) => <td style={styles.td}>{children}</td>,
  tr: ({ children }) => <tr style={styles.tr}>{children}</tr>,
  ul: ({ children }) => <ul style={styles.ul}>{children}</ul>,
  ol: ({ children }) => <ol style={styles.ol}>{children}</ol>,
  li: ({ children }) => <li style={styles.li}>{children}</li>,
  blockquote: ({ children }) => <blockquote style={styles.blockquote}>{children}</blockquote>,
  hr: () => <hr style={styles.hr} />,
  strong: ({ children }) => <strong style={styles.strong}>{children}</strong>,
};

const styles: Record<string, React.CSSProperties> = {
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0f1117',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 24px',
    borderBottom: '1px solid #1e2640',
    background: '#0f1117',
    minHeight: 44,
  },
  openBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 18,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  filePath: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    color: '#334155',
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15 },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '40px 48px 80px',
    maxWidth: 900,
    width: '100%',
    margin: '0 auto',
  },
  h1: { fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 24, lineHeight: 1.2, letterSpacing: '-0.5px', borderBottom: '1px solid #1e2640', paddingBottom: 16 },
  h2: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 40, marginBottom: 12, lineHeight: 1.3 },
  h3: { fontSize: 17, fontWeight: 700, color: '#cbd5e1', marginTop: 28, marginBottom: 8 },
  h4: { fontSize: 14, fontWeight: 700, color: '#94a3b8', marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  p: { fontSize: 15, color: '#94a3b8', lineHeight: 1.75, marginBottom: 16 },
  a: { color: '#818cf8', textDecoration: 'underline' },
  pre: { background: '#1e2640', borderRadius: 8, padding: '16px 20px', overflowX: 'auto', marginBottom: 20, border: '1px solid #2d3a5c' },
  codeBlock: { fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", fontSize: 13, color: '#a5f3fc', display: 'block', lineHeight: 1.6 },
  codeInline: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: '#1e2640', color: '#a5f3fc', padding: '2px 6px', borderRadius: 4, border: '1px solid #2d3a5c' },
  tableWrapper: { overflowX: 'auto', marginBottom: 20 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead: { background: '#1e2640' },
  th: { padding: '10px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2d3a5c' },
  td: { padding: '9px 14px', color: '#94a3b8', borderBottom: '1px solid #1e2640', verticalAlign: 'top', lineHeight: 1.5 },
  tr: { transition: 'background 0.1s' },
  ul: { paddingLeft: 24, marginBottom: 16 },
  ol: { paddingLeft: 24, marginBottom: 16 },
  li: { color: '#94a3b8', fontSize: 15, lineHeight: 1.75, marginBottom: 4 },
  blockquote: { borderLeft: '3px solid #6366f1', paddingLeft: 16, margin: '16px 0', color: '#64748b', fontStyle: 'italic' },
  hr: { border: 'none', borderTop: '1px solid #1e2640', margin: '32px 0' },
  strong: { color: '#e2e8f0', fontWeight: 700 },
};
