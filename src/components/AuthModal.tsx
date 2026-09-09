import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason?: string | null;
}

export default function AuthModal({ open, onClose, onSuccess, reason }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setInfo('Enviamos um e-mail de confirmação. Confirme sua conta para entrar.');
          setLoading(false);
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      }
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Não foi possível continuar.';
      if (msg.toLowerCase().includes('invalid login')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.toLowerCase().includes('already registered')) {
        setError('Este e-mail já possui cadastro. Faça login.');
      } else {
        setError(msg);
      }
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setLoading(false);
        setError('Não foi possível entrar com o Google.');
        return;
      }
      if (result.redirected) return;
      setLoading(false);
      onSuccess();
    } catch {
      setLoading(false);
      setError('Não foi possível entrar com o Google.');
    }
  };

  return (
    <div className="mf-auth-overlay" role="dialog" aria-modal="true">
      <div className="mf-auth-card">
        <button className="mf-auth-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className="mf-auth-header">
          <div className="mf-auth-logo">🥬</div>
          <h2 className="mf-auth-title">{mode === 'login' ? 'Entrar na sua conta' : 'Criar sua conta'}</h2>
          <p className="mf-auth-sub">
            {reason || 'Acesse para acompanhar seus pedidos em tempo real.'}
          </p>
        </div>

        <button className="mf-auth-google" onClick={handleGoogle} disabled={loading} type="button">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.2 36.5 44 31 44 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continuar com Google
        </button>

        <div className="mf-auth-divider"><span>ou</span></div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label><UserIcon size={13} /> Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
              />
            </div>
          )}
          <div className="field">
            <label><Mail size={13} /> E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label><Lock size={13} /> Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="mf-auth-error">{error}</div>}
          {info && <div className="mf-auth-info">{info}</div>}

          <button className="primarybtn mf-auth-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="mf-auth-spin" /> : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="mf-auth-switch">
          {mode === 'login' ? (
            <>
              Ainda não tem conta?{' '}
              <button type="button" onClick={() => { setMode('signup'); setError(null); setInfo(null); }}>
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(null); setInfo(null); }}>
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
