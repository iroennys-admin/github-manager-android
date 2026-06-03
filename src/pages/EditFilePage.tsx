import React, { useState } from 'react';
import TopBar from '../ui/TopBar';
import { git } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

interface Props { owner: string; repo: string; path: string; sha?: string; content?: string; refSpec?: string; }

export default function EditFilePage({ owner, repo, path, sha, content = '', refSpec }: Props) {
  const router = useRouter();
  const [text, setText] = useState(content);
  const [msg, setMsg] = useState(`Update ${path}`);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await git.putFile(owner, repo, path, {
        message: msg || `Update ${path}`, content: text, sha, branch: refSpec,
      });
      toast.success('Guardado');
      router.back();
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title={`Edit · ${path.split('/').pop()}`} sub={`${owner}/${repo}`}
        actions={<button className="btn-icon" onClick={save} disabled={busy}>💾</button>} />
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        <textarea rows={20} value={text} onChange={e => setText(e.target.value)} className="mono" style={{ fontSize: 13 }} />
        <div className="field mt-2">
          <label>Commit message</label>
          <input value={msg} onChange={e => setMsg(e.target.value)} />
        </div>
        <button className="btn btn-primary mt-2" style={{ width: '100%' }} onClick={save} disabled={busy}>
          {busy ? <span className="spinner" /> : '💾 Commit'}
        </button>
      </div>
    </>
  );
}
