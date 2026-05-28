import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { social, type User } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function FollowersPage({ login, mode }: { login: string; mode: 'followers' | 'following' }) {
  const router = useRouter();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const p = mode === 'followers' ? social.userFollowers(login, 100) : social.userFollowing(login, 100);
    p.then(setItems).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [login, mode]);
  return (
    <>
      <TopBar title={mode === 'followers' ? 'Followers' : 'Following'} sub={login} />
      <div className="scroll-area scroll">
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {items.map(u => (
            <div key={u.id} className="card-row" onClick={() => router.push({ name: 'profile', login: u.login })}>
              <div className="avatar"><img src={u.avatar_url} alt="" /></div>
              <div className="body">
                <div className="title">{u.login}</div>
                <div className="sub">{u.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
