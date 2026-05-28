import React, { useState } from 'react';
import TopBar from '../ui/TopBar';
import { issues } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function CreateIssuePage({ owner, repo }: { owner: string; repo: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try { const i = await issues.create(owner, repo, { title: title.trim(), body }); toast.success('Issue creado'); router.replace({ name: 'issue', owner, repo, number: i.number }); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title="Nuevo issue" sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        <div className="field"><label>Título</label><input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><label>Descripción (markdown)</label><textarea rows={10} value={body} onChange={e => setBody(e.target.value)} /></div>
        <button className="btn btn-primary mt-2" style={{ width: '100%' }} onClick={create} disabled={busy || !title.trim()}>
          {busy ? <span className="spinner" /> : 'Crear'}
        </button>
      </div>
    </>
  );
}
