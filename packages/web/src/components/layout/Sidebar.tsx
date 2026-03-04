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
} from 'lucide-react';
import { FinloopLogo } from '@/components/FinloopLogo';

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
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2.5 mb-0.5">
          <FinloopLogo size={32} variant="gradient" />
          <h1 className="text-xl font-bold text-primary-600">Finloop</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Analyse financière</p>
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
      </nav>
    </aside>
  );
}
