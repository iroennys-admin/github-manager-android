import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { gists, type Gist } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function GistDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [gist, setGist] = useState<Gist | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const g = await gists.get(id);
        setGist(g);
        setActive(Object.keys(g.files)[0] || null);
      } catch (e: any) { toast.error(e?.message); }
    })();
  }, [id]);

  const del = async () => {
    if (!confirm('¿Borrar este gist?')) return;
    setBusy(true);
    try { await gists.delete(id); toast.success('Borrado'); router.back(); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  if (!gist) return (<><TopBar title="Gist" /><div className="loading"><span className="spinner" /> Cargando…</div></>);
  const f = active ? gist.files[active] : null;

  return (
    <>
      <TopBar title={Object.keys(gist.files)[0] || 'Gist'} sub={gist.public ? 'público' : '🔒 secreto'}
        actions={<>
          <button className="btn-icon" onClick={() => router.push({ name: 'edit-gist', id })}>✎</button>
          <button className="btn-icon" onClick={del} disabled={busy}>🗑</button>
        </>} />
      <div className="scroll-area scroll">
        {gist.description && <div className="card" style={{ margin: 12 }}>{gist.description}</div>}
        <div className="toolbar">
          {Object.keys(gist.files).map(name => (
            <button key={name} className={`chip ${active === name ? 'active' : ''}`} onClick={() => setActive(name)}>{name}</button>
          ))}
        </div>
        {f && (
          <div style={{ padding: 12 }}>
            <div className="card">
              <div className="muted small">{f.language || f.type} · {f.size}b</div>
              <pre className="mt-2" style={{ maxHeight: '60vh', overflow: 'auto' }}><code>{f.content || '(loading raw — abre desde la web)'}</code></pre>
              <button className="btn btn-sm mt-2" onClick={() => navigator.clipboard?.writeText(f.content || '').then(() => toast.success('Copiado'))}>📋 Copiar</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
