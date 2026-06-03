import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { releases, type Release } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

export default function ReleasesPage({ owner, repo }: { owner: string; repo: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    releases.list(owner, repo).then(setItems).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [owner, repo]);

  return (
    <>
      <TopBar title="Releases" sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {items.length === 0 && !loading && <div className="empty"><div className="ico">🎉</div><div className="title">Sin releases</div></div>}
          {items.map(r => (
            <div key={r.id} className="card-row" onClick={() => router.push({ name: 'release', owner, repo, id: r.id })}>
              <div style={{ fontSize: 24 }}>{r.prerelease ? '🚧' : r.draft ? '📝' : '🎉'}</div>
              <div className="body">
                <div className="title truncate">{r.name || r.tag_name}</div>
                <div className="sub truncate">{r.tag_name} · {timeAgo(r.published_at || r.created_at)} · {r.assets.length} assets</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
