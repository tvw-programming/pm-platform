import { useState, useEffect, useCallback } from 'react';
import { docTree, docContent } from 'virtual:docs';
import { Sidebar } from './Sidebar';
import { DocView } from './DocView';

export function App() {
  const firstSection = Object.values(docTree)[0];
  const firstFile = firstSection?.files[0];
  const [activeId, setActiveId] = useState<string>(firstFile?.id ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const content = activeId ? (docContent[activeId] ?? '') : '';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '[' && (e.metaKey || e.ctrlKey)) setSidebarOpen(o => !o);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        tree={docTree}
        activeId={activeId}
        onSelect={setActiveId}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <DocView
        content={content}
        activeId={activeId}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
