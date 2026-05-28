import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { gists } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

interface F { filename: string; content: string; }

export default function EditGistPage({ id }: { id?: string }) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [isPublic, setPublic] = useState(true);
  const [files, setFiles] = useState<F[]>([{ filename: 'file1.txt', content: '' }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    gists.get(id).then(g => {
      setDescription(g.description || '');
      setPublic(g.public);
      setFiles(Object.values(g.files).map(f => ({ filename: f.filename, content: f.content || '' })));
    }).catch(e => toast.error(e.message));
  }, [id]);

  const save = async () => {
    if (files.some(f => !f.filename)) { toast.error('Falta nombre de archivo'); return; }
    setBusy(true);
    try {
      const filesMap: any = {};
      files.forEach(f => filesMap[f.filename] = { content: f.content });
      if (id) {
        await gists.update(id, { description, files: filesMap });
        toast.success('Actualizado');
      } else {
        const g = await gists.create({ description, public: isPublic, files: filesMap });
        toast.success('Gist creado');
        router.replace({ name: 'gist', id: g.id });
        return;
      }
      router.back();
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title={id ? 'Editar Gist' : 'Nuevo Gist'} />
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        <div className="field">
          <label>Descripción</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional…" />
        </div>
        {!id && (
          <div className="row-between mt-2">
            <div className="strong">Público</div>
            <div className={`toggle ${isPublic ? 'on' : ''}`} onClick={() => setPublic(p => !p)} />
          </div>
        )}
        {files.map((f, i) => (
          <div key={i} className="card mt-2">
            <input value={f.filename} onChange={e => setFiles(p => p.map((x, idx) => idx === i ? { ...x, filename: e.target.value } : x))} placeholder="nombre.ext" />
            <textarea rows={10} value={f.content} onChange={e => setFiles(p => p.map((x, idx) => idx === i ? { ...x, content: e.target.value } : x))} className="mt-2" />
            {files.length > 1 && (
              <button className="btn btn-danger btn-sm mt-2" onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))}>Eliminar</button>
            )}
          </div>
        ))}
        <button className="btn mt-2" style={{ width: '100%' }} onClick={() => setFiles(p => [...p, { filename: `file${p.length + 1}.txt`, content: '' }])}>
          + Añadir archivo
        </button>
        <button className="btn btn-primary mt-3" style={{ width: '100%' }} onClick={save} disabled={busy}>
          {busy ? <span className="spinner" /> : (id ? 'Guardar' : 'Crear gist')}
        </button>
      </div>
    </>
  );
}
