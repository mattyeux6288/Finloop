import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/bilan', label: 'Bilan', icon: FileText },
  { to: '/compte-resultat', label: 'Compte de résultat', icon: BarChart3 },
  { to: '/sig', label: 'SIG', icon: TrendingUp },
  { to: '/comparaison', label: 'Comparaison', icon: GitCompare },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { selectCompany } = useCompanyStore();

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
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {/* Lien admin conditionnel */}
        {user?.role === 'admin' && (
          <>
            <div className="my-2 mx-3 h-px bg-gray-100" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
