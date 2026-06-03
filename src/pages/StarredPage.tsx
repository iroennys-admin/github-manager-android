import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { repos, type Repo } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function StarredPage() {
  const router = useRouter();
  const [items, setItems] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { repos.starredByMe(50).then(setItems).catch(e => toast.error(e.message)).finally(() => setLoading(false)); }, []);
  return (
    <>
      <TopBar title="⭐ Starred" showBack={false} />
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {items.map(r => (
            <div key={r.id} className="card-row" onClick={() => router.push({ name: 'repo', owner: r.owner.login, repo: r.name })}>
              <div className="avatar"><img src={r.owner.avatar_url} alt="" /></div>
              <div className="body">
                <div className="title truncate">{r.full_name}</div>
                {r.description && <div className="sub" style={{ whiteSpace: 'normal' }}>{r.description}</div>}
                <div className="sub small">★ {r.stargazers_count} · {r.language || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
