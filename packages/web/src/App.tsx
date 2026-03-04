import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useEffect, useState } from 'react';
import type { Company } from '@finthesis/shared';
import { useCompanyStore } from './store/companyStore';
import { getCompanies, getFiscalYears } from './api/company.api';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeGreeting } from './components/WelcomeGreeting';
import { WelcomePage } from './pages/WelcomePage';

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

  useEffect(() => {
    getCompanies().then(setCompanies).catch(() => {});
  }, [setCompanies]);

  useEffect(() => {
    if (selectedCompany) {
      getFiscalYears(selectedCompany.id).then(setFiscalYears).catch(() => {});
    }
  }, [selectedCompany, setFiscalYears]);

  return null;
}

interface PendingGreet {
  firstName: string;
  lastName: string;
  company: Company;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [pendingGreet, setPendingGreet] = useState<PendingGreet | null>(null);
  const { selectedCompany, selectCompany } = useCompanyStore();

  const handleGreet = (firstName: string, lastName: string, company: Company) => {
    setPendingGreet({ firstName, lastName, company });
  };

  const handleGreetDone = () => {
    if (pendingGreet) {
      selectCompany(pendingGreet.company);
    }
    setPendingGreet(null);
  };

  const showGreeting = splashDone && pendingGreet !== null;
  const showWelcome  = splashDone && !pendingGreet && !selectedCompany;
  const showApp      = splashDone && !pendingGreet && !!selectedCompany;

  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer />

      {/* Splash d'ouverture */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      {/* Écran de bienvenue personnalisé (5 s) */}
      {showGreeting && (
        <WelcomeGreeting
          firstName={pendingGreet!.firstName}
          lastName={pendingGreet!.lastName}
          onDone={handleGreetDone}
        />
      )}

      {/* Page d'accueil (sélection entreprise + identité) */}
      {showWelcome && <WelcomePage onGreet={handleGreet} />}

      {/* Application principale */}
      {showApp && <RouterProvider router={router} />}
    </QueryClientProvider>
  );
}
