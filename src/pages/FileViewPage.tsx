import React, { useEffect, useState, useMemo } from 'react';
import TopBar from '../ui/TopBar';
import { git, type ContentEntry } from '../api/github';
import Markdown from '../ui/Markdown';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';

async function copyText(text: string) {
  try {
    await Clipboard.write({ string: text });
  } catch {
    // Fallback to web API
    await navigator.clipboard.writeText(text);
  }
}

async function shareText(text: string) {
  try {
    await Share.share({ text });
  } catch {
    // Fallback to clipboard
    await copyText(text);
    toast.success('Copiado al portapapeles');
  }
}

interface Props { owner: string; repo: string; path: string; refSpec?: string }

export default function FileViewPage({ owner, repo, path, refSpec }: Props) {
  const router = useRouter();
  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [content, setContent] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [search, setSearch] = useState('');
  const [searchIdx, setSearchIdx] = useState(-1);

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

  const ext = path.split('.').pop()?.toLowerCase() || '';
  const isMd = path.toLowerCase().endsWith('.md');
  const isShaRef = /^[0-9a-f]{40}$/i.test(refSpec || '');
  const isBinary = /\.(png|jpe?g|gif|svg|webp|bmp|ico|zip|tar|gz|exe|dll|so|dylib|pdf|docx?|xlsx?|pptx?|mp3|mp4|wav|avi|mov)$/i.test(path);

  const highlighted = useMemo(() => {
    if (!content || isMd || isBinary) return content;
    return highlightSyntax(content, ext);
  }, [content, ext, isMd, isBinary]);

  // Simple search
  const matchPositions = useMemo(() => {
    if (!search || !content) return [];
    const positions: number[] = [];
    const lower = content.toLowerCase();
    const q = search.toLowerCase();
    let pos = 0;
    while ((pos = lower.indexOf(q, pos)) !== -1) { positions.push(pos); pos += 1; }
    return positions;
  }, [content, search]);

  if (!entry) return (<><TopBar title="File" /><div className="loading"><span className="spinner" /> Cargando…</div></>);

  return (
    <>
      <TopBar title={path.split('/').pop() || path} sub={`${owner}/${repo}`}
        actions={
          <div className="flex gap-1">
            <button className="btn-icon" onClick={() => router.push({ name: 'blame', owner, repo, path, ref: refSpec })} title="Blame view">👁</button>
            <button className="btn-icon" onClick={() => { copyText(content); toast.success('Contenido copiado'); }} title="Copiar contenido">📋</button>
            <button className="btn-icon" onClick={() => setWrap(!wrap)} title="Toggle word wrap">
              {wrap ? '↩️' : '➡️'}
            </button>
            {/* Solo mostrar botón de edición si NO es un ref histórico (SHA) */}
            {!isShaRef && (
              <button className="btn-icon" onClick={() => router.push({ name: 'edit-file', owner, repo, path, sha: entry.sha, content, ref: refSpec })}>✎</button>
            )}
          </div>
        }
      />
      {/* Banner de archivo histórico */}
      {isShaRef && (
        <div style={{
          background: 'rgba(210,153,34,0.15)',
          borderBottom: '1px solid rgba(210,153,34,0.4)',
          padding: '6px 14px',
          fontSize: 12,
          color: 'var(--warn)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          🕐 <span>Versión histórica · commit <code className="mono">{refSpec!.slice(0, 7)}</code> · solo lectura</span>
        </div>
      )}
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        {isImage ? (
          <div style={{ textAlign: 'center' }}><img src={entry.download_url || ''} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} /></div>
        ) : isMd ? (
          <div className="card"><Markdown text={content} /></div>
        ) : isBinary ? (
          <div className="empty">
            <div className="ico">📦</div>
            <div className="title">Archivo binario</div>
            <div className="muted small">{(entry.size / 1024).toFixed(1)} KB</div>
            {entry.download_url && <button className="btn btn-primary mt-2" onClick={() => window.open(entry.download_url, '_blank')}>⬇️ Descargar</button>}
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="flex gap-2" style={{ marginBottom: 8 }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setSearchIdx(0); }} placeholder="Buscar…" style={{ flex: 1 }} />
              {matchPositions.length > 0 && (
                <span className="muted small" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
                  {searchIdx + 1}/{matchPositions.length}
                  <button className="btn btn-sm" style={{ marginLeft: 4 }} onClick={() => setSearchIdx(i => (i + 1) % matchPositions.length)}>↓</button>
                </span>
              )}
            </div>
            <pre className="card code-block" style={{
              maxHeight: '85vh',
              overflow: 'auto',
              userSelect: 'text',
              whiteSpace: wrap ? 'pre-wrap' : 'pre',
              wordBreak: wrap ? 'break-all' : 'normal',
            }}><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
          </>
        )}
      </div>
    </>
  );
}

