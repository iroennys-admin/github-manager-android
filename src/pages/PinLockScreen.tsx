// ============================================================
// OctoMobile · PIN Lock Screen
// ============================================================

import React, { useState } from 'react';
import { useApp } from '../state/store';

const PIN_KEY = 'octomobile_pin';

function getStoredPin(): string {
  return localStorage.getItem(PIN_KEY) || '';
}

function setStoredPin(pin: string) {
  localStorage.setItem(PIN_KEY, pin);
}

function clearStoredPin() {
  localStorage.removeItem(PIN_KEY);
}

interface Props {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: Props) {
  const app = useApp();
  const hasPin = !!getStoredPin();
  const [mode, setMode] = useState<'setup' | 'confirm' | 'unlock' | 'disable'>(
    hasPin ? 'unlock' : 'setup'
  );
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (pin.length >= 4) return;
    const newPin = pin + key;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      if (mode === 'setup') {
        setConfirmPin(newPin);
        setPin('');
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (newPin === confirmPin) {
          setStoredPin(newPin);
          app.updateSettings({ pinLockEnabled: true });
          onUnlock();
        } else {
          setError('PINs no coinciden');
          setPin('');
          setConfirmPin('');
          setMode('setup');
        }
      } else if (mode === 'unlock') {
        if (newPin === getStoredPin()) {
          onUnlock();
        } else {
          setError('PIN incorrecto');
          setPin('');
        }
      } else if (mode === 'disable') {
        if (newPin === getStoredPin()) {
          clearStoredPin();
          app.updateSettings({ pinLockEnabled: false });
          onUnlock();
        } else {
          setError('PIN incorrecto');
          setPin('');
        }
      }
    }
  };

  const title = mode === 'setup' ? 'Crear PIN' : mode === 'confirm' ? 'Confirmar PIN' : mode === 'disable' ? 'Desactivar PIN' : 'Desbloquear';
  const subtitle = mode === 'setup' ? 'Ingresa un PIN de 4 dígitos' : mode === 'confirm' ? 'Confirma tu PIN' : mode === 'disable' ? 'Ingresa tu PIN actual' : 'Ingresa tu PIN para desbloquear';

  return (
    <div className="lock-overlay">
      <div className="lock-icon">🔒</div>
      <div className="strong" style={{ fontSize: 20 }}>{title}</div>
      <div className="muted small">{subtitle}</div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>{error}</div>}
      <div className="pin-dots">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
        ))}
      </div>
      <div className="pin-keypad">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, i) => (
          <button
            key={i}
            className={`pin-key ${key === '' ? 'empty' : key === 'del' ? 'delete' : ''}`}
            onClick={() => key && handleKey(key)}
            disabled={key === ''}
          >
            {key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  );
}

// Export utility for settings page
export { getStoredPin, setStoredPin, clearStoredPin };
