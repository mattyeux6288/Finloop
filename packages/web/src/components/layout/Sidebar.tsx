import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  GitCompare,
  Download,
  Settings,
  LogOut,
  User,
  Shield,
  FolderInput,
  ChevronDown,
  FileBarChart2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/rapport-activite', label: "Rapport d'activité", icon: FileBarChart2 },
  { to: '/bilan', label: 'Bilan', icon: FileText },
  { to: '/compte-resultat', label: 'Compte de résultat', icon: BarChart3 },
  { to: '/sig', label: 'SIG', icon: TrendingUp },
  { to: '/comparaison', label: 'Comparaison', icon: GitCompare },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

const dataSubItems = [
  { to: '/import', label: 'Import FEC', icon: Upload },
  { to: '/export', label: 'Export PDF', icon: Download },
];

const activeClass = 'bg-accent-50 text-accent-700 shadow-[inset_3px_0_0_#E8621A]';
const inactiveClass = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { selectCompany } = useCompanyStore();
  const location = useLocation();

  const isDataRoute = location.pathname === '/import' || location.pathname === '/export';
  const [dataOpen, setDataOpen] = useState(isDataRoute);

  // Ouvre automatiquement si on navigue vers import ou export
  useEffect(() => {
    if (isDataRoute) setDataOpen(true);
  }, [isDataRoute]);

  const handleLogout = async () => {
    await logout();
    selectCompany(null);
    window.location.reload();
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* En-tête : logo RC + nom */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="/logo-rc.jpg"
            alt="Raly Conseils"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-base font-bold text-primary-600 leading-tight">Finloop</h1>
            <p className="text-[10px] text-gray-400 leading-tight">par Raly Conseils</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? activeClass : inactiveClass
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {/* Groupe Données : Import + Export */}
        <div>
          <button
            onClick={() => setDataOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDataRoute ? activeClass : inactiveClass
            }`}
          >
            <FolderInput className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">Données</span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${dataOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dataOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-gray-200 space-y-1">
              {dataSubItems.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? activeClass : inactiveClass
                    }`
                  }
                >
                  <sub.icon className="w-4 h-4" />
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Lien admin conditionnel */}
        {user?.role === 'admin' && (
          <>
            <div className="my-2 mx-3 h-px bg-gray-100" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? activeClass : inactiveClass
                }`
              }
            >
              <Shield className="w-5 h-5" />
              Administration
            </NavLink>
          </>
        )}
      </nav>

      {/* Pied : infos utilisateur + déconnexion */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      )}
    </aside>
  );
}
