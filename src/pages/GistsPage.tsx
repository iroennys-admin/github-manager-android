import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { gists, type Gist } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

export default function GistsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Gist[]>([]);
  const [tab, setTab] = useState<'mine'|'starred'>('mine');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try { setItems(tab === 'mine' ? await gists.mine(30) : await gists.starred(30)); }
    catch (e: any) { toast.error(e?.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tab]);
  return (
    <>
      <TopBar title="Gists" sub={`${items.length}`} showBack={false}
        actions={<button className="btn-icon" onClick={() => router.push({ name: 'edit-gist' })}>+</button>} />
      <div className="toolbar">
        <button className={`chip ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>Mis Gists</button>
        <button className={`chip ${tab === 'starred' ? 'active' : ''}`} onClick={() => setTab('starred')}>⭐ Starred</button>
      </div>
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {!loading && items.length === 0 && <div className="empty"><div className="ico">📋</div><div className="title">Sin gists</div></div>}
          {items.map(g => {
            const files = Object.values(g.files);
            const first = files[0];
            return (
              <div key={g.id} className="card-row" onClick={() => router.push({ name: 'gist', id: g.id })}>
                <div style={{ fontSize: 22 }}>{g.public ? '📝' : '🔒'}</div>
                <div className="body">
                  <div className="title truncate">{g.description || first?.filename || '(sin descripción)'}</div>
                  <div className="sub truncate">
                    {files.length} archivo(s) · {first?.language || first?.type} · {timeAgo(g.updated_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
