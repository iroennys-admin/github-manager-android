import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, type ContentEntry } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function FilesPage({ owner, repo, path = '', ref }: { owner: string; repo: string; path?: string; ref?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    git.contents(owner, repo, path, ref).then(r => {
      const arr = Array.isArray(r) ? r : [r];
      arr.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'dir' ? -1 : 1)));
      setItems(arr);
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [owner, repo, path, ref]);

  const crumbs = path.split('/').filter(Boolean);

  // Detecta si ref parece un SHA completo (40 hex) — modo historial
  const isShaRef = /^[0-9a-f]{40}$/i.test(ref || '');

  return (
    <>
      <TopBar title="Files" sub={`${owner}/${repo}${ref ? '@' + ref.slice(0, isShaRef ? 7 : 40) : ''}`} />
      {/* Banner de aviso cuando estás viendo código histórico */}
      {isShaRef && (
        <div style={{
          background: 'rgba(210,153,34,0.15)',
          borderBottom: '1px solid rgba(210,153,34,0.4)',
          padding: '6px 14px',
          fontSize: 12,
          color: 'var(--warn)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          🕐 <span>Código histórico · commit <code className="mono">{ref!.slice(0, 7)}</code></span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>solo lectura</span>
        </div>
      )}

      <div className="path-bar">
        <span className="crumb" onClick={() => router.push({ name: 'files', owner, repo, ref })}>~</span>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span className="sep">/</span>
            <span className="crumb" onClick={() => router.push({ name: 'files', owner, repo, path: crumbs.slice(0, i + 1).join('/'), ref })}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {items.map(e => (
            <div key={e.path} className="file-row" onClick={() => {
              if (e.type === 'dir') router.push({ name: 'files', owner, repo, path: e.path, ref });
              else router.push({ name: 'file', owner, repo, path: e.path, ref });
            }}>
              <span className="ico">{e.type === 'dir' ? '📁' : '📄'}</span>
              <span className="name">{e.name}</span>
              {e.type !== 'dir' && <span className="meta">{prettySize(e.size)}</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function prettySize(n: number): string {
  if (n < 1024) return n + 'B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB';
  return (n / 1024 / 1024).toFixed(1) + 'MB';
}
