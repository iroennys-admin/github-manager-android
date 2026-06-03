import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { orgs, type Organization } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function OrgsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { orgs.mine(30).then(setItems).catch(e => toast.error(e.message)).finally(() => setLoading(false)); }, []);
  return (
    <>
      <TopBar title="Organizaciones" showBack={false} />
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {!loading && items.length === 0 && <div className="empty"><div className="ico">🏢</div><div className="title">Sin orgs</div></div>}
          {items.map(o => (
            <div key={o.id} className="card-row" onClick={() => router.push({ name: 'profile', login: o.login })}>
              <div className="avatar"><img src={o.avatar_url} alt="" /></div>
              <div className="body">
                <div className="title">{o.login}</div>
                {o.description && <div className="sub" style={{ whiteSpace: 'normal' }}>{o.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
