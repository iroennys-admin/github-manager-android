import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { repos, type Repo } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { IconPlus } from '../ui/Icons';

const SORTS = [
  { id: 'updated', label: 'Recientes' },
  { id: 'created', label: 'Creados' },
  { id: 'pushed',  label: 'Push' },
  { id: 'full_name', label: 'A-Z' },
];

const VIS = [
  { id: 'all',     label: 'Todos' },
  { id: 'public',  label: 'Públicos' },
  { id: 'private', label: 'Privados' },
];

export default function ReposPage() {
  const router = useRouter();
  const [items, setItems] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('updated');
  const [vis, setVis] = useState<'all'|'public'|'private'>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const data = await repos.myRepos({ sort: sort as any, visibility: vis, per_page: 30, page: p });
      setItems(reset ? data : [...items, ...data]);
      setHasMore(data.length === 30);
      setPage(p + 1);
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { setPage(1); load(true); }, [sort, vis]);

  const filtered = q
    ? items.filter(r => r.full_name.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <>
      <TopBar title="Mis repos" sub={`${items.length} cargados`} showBack={false}
        actions={<button className="btn-icon" onClick={() => router.push({ name: 'create-repo' })}><IconPlus size={18} /></button>} />
      <div className="toolbar">
        {SORTS.map(s => (
          <button key={s.id} className={`chip ${sort === s.id ? 'active' : ''}`} onClick={() => setSort(s.id)}>{s.label}</button>
        ))}
        <div style={{ width: 12 }} />
        {VIS.map(v => (
          <button key={v.id} className={`chip ${vis === v.id ? 'active' : ''}`} onClick={() => setVis(v.id as any)}>{v.label}</button>
        ))}
      </div>
      <div style={{ padding: 8 }}>
        <input placeholder="Filtrar por nombre…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="scroll-area scroll">
        <div className="list">
          {filtered.map(r => (
            <div key={r.id} className="card-row" onClick={() => router.push({ name: 'repo', owner: r.owner.login, repo: r.name })}>
              <div className="avatar"><img src={r.owner.avatar_url} alt="" /></div>
              <div className="body">
                <div className="title truncate">
                  {r.full_name} {r.private && <span className="badge" style={{ marginLeft: 6 }}>🔒 private</span>}
                  {r.fork && <span className="badge" style={{ marginLeft: 4 }}>fork</span>}
                  {r.archived && <span className="badge warn" style={{ marginLeft: 4 }}>archived</span>}
                </div>
                {r.description && <div className="sub" style={{ whiteSpace: 'normal' }}>{r.description}</div>}
                <div className="sub small">
                  {r.language && <span>{r.language} · </span>}
                  ★ {r.stargazers_count} · {r.forks_count} forks · {r.open_issues_count} issues
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {!loading && hasMore && (
            <button className="btn mt-2" style={{ width: '100%' }} onClick={() => load(false)}>Cargar más</button>
          )}
          {!loading && filtered.length === 0 && <div className="empty"><div className="ico">📭</div><div className="title">Sin resultados</div></div>}
        </div>
      </div>
    </>
  );
}
