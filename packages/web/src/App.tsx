import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useEffect, useRef, useState } from 'react';
import type { Company } from '@finthesis/shared';
import { useCompanyStore, getSavedCompanyId, getSavedFyId } from './store/companyStore';
import { useAuthStore } from './store/authStore';
import { getCompanies, getFiscalYears } from './api/company.api';
import { getMe } from './api/auth.api';
import { supabase } from './config/supabase';
import { SplashScreen } from './components/SplashScreen';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// ─── Flag localStorage : l'utilisateur a déjà été accueilli ──────────────────
const ONBOARDED_KEY = 'finloop_onboarded';

function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1';
}

function markOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, '1');
}

// ─── AppInitializer ────────────────────────────────────────────────────────────
// Charge les companies et exercices, tente l'auto-sélection depuis localStorage.
// Appelle setAutoSelectDone() pour libérer la machine à états dès que c'est résolu.

interface AppInitializerProps {
  onAutoSelectDone: () => void;
}

function AppInitializer({ onAutoSelectDone }: AppInitializerProps) {
  const { setCompanies, selectCompany, selectedCompany, setFiscalYears, selectFiscalYear } =
    useCompanyStore();
  const { isAuthenticated } = useAuthStore();
  const autoSelectAttempted = useRef(false);

  // 1. Chargement des companies + auto-sélection
  useEffect(() => {
    if (!isAuthenticated) return;
    if (autoSelectAttempted.current) return;
    autoSelectAttempted.current = true;

    getCompanies()
      .then((companies) => {
        setCompanies(companies);

        if (companies.length === 0) {
          onAutoSelectDone();
          return;
        }

        const savedId = getSavedCompanyId();
        let companyToSelect: Company | undefined;

        if (savedId) {
          companyToSelect = companies.find((c) => c.id === savedId);
        }

        // Fallback : auto-sélection de la première company disponible
        if (!companyToSelect && companies.length > 0) {
          companyToSelect = companies[0];
        }

        if (companyToSelect) {
          selectCompany(companyToSelect);
          // Le useEffect suivant s'occupera des FY
        } else {
          onAutoSelectDone();
        }
      })
      .catch(() => {
        onAutoSelectDone();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 2. Chargement des exercices + auto-sélection FY
  useEffect(() => {
    if (!selectedCompany) return;

    getFiscalYears(selectedCompany.id)
      .then((fys) => {
        setFiscalYears(fys);

        if (fys.length === 0) {
          onAutoSelectDone();
          return;
        }

        const savedFyId = getSavedFyId();
        const fy = fys.find((f) => f.id === savedFyId) ?? fys[0];
        selectFiscalYear(fy);
        onAutoSelectDone();
      })
      .catch(() => {
        onAutoSelectDone();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id]);

  return null;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [autoSelectDone, setAutoSelectDone] = useState(false);
  const [onboarded, setOnboarded] = useState(isOnboarded());

  const { selectedCompany, selectCompany, setCompanies } = useCompanyStore();
  const { isAuthenticated, setUser, setSession, setLoading } = useAuthStore();
  const { clearSession } = useCompanyStore();

  // ── Initialisation session Supabase ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        getMe()
          .then((me) => {
            setUser({
              id: me.id,
              email: me.email,
              displayName: me.display_name,
              role: me.role,
            });
          })
          .catch(() => {});
      } else {
        // Pas de session → pas d'auto-sélection à attendre
        setAutoSelectDone(true);
      }
      setLoading(false);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getMe()
          .then((me) =>
            setUser({
              id: me.id,
              email: me.email,
              displayName: me.display_name,
              role: me.role,
            }),
          )
          .catch(() => {});
      } else {
        // Déconnexion → nettoyer le store company
        clearSession();
        setAutoSelectDone(true);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──
  const handleLoginSuccess = () => {
    setAutoSelectDone(false); // relance la machine à états pour l'auto-sélection post-login
    getCompanies().then(setCompanies).catch(() => {});
  };

  const handleWelcomeSelect = (company: Company) => {
    selectCompany(company);
    markOnboarded();
    setOnboarded(true);
  };

  // ── Machine à états ──
  const showSplash   = !splashDone;
  const showLogin    = splashDone && authChecked && !isAuthenticated;
  // WelcomePage : uniquement à la première connexion ET aucune company sélectionnée
  const showWelcome  = splashDone && authChecked && isAuthenticated && autoSelectDone
                       && !onboarded && !selectedCompany;
  // App : dès qu'on est onboardé OU qu'une company est sélectionnée
  const showApp      = splashDone && authChecked && isAuthenticated && autoSelectDone
                       && (onboarded || !!selectedCompany);

  return (
    <QueryClientProvider client={queryClient}>
      {/* AppInitializer lance l'auto-sélection dès qu'on est authentifié */}
      {authChecked && isAuthenticated && (
        <AppInitializer onAutoSelectDone={() => setAutoSelectDone(true)} />
      )}

      {showSplash && <SplashScreen onDone={() => setSplashDone(true)} />}

      {showLogin && <LoginPage onLoginSuccess={handleLoginSuccess} />}

      {showWelcome && <WelcomePage onSelect={handleWelcomeSelect} />}

      {showApp && <RouterProvider router={router} />}
    </QueryClientProvider>
  );
}
