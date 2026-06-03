import React from 'react';
import { useRouter } from '../state/router';

interface Props {
  title: string;
  sub?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export default function TopBar({ title, sub, showBack = true, actions }: Props) {
  const router = useRouter();
  return (
    <div className="topbar">
      {showBack && router.stack.length > 1 && (
        <button className="btn-icon" onClick={() => router.back()} aria-label="Back">
          <span style={{ fontSize: 20 }}>‹</span>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title">{title}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div className="flex gap-1">{actions}</div>}
    </div>
  );
}
