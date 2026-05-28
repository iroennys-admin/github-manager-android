import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, type ContentEntry } from '../api/github';
import Markdown from '../ui/Markdown';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function FileViewPage({ owner, repo, path, refSpec }: { owner: string; repo: string; path: string; refSpec?: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [content, setContent] = useState('');
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    git.contents(owner, repo, path, refSpec).then(r => {
      const e = (Array.isArray(r) ? r[0] : r) as ContentEntry;
      setEntry(e);
      const lower = path.toLowerCase();
      if (/\.(png|jpe?g|gif|svg|webp|bmp)$/.test(lower)) { setIsImage(true); return; }
      try { setContent(git.decodeContent(e)); }
      catch { setContent('[no se puede decodificar]'); }
    }).catch(e => toast.error(e.message));
  }, [owner, repo, path, refSpec]);

  if (!entry) return (<><TopBar title="File" /><div className="loading"><span className="spinner" /> Cargando…</div></>);
  const isMd = path.toLowerCase().endsWith('.md');

  return (
    <>
      <TopBar title={path.split('/').pop() || path} sub={`${owner}/${repo}`}
        actions={<button className="btn-icon" onClick={() => router.push({ name: 'edit-file', owner, repo, path, sha: entry.sha, content, ref: refSpec })}>✎</button>} />
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        {isImage ? (
          <div style={{ textAlign: 'center' }}><img src={entry.download_url || ''} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} /></div>
        ) : isMd ? (
          <div className="card"><Markdown text={content} /></div>
        ) : (
          <pre className="card" style={{ maxHeight: '85vh', overflow: 'auto', userSelect: 'text' }}><code>{content}</code></pre>
        )}
      </div>
    </>
  );
}
