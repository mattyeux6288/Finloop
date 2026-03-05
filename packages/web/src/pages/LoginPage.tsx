import { useState, FormEvent } from 'react';
import { useAuthStore } from '@/store/authStore';
import { login, setupPassword } from '@/api/auth.api';
import { FinloopLogo } from '@/components/FinloopLogo';
import { LogIn, KeyRound, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    login: storeLogin,
    needsPasswordSetup,
    setupEmail,
    setNeedsPasswordSetup,
    clearPasswordSetup,
  } = useAuthStore();

  const isSetupMode = needsPasswordSetup && setupEmail;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      storeLogin(result.user, result.accessToken, result.refreshToken);
      onLoginSuccess();
    } catch (err: any) {
      const apiError = err?.response?.data?.error;

      // Détecter le code FIRST_LOGIN_REQUIRED
      if (apiError?.code === 'FIRST_LOGIN_REQUIRED') {
        setNeedsPasswordSetup(email);
        setPassword('');
        setError('');
      } else {
        setError(apiError?.message || err?.message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const result = await setupPassword(setupEmail!, password);
      storeLogin(result.user, result.accessToken, result.refreshToken);
      onLoginSuccess();
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setError(apiError?.message || err?.message || 'Erreur lors de la création du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearPasswordSetup();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  // Raccourci premier login : aller directement au setup sans taper de mdp bidon
  const handleFirstLoginClick = () => {
    if (!email) {
      setError('Veuillez saisir votre adresse e-mail.');
      return;
    }
    setError('');
    setPassword('');
    setNeedsPasswordSetup(email);
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
            {!isSetupMode ? (
              <>
                {/* Mode connexion classique */}
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

                {/* Séparateur + lien premier accès */}
                <div className="mt-5">
                  <div className="relative flex items-center mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-300 px-3">ou</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <button
                    type="button"
                    onClick={handleFirstLoginClick}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors py-2.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Première connexion ? Définir mon mot de passe
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Mode premier login : définir le mot de passe */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50">
                    <KeyRound className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Premier accès</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Définissez votre mot de passe pour <strong>{setupEmail}</strong>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSetupPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 6 caractères"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                      required
                      minLength={6}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez le mot de passe"
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
                    {loading ? 'Création...' : 'Définir le mot de passe et continuer'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
                  >
                    Retour à la connexion
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
