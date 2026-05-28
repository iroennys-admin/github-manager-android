import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, type Branch } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function BranchesPage({ owner, repo }: { owner: string; repo: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await git.branches(owner, repo, 100)); }
    catch (e: any) { toast.error(e?.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [owner, repo]);

  const create = async () => {
    const name = prompt('Nombre de la nueva rama:');
    if (!name) return;
    const from = items[0]?.commit?.sha;
    if (!from) { toast.error('No hay base'); return; }
    setBusy(true);
    try { await git.createBranch(owner, repo, name, from); toast.success('Rama creada'); load(); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };
  const del = async (b: Branch) => {
    if (!confirm(`¿Borrar rama "${b.name}"?`)) return;
    try { await git.deleteBranch(owner, repo, b.name); toast.success('Borrada'); load(); }
    catch (e: any) { toast.error(e?.message); }
  };

  return (
    <>
      <TopBar title="Branches" sub={`${owner}/${repo}`}
        actions={<button className="btn-icon" onClick={create} disabled={busy}>+</button>} />
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {items.map(b => (
            <div key={b.name} className="card-row">
              <div style={{ fontSize: 18 }}>🌿</div>
              <div className="body" onClick={() => router.push({ name: 'commits', owner, repo, ref: b.name })}>
                <div className="title">{b.name}</div>
                <div className="sub mono small truncate">{b.commit.sha.slice(0, 7)} {b.protected && '🔒'}</div>
              </div>
              <button className="btn btn-sm" onClick={() => router.push({ name: 'files', owner, repo, ref: b.name })}>📁</button>
              <button className="btn btn-sm btn-danger" onClick={() => del(b)}>🗑</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
