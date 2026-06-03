import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { actions, type WorkflowRun } from '../api/github';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';
import { runIcon } from './ActionsPage';

export default function RunDetailPage({ owner, repo, runId }: { owner: string; repo: string; runId: number }) {
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [r, j] = await Promise.all([actions.run(owner, repo, runId), actions.jobs(owner, repo, runId)]);
      setRun(r); setJobs(j.jobs);
    } catch (e: any) { toast.error(e?.message); }
  };
  useEffect(() => { load(); }, [owner, repo, runId]);

  const rerun = async () => { setBusy(true); try { await actions.rerun(owner, repo, runId); toast.success('Re-run'); load(); } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); } };
  const rerunFailed = async () => { setBusy(true); try { await actions.rerunFailed(owner, repo, runId); toast.success('Re-running failed'); load(); } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); } };
  const cancel = async () => { if (!confirm('¿Cancelar este run?')) return; setBusy(true); try { await actions.cancel(owner, repo, runId); toast.success('Cancelado'); load(); } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); } };

  if (!run) return (<><TopBar title="Run" /><div className="loading"><span className="spinner" /> Cargando…</div></>);

  return (
    <>
      <TopBar title={`Run #${run.run_number}`} sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12 }}>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>{runIcon(run)}</span>
            <div style={{ flex: 1 }}>
              <div className="strong">{run.name}</div>
              <div className="muted small">{run.event} · {run.head_branch} · {timeAgo(run.updated_at)}</div>
              <div className="muted small mono">{run.head_sha.slice(0, 7)}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
            {run.status !== 'completed' && <button className="btn btn-sm btn-danger" onClick={cancel} disabled={busy}>🚫 Cancel</button>}
            {run.status === 'completed' && <button className="btn btn-sm" onClick={rerun} disabled={busy}>↻ Re-run all</button>}
            {run.status === 'completed' && run.conclusion === 'failure' && <button className="btn btn-sm" onClick={rerunFailed} disabled={busy}>↻ Re-run failed</button>}
          </div>
        </div>

        <div className="section-title">Jobs</div>
        <div className="list">
          {jobs.map((j: any) => (
            <div key={j.id} className="card">
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <span>{j.conclusion === 'success' ? '✅' : j.conclusion === 'failure' ? '❌' : j.status === 'in_progress' ? '🟡' : '⚪'}</span>
                <div className="strong">{j.name}</div>
              </div>
              <div className="muted small">{j.status}{j.conclusion ? ' · ' + j.conclusion : ''}</div>
              {j.steps && (
                <div className="mt-2">
                  {j.steps.map((s: any, i: number) => (
                    <div key={i} className="small flex gap-2" style={{ padding: '2px 0' }}>
                      <span>{s.conclusion === 'success' ? '✓' : s.conclusion === 'failure' ? '✗' : s.status === 'in_progress' ? '…' : '○'}</span>
                      <span className="muted">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
