import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, pulls, repos as reposApi } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function CreatePRPage({ owner, repo }: { owner: string; repo: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [head, setHead] = useState('');
  const [base, setBase] = useState('main');
  const [branches, setBranches] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(false);

  useEffect(() => {
    reposApi.get(owner, repo).then(r => setBase(r.default_branch)).catch(() => {});
    git.branches(owner, repo, 100).then(bs => setBranches(bs.map(b => b.name))).catch(() => {});
  }, [owner, repo]);

  const create = async () => {
    if (!title.trim() || !head || !base) return;
    setBusy(true);
    try { const p = await pulls.create(owner, repo, { title, body, head, base, draft }); toast.success('PR creado'); router.replace({ name: 'pr', owner, repo, number: p.number }); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title="Nuevo PR" sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        <div className="field">
          <label>Rama origen (head)</label>
          <select value={head} onChange={e => setHead(e.target.value)}>
            <option value="">— selecciona —</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Rama destino (base)</label>
          <select value={base} onChange={e => setBase(e.target.value)}>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field"><label>Título</label><input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><label>Descripción</label><textarea rows={8} value={body} onChange={e => setBody(e.target.value)} /></div>
        <div className="row-between"><div className="strong">Draft</div><div className={`toggle ${draft ? 'on' : ''}`} onClick={() => setDraft(d => !d)} /></div>
        <button className="btn btn-primary mt-3" style={{ width: '100%' }} onClick={create} disabled={busy || !title.trim() || !head || !base}>
          {busy ? <span className="spinner" /> : 'Crear PR'}
        </button>
      </div>
    </>
  );
}
