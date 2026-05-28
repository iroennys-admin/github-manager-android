import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, type Commit } from '../api/github';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

export default function CommitDetailPage({ owner, repo, sha }: { owner: string; repo: string; sha: string }) {
  const [c, setC] = useState<Commit | null>(null);

  useEffect(() => { git.commit(owner, repo, sha).then(setC).catch(e => toast.error(e.message)); }, [owner, repo, sha]);

  if (!c) return (<><TopBar title="Commit" /><div className="loading"><span className="spinner" /> Cargando…</div></>);
  return (
    <>
      <TopBar title={sha.slice(0, 7)} sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12 }}>
          <div className="strong">{c.commit.message.split('\n')[0]}</div>
          {c.commit.message.split('\n').slice(1).join('\n').trim() && (
            <pre className="mt-2 small"><code>{c.commit.message.split('\n').slice(1).join('\n').trim()}</code></pre>
          )}
          <div className="muted small mt-2">{c.author?.login || c.commit.author.name} · {timeAgo(c.commit.author.date)}</div>
          {c.stats && <div className="flex gap-2 mt-2">
            <span className="badge success">+{c.stats.additions}</span>
            <span className="badge danger">-{c.stats.deletions}</span>
          </div>}
        </div>
        <div className="section-title">Cambios ({c.files?.length || 0})</div>
        <div className="list">
          {c.files?.map(f => (
            <div key={f.filename} className="card">
              <div className="flex gap-2"><span className="mono small truncate strong">{f.filename}</span></div>
              <div className="muted tiny">{f.status} · +{f.additions} -{f.deletions}</div>
              {f.patch && <pre className="mt-2" style={{ maxHeight: 240, overflow: 'auto' }}><code>{f.patch}</code></pre>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
