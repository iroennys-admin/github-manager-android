import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import Markdown from '../ui/Markdown';
import { issues, type Issue } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

interface Props { owner: string; repo: string; number: number; }
interface Comment { id: number; body: string; user: any; created_at: string; html_url: string; }

export default function IssueDetailPage({ owner, repo, number }: Props) {
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [i, c] = await Promise.all([
        issues.get(owner, repo, number),
        issues.comments(owner, repo, number),
      ]);
      setIssue(i); setComments(c);
    } catch (e: any) { toast.error(e?.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [owner, repo, number]);

  const submitComment = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const c = await issues.comment(owner, repo, number, reply.trim());
      setComments(prev => [...prev, c as any]);
      setReply('');
      toast.success('Comentario enviado');
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  const toggleState = async () => {
    if (!issue) return;
    setBusy(true);
    try {
      const u = issue.state === 'open'
        ? await issues.close(owner, repo, number)
        : await issues.reopen(owner, repo, number);
      setIssue(u);
      toast.success(issue.state === 'open' ? 'Cerrado' : 'Reabierto');
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title={issue ? `#${issue.number}` : '…'} sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        {loading || !issue ? <div className="loading"><span className="spinner" /> Cargando…</div> : (
          <>
            <div className="card" style={{ margin: 12 }}>
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <span className={`badge ${issue.state === 'open' ? 'success' : 'closed'}`}>
                  {issue.state}
                </span>
                <div className="muted small">by {issue.user.login} · {timeAgo(issue.created_at)}</div>
              </div>
              <h3 className="strong mt-2" style={{ margin: '6px 0' }}>{issue.title}</h3>
              {issue.labels.length > 0 && (
                <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                  {issue.labels.map(l => (
                    <span key={l.id} className="label-pill" style={{ background: '#' + l.color + '40', color: '#' + l.color }}>{l.name}</span>
                  ))}
                </div>
              )}
              {issue.body && <div className="mt-3"><Markdown text={issue.body} /></div>}
            </div>

            <div className="section-title">Comentarios ({comments.length})</div>
            <div className="list">
              {comments.map(c => (
                <div key={c.id} className="card">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <img src={c.user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div className="strong small">{c.user.login}</div>
                    <div className="muted tiny">{timeAgo(c.created_at)}</div>
                  </div>
                  <div className="mt-2"><Markdown text={c.body} /></div>
                </div>
              ))}
            </div>

            <div className="card" style={{ margin: '12px' }}>
              <div className="muted small">Responder</div>
              <textarea rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder="Escribe tu comentario (markdown soportado)…" className="mt-2" />
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={submitComment} disabled={busy || !reply.trim()}>
                  {busy ? <span className="spinner" /> : 'Comentar'}
                </button>
                <button className="btn" onClick={toggleState} disabled={busy}>
                  {issue.state === 'open' ? '🔒 Cerrar issue' : '🔓 Reabrir'}
                </button>
              </div>
            </div>
            <div style={{ height: 32 }} />
          </>
        )}
      </div>
    </>
  );
}
