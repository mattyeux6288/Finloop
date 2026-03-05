import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useEffect, useState } from 'react';
import type { Company } from '@finthesis/shared';
import { useCompanyStore } from './store/companyStore';
import { useAuthStore } from './store/authStore';
import { getCompanies, getFiscalYears } from './api/company.api';
import { getMe } from './api/auth.api';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeGreeting } from './components/WelcomeGreeting';
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

function AppInitializer() {
  const { setCompanies, selectedCompany, setFiscalYears } = useCompanyStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      getCompanies().then(setCompanies).catch(() => {});
    }
  }, [isAuthenticated, setCompanies]);

  useEffect(() => {
    if (selectedCompany) {
      getFiscalYears(selectedCompany.id).then(setFiscalYears).catch(() => {});
    }
  }, [selectedCompany, setFiscalYears]);

  return null;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pendingGreet, setPendingGreet] = useState<Company | null>(null);
  const { selectedCompany, selectCompany, setCompanies } = useCompanyStore();
  const { isAuthenticated, user, setUser, login: storeLogin, logout } = useAuthStore();

  // Au démarrage, vérifier si le token est encore valide
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) {
      getMe()
        .then((me) => {
          setUser({
            id: me.id,
            email: me.email,
            displayName: me.display_name,
            role: me.role,
          });
          setAuthChecked(true);
        })
        .catch(() => {
          // Token invalide → logout
          logout();
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = () => {
    // Recharger les companies après login
    getCompanies().then(setCompanies).catch(() => {});
  };

  const handleCompanySelect = (company: Company) => {
    setPendingGreet(company);
  };

  const handleGreetDone = () => {
    if (pendingGreet) {
      selectCompany(pendingGreet);
    }
    setPendingGreet(null);
  };

  const showSplash    = !splashDone;
  const showLogin     = splashDone && authChecked && !isAuthenticated;
  const showGreeting  = splashDone && authChecked && isAuthenticated && pendingGreet !== null;
  const showWelcome   = splashDone && authChecked && isAuthenticated && !pendingGreet && !selectedCompany;
  const showApp       = splashDone && authChecked && isAuthenticated && !pendingGreet && !!selectedCompany;

  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer />

      {/* Splash d'ouverture */}
      {showSplash && <SplashScreen onDone={() => setSplashDone(true)} />}

      {/* Page de connexion */}
      {showLogin && <LoginPage onLoginSuccess={handleLoginSuccess} />}

      {/* Écran de bienvenue personnalisé */}
      {showGreeting && user && (
        <WelcomeGreeting
          firstName={user.displayName.split(' ')[0] || user.displayName}
          lastName={user.displayName.split(' ').slice(1).join(' ') || ''}
          onDone={handleGreetDone}
        />
      )}

      {/* Page d'accueil (sélection entreprise) */}
      {showWelcome && <WelcomePage onSelect={handleCompanySelect} />}

      {/* Application principale */}
      {showApp && <RouterProvider router={router} />}
    </QueryClientProvider>
  );
}
