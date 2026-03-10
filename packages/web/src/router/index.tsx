import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ImportPage } from '@/pages/ImportPage';
import { BilanPage } from '@/pages/BilanPage';
import { CompteResultatPage } from '@/pages/CompteResultatPage';
import { SigPage } from '@/pages/SigPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { RapportActivitePage } from '@/pages/RapportActivitePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'bilan', element: <BilanPage /> },
      { path: 'compte-resultat', element: <CompteResultatPage /> },
      { path: 'sig', element: <SigPage /> },
      { path: 'rapport-activite', element: <RapportActivitePage /> },
      { path: 'comparaison', element: <div className="text-gray-500">Page de comparaison (à venir)</div> },
      { path: 'export', element: <div className="text-gray-500">Page d'export PDF (à venir)</div> },
      { path: 'parametres', element: <SettingsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
