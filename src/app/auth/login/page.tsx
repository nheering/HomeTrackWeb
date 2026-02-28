'use client';

import { useState } from 'react';
import { useSignInEmailPassword, useSignUpEmailPassword } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');

  const {
    signInEmailPassword,
    isLoading: signInLoading,
    isError: signInError,
    error: signInErrorObj,
  } = useSignInEmailPassword();

  const {
    signUpEmailPassword,
    isLoading: signUpLoading,
    isError: signUpError,
    error: signUpErrorObj,
  } = useSignUpEmailPassword();

  const loading = signInLoading || signUpLoading;
  const error = mode === 'login' ? signInErrorObj : signUpErrorObj;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const { error } = await signInEmailPassword(email, password);
      if (!error) router.push('/');
    } else {
      const { error } = await signUpEmailPassword(email, password, {
        displayName: name,
      });
      if (!error) router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <Zap className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-tx-primary">
            <span className="text-accent">Home</span>Track
          </h1>
          <p className="text-sm text-tx-secondary mt-1">Verbrauchsüberwachung für deinen Haushalt</p>
        </div>

        {/* Card */}
        <div className="ht-card">
          {/* Tab Switch */}
          <div className="flex bg-bg-base rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${mode === m
                    ? 'bg-accent text-white shadow-accent'
                    : 'text-tx-muted hover:text-tx-primary'
                  }`}
              >
                {m === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="ht-label">Name</label>
                <input
                  type="text"
                  className="ht-input"
                  placeholder="Max Mustermann"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="ht-label">E-Mail</label>
              <input
                type="email"
                className="ht-input"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="ht-label">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="ht-input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-muted hover:text-tx-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{error.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ht-btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                'Anmelden'
              ) : (
                'Konto erstellen'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-tx-muted mt-6">
          Deine Daten werden sicher in der EU gespeichert.
        </p>
      </div>
    </div>
  );
}
