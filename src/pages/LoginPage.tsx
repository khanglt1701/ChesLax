import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n/t';
import { ApiError } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = (location.state as { from?: string } | null)?.from ?? '/profile';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError(t('auth.required'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
      navigate(next, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? t('auth.genericError') : t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl">{t('auth.loginTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{t('auth.loginSubtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-100" role="alert">
            {error}
          </p>
        ) : null}
        <label className="block text-sm font-medium">
          {t('auth.username')}
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-950"
          />
        </label>
        <label className="block text-sm font-medium">
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-950"
          />
        </label>
        <Button type="submit" className="w-full" disabled={busy}>
          {t('auth.submitLogin')}
        </Button>
      </form>
      <p className="text-sm text-stone-500">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-brand hover:underline">
          {t('nav.register')}
        </Link>
        {' · '}
        <Link to="/games" className="font-medium text-brand hover:underline">
          {t('auth.guestContinue')}
        </Link>
      </p>
    </div>
  );
}
