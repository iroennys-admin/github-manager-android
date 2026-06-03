import React from 'react';

/**
 * Very small Markdown → HTML renderer.
 * Supports: headers, bold/italic, code (inline + fenced), links, images,
 * lists, quotes, hr, line breaks, tables (basic).
 * Sanitizes script/style/iframe tags.
 */
export default function Markdown({ text }: { text: string }) {
  const html = React.useMemo(() => renderMarkdown(text || ''), [text]);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdown(src: string): string {
  // Pre-extract code fences so they don't get processed.
  const fences: string[] = [];
  src = src.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
    fences.push(`<pre><code class="lang-${escapeHtml(lang || '')}">${escapeHtml(code)}</code></pre>`);
    return `\u0000F${fences.length - 1}\u0000`;
  });

  // Pre-extract inline code
  const inlines: string[] = [];
  src = src.replace(/`([^`\n]+)`/g, (_m, code) => {
    inlines.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000I${inlines.length - 1}\u0000`;
  });

  // Escape HTML
  let out = escapeHtml(src);

  // Headers
  out = out.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
           .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
           .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
           .replace(/^### (.*)$/gm, '<h3>$1</h3>')
           .replace(/^## (.*)$/gm, '<h2>$1</h2>')
           .replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  out = out.replace(/^---+$/gm, '<hr/>');

  // Blockquotes
  out = out.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>');

  // Images
  out = out.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img alt="$1" src="$2"/>');

  // Links
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold / italic / strike
  out = out
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // Lists
  out = out.replace(/((?:^|\n)(?:[*\-+] .*(?:\n|$))+)/g, (m) => {
    const items = m.trim().split(/\n/).map(l => l.replace(/^[*\-+]\s+/, '')).map(l => `<li>${l}</li>`).join('');
    return `\n<ul>${items}</ul>\n`;
  });
  out = out.replace(/((?:^|\n)(?:\d+\. .*(?:\n|$))+)/g, (m) => {
    const items = m.trim().split(/\n/).map(l => l.replace(/^\d+\.\s+/, '')).map(l => `<li>${l}</li>`).join('');
    return `\n<ol>${items}</ol>\n`;
  });

  // Tables (very basic)
  out = out.replace(/(^\|.+\|\n\|[-:\s|]+\|\n(?:\|.*\|\n?)+)/gm, (block) => {
    const lines = block.trim().split('\n');
    const header = lines[0].split('|').slice(1, -1).map(s => s.trim());
    const rows = lines.slice(2).map(r => r.split('|').slice(1, -1).map(s => s.trim()));
    let html = '<table><thead><tr>';
    header.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    rows.forEach(r => {
      html += '<tr>';
      r.forEach(c => html += `<td>${c}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  });

  // Paragraphs and line breaks
  out = out.split(/\n{2,}/).map(p => {
    if (/^\s*<(h[1-6]|ul|ol|pre|blockquote|hr|table|img)/.test(p)) return p;
    if (/^\u0000F\d+\u0000/.test(p)) return p;
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  // Restore code fences & inline
  out = out.replace(/\u0000F(\d+)\u0000/g, (_m, i) => fences[Number(i)]);
  out = out.replace(/\u0000I(\d+)\u0000/g, (_m, i) => inlines[Number(i)]);

  return out;
}
