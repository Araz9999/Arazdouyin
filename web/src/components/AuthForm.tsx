import { useState, type FormEvent } from 'react';
import { closeAuthSheet, login, register } from '../store/auth';
import { authStore } from '../store/auth';
import { navigate } from '../router/router';
import { toast } from '../store/ui';
import { SpinnerIcon } from './icons';
import { useI18n } from '../store/i18n';

export function AuthForm({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError(t('auth_error_required'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user =
        mode === 'login'
          ? await login(username.trim(), password)
          : await register(username.trim(), password, displayName.trim() || undefined);
      toast(t('welcome_user', { name: user.display_name || user.username }), 'ok');
      const pending = authStore.get().pending;
      closeAuthSheet();
      if (pending) pending();
      else if (window.location.hash.startsWith('#/login')) navigate('/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth_error_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={`auth-form ${compact ? 'compact' : ''}`} onSubmit={submit}>
      <div className="auth-switch">
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
          {t('auth_tab_login')}
        </button>
        <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>
          {t('auth_tab_register')}
        </button>
      </div>
      <label className="field">
        <span>{t('auth_username')}</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('auth_username_placeholder')} autoComplete="username" />
      </label>
      {mode === 'register' ? (
        <label className="field">
          <span>{t('auth_display_name')}</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('auth_display_name_placeholder')} />
        </label>
      ) : null}
      <label className="field">
        <span>{t('auth_password')}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth_password_placeholder')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn accent block" type="submit" disabled={busy}>
        {busy ? <SpinnerIcon size={18} /> : null}
        <span>{mode === 'login' ? t('auth_btn_login') : t('auth_btn_register')}</span>
      </button>
      <p className="auth-tip">{t('auth_tip')}</p>
    </form>
  );
}
