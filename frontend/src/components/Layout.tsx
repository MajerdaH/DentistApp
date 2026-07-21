import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';

// Tooth Logo
const ToothLogo = () => (
  <img src="/tooth.svg" alt="Cabinet Dentaire" className="w-10 h-10" />
);

export default function Layout() {
  const { user, logout, isDentist } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Agenda', href: '/calendar', icon: Calendar },
    { name: 'Rendez-vous', href: '/appointments', icon: FileText },
    ...(isDentist ? [{ name: 'Paramètres', href: '/settings', icon: Settings }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <ToothLogo />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cabinet Dentaire</h1>
              <p className="text-xs text-gray-500">Gestion des patients</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-dental-100 flex items-center justify-center">
                <User className="w-5 h-5 text-dental-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'DENTIST' ? 'Dentiste' : 'Secrétaire'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-dental-500">
              <ToothLogo />
              <span className="font-bold">Cabinet Dentaire</span>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

