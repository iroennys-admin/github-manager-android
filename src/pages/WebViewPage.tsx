import React from 'react';
import TopBar from '../ui/TopBar';

export default function WebViewPage({ url, title }: { url: string; title?: string }) {
  return (
    <>
      <TopBar title={title || 'Web'} sub={url} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe src={url} style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
      </div>
    </>
  );
}
