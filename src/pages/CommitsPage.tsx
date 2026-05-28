import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, type Commit } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

export default function CommitsPage({ owner, repo, ref }: { owner: string; repo: string; ref?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    git.commits(owner, repo, { sha: ref, per_page: 30 })
      .then(setItems)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo, ref]);

  return (
    <>
      <TopBar title="Commits" sub={`${owner}/${repo}${ref ? ' · ' + ref : ''}`} />
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {items.map(c => (
            <div key={c.sha} className="card-row" onClick={() => router.push({ name: 'commit', owner, repo, sha: c.sha })}>
              <div className="avatar"><img src={c.author?.avatar_url || ''} alt="" /></div>
              <div className="body">
                <div className="title truncate">{c.commit.message.split('\n')[0]}</div>
                <div className="sub truncate">{c.author?.login || c.commit.author.name} · {timeAgo(c.commit.author.date)}</div>
                <div className="sub mono small">{c.sha.slice(0, 7)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
