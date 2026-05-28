import React from 'react';
import TopBar from '../ui/TopBar';

export default function AboutPage() {
  return (
    <>
      <TopBar title="Acerca de" />
      <div className="scroll-area scroll" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 80 }}>🐙</div>
        <h2 className="strong" style={{ margin: '6px 0' }}>OctoMobile</h2>
        <div className="muted small">v1.0.0 · built with React + Capacitor</div>
        <div className="muted small mt-3">Tu cliente completo de GitHub para Android.</div>
        <div className="card mt-4" style={{ textAlign: 'left' }}>
          <p>Cobertura:</p>
          <ul>
            <li>Repos · Issues · PRs · Branches · Commits · Files</li>
            <li>Actions · Releases · Gists · Notifications</li>
            <li>Search (code · repos · issues · users)</li>
            <li>Organizations · Followers/Following · Starred</li>
            <li>Profile editing, reactions, labels, milestones</li>
          </ul>
          <p className="muted tiny mt-2">Tus credenciales se almacenan localmente. Soporta login con Personal Access Token y OAuth Device Flow.</p>
        </div>
      </div>
    </>
  );
}