// ── Lightweight syntax highlighter (no external deps) ────────
const KEYWORDS: Record<string, Set<string>> = {
  ts: new Set(['import','export','from','default','const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','super','interface','type','enum','async','await','try','catch','finally','throw','typeof','instanceof','in','of','void','null','undefined','true','false','as','implements','private','public','protected','static','readonly','abstract','override','declare','namespace','module','require']),
  js: new Set(['import','export','from','default','const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','super','async','await','try','catch','finally','throw','typeof','instanceof','in','of','void','null','undefined','true','false','yield','delete']),
  py: new Set(['import','from','def','class','return','if','elif','else','for','while','break','continue','pass','try','except','finally','raise','with','as','yield','lambda','and','or','not','is','in','True','False','None','self','global','nonlocal','assert','del','async','await']),
  java: new Set(['import','package','public','private','protected','static','final','abstract','class','interface','extends','implements','new','this','super','return','if','else','for','while','do','switch','case','break','continue','try','catch','finally','throw','throws','void','int','long','double','float','boolean','char','byte','short','null','true','false','instanceof']),
  kt: new Set(['package','import','val','var','fun','class','object','interface','enum','when','if','else','for','while','do','return','break','continue','try','catch','finally','throw','null','true','false','this','super','is','as','in','override','private','protected','public','internal','open','abstract','sealed','data','companion','suspend','inline','reified','by','lazy','init']),
  rs: new Set(['fn','let','mut','const','if','else','for','while','loop','match','return','break','continue','struct','enum','impl','trait','pub','use','mod','crate','self','super','where','type','as','in','ref','move','async','await','unsafe','static','dyn','true','false']),
  go: new Set(['package','import','func','var','const','type','struct','interface','map','chan','go','select','case','default','if','else','for','range','switch','return','break','continue','defer','fallthrough','nil','true','false']),
  rb: new Set(['require','def','end','class','module','if','elsif','else','unless','while','until','for','do','begin','rescue','ensure','raise','return','yield','lambda','proc','attr','attr_accessor','attr_reader','attr_writer','self','super','nil','true','false']),
  sh: new Set(['if','then','else','elif','fi','for','while','do','done','case','esac','function','return','exit','echo','export','source','local','readonly','in','true','false']),
  sql: new Set(['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','INDEX','JOIN','INNER','LEFT','RIGHT','OUTER','ON','AND','OR','NOT','NULL','IS','IN','BETWEEN','LIKE','ORDER','BY','GROUP','HAVING','LIMIT','OFFSET','UNION','AS','DISTINCT','COUNT','SUM','AVG','MAX','MIN','EXISTS','CASE','WHEN','THEN','ELSE','END','PRIMARY','KEY','FOREIGN','REFERENCES','CONSTRAINT','DEFAULT','AUTO_INCREMENT','VARCHAR','INT','TEXT','BOOLEAN','TIMESTAMP']),
  css: new Set(['@media','@keyframes','@import','@font-face','@supports','@layer','!important','var','calc','min','max','clamp','rgb','rgba','hsl','hsla','linear-gradient','radial-gradient']),
  yaml: new Set(['true','false','null','yes','no']),
  xml: new Set([]),
  json: new Set([]),
  toml: new Set(['true','false']),
};

function langForExt(ext: string): string {
  const map: Record<string, string> = {
    ts: 'ts', tsx: 'ts', js: 'js', jsx: 'js', mjs: 'js', cjs: 'js',
    py: 'py', pyw: 'py', java: 'java', kt: 'kt', kts: 'kt',
    rs: 'rs', go: 'go', rb: 'rb', sh: 'sh', bash: 'sh', zsh: 'sh',
    sql: 'sql', css: 'css', scss: 'css', less: 'css', sass: 'css',
    yml: 'yaml', yaml: 'yaml', xml: 'xml', html: 'xml', htm: 'xml', svg: 'xml',
    json: 'json', toml: 'toml', c: 'java', cpp: 'java', h: 'java', hpp: 'java',
    swift: 'kt', scala: 'java', php: 'js', cs: 'java',
  };
  return map[ext] || 'js';
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSyntax(code: string, ext: string): string {
  const lang = langForExt(ext);
  const kw = KEYWORDS[lang] || KEYWORDS['js'];

  // Process line by line for safety
  const lines = code.split('\n');
  return lines.map(line => {
    let escaped = escapeHtml(line);

    // Comments (single-line)
    if (lang === 'py' || lang === 'rb' || lang === 'sh' || lang === 'toml') {
      escaped = escaped.replace(/(#.*)$/gm, '<span class="hl-comment">$1</span>');
    } else if (lang === 'sql') {
      escaped = escaped.replace(/(--.*)$/gm, '<span class="hl-comment">$1</span>');
    } else {
      escaped = escaped.replace(/(\/\/.*)$/gm, '<span class="hl-comment">$1</span>');
    }

    // Strings
    escaped = escaped.replace(/(&quot;|&#39;|'|")((?:(?!\1).)*?)\1/g, '<span class="hl-string">$1$2$1</span>');

    // Numbers
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');

    // Keywords
    if (kw.size > 0) {
      const pattern = new RegExp(`\\b(${Array.from(kw).join('|')})\\b`, 'g');
      escaped = escaped.replace(pattern, (m) => `<span class="hl-keyword">${m}</span>`);
    }

    // Decorators / annotations
    escaped = escaped.replace(/@(\w+)/g, '<span class="hl-decorator">@$1</span>');

    return escaped;
  }).join('\n');
}
