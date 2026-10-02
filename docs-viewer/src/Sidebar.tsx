import { useState } from 'react';

interface FileEntry { id: string; label: string; }
interface SectionEntry { label: string; files: FileEntry[]; }

interface SidebarProps {
  tree: Record<string, SectionEntry>;
  activeId: string;
  onSelect: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

const SECTION_ICONS: Record<string, string> = {
  'user-guide': '📖',
  'developer-guide': '⚙️',
};

export function Sidebar({ tree, activeId, onSelect, open, onToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) =>
    setCollapsed(p => ({ ...p, [id]: !p[id] }));

  if (!open) {
    return (
      <div style={styles.collapsed}>
        <button onClick={onToggle} style={styles.toggleBtn} title="Open sidebar (⌘[)">
          ›
        </button>
      </div>
    );
  }

  return (
    <aside style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.logoText}>CGen</div>
          <div style={styles.logoSub}>Documentation</div>
        </div>
        <button onClick={onToggle} style={styles.closeBtn} title="Close sidebar (⌘[)">
          ‹
        </button>
      </div>

      {/* Search hint */}
      <div style={styles.searchHint}>⌘[ to toggle sidebar</div>

      {/* Nav tree */}
      <nav style={styles.nav}>
        {Object.entries(tree).map(([sectionId, section]) => (
          <div key={sectionId} style={styles.section}>
            <button
              style={styles.sectionHeader}
              onClick={() => toggleSection(sectionId)}
            >
              <span style={styles.sectionIcon}>{SECTION_ICONS[sectionId] ?? '📁'}</span>
              <span style={styles.sectionLabel}>{section.label}</span>
              <span style={styles.chevron}>{collapsed[sectionId] ? '›' : '⌄'}</span>
            </button>

            {!collapsed[sectionId] && (
              <ul style={styles.fileList}>
                {section.files.map(file => {
                  const isActive = file.id === activeId;
                  return (
                    <li key={file.id}>
                      <button
                        style={{
                          ...styles.fileBtn,
                          ...(isActive ? styles.fileBtnActive : {}),
                        }}
                        onClick={() => onSelect(file.id)}
                      >
                        {file.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <a
          href="http://localhost:5588"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          ↗ Open Platform
        </a>
        <a
          href="http://localhost:5589/api/health"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          ↗ API Health
        </a>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 260,
    minWidth: 260,
    height: '100vh',
    background: '#161b2e',
    borderRight: '1px solid #1e2640',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  collapsed: {
    width: 32,
    minWidth: 32,
    height: '100vh',
    background: '#161b2e',
    borderRight: '1px solid #1e2640',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    borderBottom: '1px solid #1e2640',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: 11,
    color: '#64748b',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 20,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
    lineHeight: 1,
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 20,
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: 4,
    lineHeight: 1,
  },
  searchHint: {
    fontSize: 11,
    color: '#334155',
    padding: '6px 16px',
    borderBottom: '1px solid #1e2640',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '6px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    textAlign: 'left',
  },
  sectionIcon: { fontSize: 13 },
  sectionLabel: { flex: 1 },
  chevron: { fontSize: 14, color: '#475569' },
  fileList: {
    listStyle: 'none',
    padding: '0 0 4px',
  },
  fileBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: 13,
    cursor: 'pointer',
    padding: '5px 16px 5px 32px',
    textAlign: 'left',
    borderRadius: 0,
    lineHeight: 1.4,
    transition: 'background 0.1s, color 0.1s',
  },
  fileBtnActive: {
    background: 'rgba(99,102,241,0.15)',
    color: '#818cf8',
    borderLeft: '2px solid #6366f1',
    paddingLeft: 30,
  },
  footer: {
    borderTop: '1px solid #1e2640',
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  footerLink: {
    color: '#475569',
    fontSize: 11,
    textDecoration: 'none',
  },
};
