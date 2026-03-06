import { useState, FormEvent } from 'react';
import { supabase } from '@/config/supabase';
import { FinloopLogo } from '@/components/FinloopLogo';
import { LogIn, ArrowRight, AlertCircle, Mail } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : authError.message);
    } else {
      onLoginSuccess();
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Veuillez saisir votre adresse e-mail.');
      return;
    }
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5]">
      {/* Header branded */}
      <div className="py-16 px-6 flex flex-col items-center bg-brand-gradient">
        <FinloopLogo size={64} variant="white" className="mb-4 drop-shadow" />
        <h1 className="text-5xl font-bold text-white tracking-brand-h2">Finloop</h1>
        <p className="text-white/70 mt-2 tracking-brand-wide text-sm uppercase font-light">
          Analyse financière
        </p>
      </div>

      {/* Carte de connexion */}
      <div className="flex-1 flex items-start justify-center pt-10 px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
          <div className="p-8">
            {resetSent ? (
              /* Confirmation email envoyé */
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7 text-green-500" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Email envoyé</h2>
                <p className="text-sm text-gray-500">
                  Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                  Consultez votre boîte de réception.
                </p>
                <button
                  onClick={() => { setResetSent(false); setError(''); }}
                  className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <>
                {/* Mode connexion */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-50">
                    <LogIn className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Connexion</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Identifiez-vous pour accéder à votre espace
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@finloop.fr"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all hover:opacity-90 active:scale-95 bg-brand-gradient"
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* Mot de passe oublié */}
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
