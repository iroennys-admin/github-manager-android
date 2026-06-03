// Tiny imperative toast manager
import React, { useEffect, useState } from 'react';

interface ToastItem { id: number; type: 'info' | 'success' | 'error'; text: string; }

let pushFn: ((t: Omit<ToastItem, 'id'>) => void) | null = null;
export const toast = {
  info:    (t: string) => pushFn?.({ type: 'info',    text: t }),
  success: (t: string) => pushFn?.({ type: 'success', text: t }),
  error:   (t: string) => pushFn?.({ type: 'error',   text: t }),
};

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushFn = (t) => {
      const id = Date.now() + Math.random();
      setItems((p) => [...p, { id, ...t }]);
      setTimeout(() => setItems((p) => p.filter(x => x.id !== id)), 2800);
    };
    return () => { pushFn = null; };
  }, []);
  return (
    <div className="toast-host">
      {items.map(i => <div key={i.id} className={`toast ${i.type}`}>{i.text}</div>)}
    </div>
  );
}
