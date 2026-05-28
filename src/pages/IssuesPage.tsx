import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { issues, pulls, type Issue, type PullRequest } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

interface Props { owner?: string; repo?: string; mode?: 'issue' | 'pr' }

export default function IssuesPage({ owner, repo, mode = 'issue' }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Issue[]>([]);
  const [state, setState] = useState<'open'|'closed'|'all'>('open');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let data: Issue[] = [];
      if (owner && repo) {
        if (mode === 'pr') data = await pulls.list(owner, repo, { state, per_page: 30 }) as any;
        else data = await issues.list(owner, repo, { state, per_page: 30 });
      } else {
        data = await issues.myIssues({ filter: 'assigned', state, per_page: 30 });
      }
      // Remove PRs from issue list
      if (mode !== 'pr') data = data.filter(i => !i.pull_request);
      setItems(data);
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [owner, repo, state, mode]);

  const title = mode === 'pr' ? 'Pull Requests' : 'Issues';

  return (
    <>
      <TopBar
        title={title}
        sub={owner && repo ? `${owner}/${repo}` : 'asignados a ti'}
        actions={owner && repo && mode !== 'pr' ? (
          <button className="btn-icon" onClick={() => router.push({ name: 'create-issue', owner, repo })}>+</button>
        ) : owner && repo && mode === 'pr' ? (
          <button className="btn-icon" onClick={() => router.push({ name: 'create-pr', owner, repo })}>+</button>
        ) : undefined}
      />
      <div className="toolbar">
        {(['open','closed','all'] as const).map(s => (
          <button key={s} className={`chip ${state === s ? 'active' : ''}`} onClick={() => setState(s)}>{s}</button>
        ))}
      </div>
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {!loading && items.length === 0 && <div className="empty"><div className="ico">📭</div><div className="title">Sin {title.toLowerCase()}</div></div>}
          {items.map(i => (
            <div key={i.id} className="issue-row" onClick={() => {
              const [o, r] = i.html_url.replace('https://github.com/', '').split('/');
              router.push({ name: mode === 'pr' ? 'pr' : 'issue', owner: o, repo: r, number: i.number });
            }}>
              <div className="ico">{issueIcon(i, mode === 'pr')}</div>
              <div className="meta">
                <div className="title">{i.title} <span className="muted small">#{i.number}</span></div>
                <div className="sub">
                  by {i.user.login} · updated {timeAgo(i.updated_at)}
                  {i.comments > 0 && <> · 💬 {i.comments}</>}
                </div>
                {i.labels.length > 0 && (
                  <div className="labels">
                    {i.labels.map(l => (
                      <span key={l.id} className="label-pill" style={{ background: '#' + l.color + '40', color: '#' + l.color }}>{l.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function issueIcon(i: Issue, isPR: boolean): string {
  if (isPR) {
    const pr = i as any as PullRequest;
    if (pr.merged) return '🟣';
    if (i.state === 'closed') return '🔴';
    if (pr.draft) return '⚪';
    return '🟢';
  }
  if (i.state === 'closed') {
    if (i.state_reason === 'not_planned') return '⚫';
    return '🟣';
  }
  return '🟢';
}

export function timeAgo(date: string): string {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s/86400)}d ago`;
  if (s < 31536000) return `${Math.floor(s/2592000)}mo ago`;
  return `${Math.floor(s/31536000)}y ago`;
}
