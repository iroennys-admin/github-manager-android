import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { actions, type WorkflowRun, type Workflow } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

export default function ActionsPage({ owner, repo }: { owner: string; repo: string }) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [tab, setTab] = useState<'runs'|'workflows'>('runs');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string|number|undefined>(undefined);

  const load = async () => {
    setLoading(true);
    try {
      const [wf, r] = await Promise.all([
        actions.workflows(owner, repo),
        actions.runs(owner, repo, { per_page: 30, workflow_id: filter }),
      ]);
      setWorkflows(wf.workflows); setRuns(r.workflow_runs);
    } catch (e: any) { toast.error(e?.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [owner, repo, filter]);

  const dispatch = async (w: Workflow) => {
    const ref = prompt('Branch o tag:', 'main'); if (!ref) return;
    try { await actions.dispatch(owner, repo, w.id, { ref }); toast.success('Lanzado'); load(); }
    catch (e: any) { toast.error(e?.message); }
  };

  return (
    <>
      <TopBar title="Actions" sub={`${owner}/${repo}`}
        actions={<button className="btn-icon" onClick={load}>↻</button>} />
      <div className="toolbar">
        <button className={`chip ${tab === 'runs' ? 'active' : ''}`} onClick={() => setTab('runs')}>Runs</button>
        <button className={`chip ${tab === 'workflows' ? 'active' : ''}`} onClick={() => setTab('workflows')}>Workflows</button>
      </div>
      {tab === 'runs' && workflows.length > 0 && (
        <div className="toolbar">
          <button className={`chip ${filter === undefined ? 'active' : ''}`} onClick={() => setFilter(undefined)}>Todos</button>
          {workflows.map(w => (
            <button key={w.id} className={`chip ${filter === w.id ? 'active' : ''}`} onClick={() => setFilter(w.id)}>{w.name}</button>
          ))}
        </div>
      )}
      <div className="scroll-area scroll">
        {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
        {tab === 'runs' && (
          <div className="list">
            {runs.map(r => (
              <div key={r.id} className="card-row" onClick={() => router.push({ name: 'run', owner, repo, runId: r.id })}>
                <div style={{ fontSize: 22 }}>{runIcon(r)}</div>
                <div className="body">
                  <div className="title truncate">{r.name} <span className="muted small">#{r.run_number}</span></div>
                  <div className="sub truncate">{r.event} · {r.head_branch} · {timeAgo(r.updated_at)}</div>
                  <div className="sub small mono">{r.head_sha.slice(0, 7)} {r.head_commit?.message?.split('\n')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'workflows' && (
          <div className="list">
            {workflows.map(w => (
              <div key={w.id} className="card-row">
                <div style={{ fontSize: 20 }}>⚙️</div>
                <div className="body">
                  <div className="title">{w.name}</div>
                  <div className="sub small mono">{w.path}</div>
                  <div className="sub small">{w.state}</div>
                </div>
                <button className="btn btn-sm" onClick={() => dispatch(w)}>▶ Run</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function runIcon(r: WorkflowRun): string {
  if (r.status !== 'completed') return r.status === 'in_progress' ? '🟡' : r.status === 'queued' ? '⚪' : '⏳';
  return r.conclusion === 'success' ? '✅' : r.conclusion === 'failure' ? '❌' : r.conclusion === 'cancelled' ? '🚫' : '⚠️';
}
