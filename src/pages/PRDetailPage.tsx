import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import Markdown from '../ui/Markdown';
import { pulls, issues, type PullRequest, type FileChange } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

interface Props { owner: string; repo: string; number: number; }

export default function PRDetailPage({ owner, repo, number }: Props) {
  const router = useRouter();
  const [pr, setPr] = useState<PullRequest | null>(null);
  const [files, setFiles] = useState<FileChange[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'files' | 'commits' | 'comments'>('overview');
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState('');
  const [mergeMethod, setMergeMethod] = useState<'merge'|'squash'|'rebase'>('squash');

  const load = async () => {
    try {
      const [p, f, c] = await Promise.all([
        pulls.get(owner, repo, number),
        pulls.files(owner, repo, number).catch(() => []),
        issues.comments(owner, repo, number).catch(() => []),
      ]);
      setPr(p); setFiles(f); setComments(c);
    } catch (e: any) { toast.error(e?.message); }
  };
  useEffect(() => { load(); }, [owner, repo, number]);

  const doMerge = async () => {
    if (!pr) return;
    if (!confirm(`¿Hacer ${mergeMethod} merge de #${number}?`)) return;
    setBusy(true);
    try { await pulls.merge(owner, repo, number, { merge_method: mergeMethod }); toast.success('Merged ✅'); await load(); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  const doClose = async () => {
    if (!confirm('¿Cerrar este PR sin merge?')) return;
    setBusy(true);
    try { await pulls.update(owner, repo, number, { state: 'closed' }); toast.success('Cerrado'); await load(); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  const submitReview = async (event: 'APPROVE'|'REQUEST_CHANGES'|'COMMENT') => {
    if (event !== 'APPROVE' && !reply.trim()) { toast.error('Añade un comentario'); return; }
    setBusy(true);
    try { await pulls.createReview(owner, repo, number, { event, body: reply.trim() || undefined }); toast.success('Review enviado'); setReply(''); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title={pr ? `#${pr.number}` : '…'} sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        {!pr ? <div className="loading"><span className="spinner" /> Cargando…</div> : (
          <>
            <div className="card" style={{ margin: 12 }}>
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <span className={`badge ${pr.merged ? 'merged' : pr.state === 'open' ? 'success' : 'closed'}`}>
                  {pr.merged ? 'merged' : pr.state}
                </span>
                {pr.draft && <span className="badge">draft</span>}
                <div className="muted small">by {pr.user.login} · {timeAgo(pr.created_at)}</div>
              </div>
              <h3 className="strong mt-2" style={{ margin: '6px 0' }}>{pr.title}</h3>
              <div className="muted small">
                wants to merge <span className="mono">{pr.head.ref}</span> → <span className="mono">{pr.base.ref}</span>
              </div>
              <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                <span className="badge success">+{pr.additions ?? 0}</span>
                <span className="badge danger">-{pr.deletions ?? 0}</span>
                <span className="badge">{pr.changed_files ?? 0} files</span>
                <span className="badge">{pr.commits ?? files.length} commits</span>
                <span className="badge">{pr.comments} comments</span>
              </div>
            </div>

            <div className="tabs">
              {(['overview','files','commits','comments'] as const).map(t => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>

            {tab === 'overview' && (
              <>
                {pr.body && <div className="card" style={{ margin: 12 }}><Markdown text={pr.body} /></div>}
                {pr.state === 'open' && !pr.merged && (
                  <div className="card" style={{ margin: 12 }}>
                    <div className="strong">Merge</div>
                    <div className="field">
                      <label>Método</label>
                      <select value={mergeMethod} onChange={e => setMergeMethod(e.target.value as any)}>
                        <option value="merge">Create a merge commit</option>
                        <option value="squash">Squash and merge</option>
                        <option value="rebase">Rebase and merge</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="btn btn-primary" onClick={doMerge} disabled={busy}>
                        ✅ {mergeMethod === 'squash' ? 'Squash & merge' : mergeMethod === 'rebase' ? 'Rebase & merge' : 'Merge'}
                      </button>
                      <button className="btn btn-danger" onClick={doClose} disabled={busy}>Cerrar</button>
                    </div>
                  </div>
                )}
                <div className="card" style={{ margin: 12 }}>
                  <div className="strong">Review</div>
                  <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)} placeholder="Comentario opcional…" className="mt-2" />
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={() => submitReview('APPROVE')} disabled={busy}>✅ Approve</button>
                    <button className="btn btn-sm" onClick={() => submitReview('COMMENT')} disabled={busy}>💬 Comment</button>
                    <button className="btn btn-danger btn-sm" onClick={() => submitReview('REQUEST_CHANGES')} disabled={busy}>❌ Request changes</button>
                  </div>
                </div>
              </>
            )}

            {tab === 'files' && (
              <div className="list">
                {files.map(f => (
                  <div key={f.filename} className="card">
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <span className="mono small truncate strong">{f.filename}</span>
                      <span className="muted tiny">+{f.additions} -{f.deletions}</span>
                    </div>
                    {f.patch && <pre className="mt-2" style={{ maxHeight: 240, overflow: 'auto' }}><code>{f.patch}</code></pre>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'commits' && (
              <div className="list">
                <button className="btn" style={{ width: '100%' }} onClick={() => router.push({ name: 'commits', owner, repo, ref: pr.head.sha })}>Ver commits ({pr.commits ?? 0})</button>
              </div>
            )}

            {tab === 'comments' && (
              <div className="list">
                {comments.map(c => (
                  <div key={c.id} className="card">
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <img src={c.user.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      <div className="strong small">{c.user.login}</div>
                      <div className="muted tiny">{timeAgo(c.created_at)}</div>
                    </div>
                    <div className="mt-2"><Markdown text={c.body} /></div>
                  </div>
                ))}
                <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)} placeholder="Comentar…" className="mt-2" />
                <button className="btn btn-primary mt-2" onClick={async () => {
                  if (!reply.trim()) return; setBusy(true);
                  try { const c = await issues.comment(owner, repo, number, reply); setComments(p => [...p, c]); setReply(''); toast.success('Enviado'); }
                  catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
                }} disabled={busy}>Comentar</button>
              </div>
            )}
            <div style={{ height: 32 }} />
          </>
        )}
      </div>
    </>
  );
}
