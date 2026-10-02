import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import type { Plugin } from 'vite';

// Virtual module plugin that reads all .md files from ../docs at build/request time
function docsPlugin(): Plugin {
  const virtualModuleId = 'virtual:docs';
  const resolvedId = '\0' + virtualModuleId;

  function buildDocTree() {
    const docsRoot = path.resolve(__dirname, '../docs');
    const tree: Record<string, { label: string; files: { id: string; label: string; path: string }[] }> = {};

    if (!fs.existsSync(docsRoot)) return tree;

    for (const section of fs.readdirSync(docsRoot).sort()) {
      const sectionPath = path.join(docsRoot, section);
      if (!fs.statSync(sectionPath).isDirectory()) continue;

      const SECTION_LABELS: Record<string, string> = {
        'user-guide': 'User Guide',
        'developer-guide': 'Developer Guide',
      };
      if (!SECTION_LABELS[section]) continue;
      const label = SECTION_LABELS[section];
      tree[section] = { label, files: [] };

      for (const file of fs.readdirSync(sectionPath).filter(f => f.endsWith('.md')).sort()) {
        const filePath = path.join(sectionPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : file.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ');
        tree[section].files.push({ id: `${section}/${file}`, label: title, path: filePath });
      }
    }
    return tree;
  }

  function buildDocsContent() {
    const tree = buildDocTree();
    const content: Record<string, string> = {};
    for (const section of Object.values(tree)) {
      for (const file of section.files) {
        content[file.id] = fs.readFileSync(file.path, 'utf-8');
      }
    }
    return { tree, content };
  }

  return {
    name: 'docs-plugin',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        const { tree, content } = buildDocsContent();
        // Strip paths (not serialisable), keep id/label structure
        const treeClean: Record<string, { label: string; files: { id: string; label: string }[] }> = {};
        for (const [k, v] of Object.entries(tree)) {
          treeClean[k] = { label: v.label, files: v.files.map(f => ({ id: f.id, label: f.label })) };
        }
        return `export const docTree = ${JSON.stringify(treeClean)};\nexport const docContent = ${JSON.stringify(content)};`;
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.md')) {
        server.moduleGraph.invalidateAll();
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), docsPlugin()],
  publicDir: path.resolve(__dirname, '../docs'),
  server: {
    port: 5590,
    fs: { allow: ['..'] },
  },
  build: { outDir: 'dist' },
});
