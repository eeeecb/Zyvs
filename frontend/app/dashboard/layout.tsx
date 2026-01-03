'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Zap,
  Columns3,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { name: 'Automações', href: '/dashboard/automacoes', icon: Zap },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: Columns3 },
  { name: 'Campanhas', href: '/dashboard/campanhas', icon: MessageSquare },
];

const settingsItem = {
  name: 'Configurações',
  href: '/dashboard/configuracoes',
  icon: Settings,
};

const adminItem = {
  name: 'Painel Admin',
  href: '/admin/dashboard',
  icon: Shield,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b-2 border-black">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <span className="text-[#00ff88] font-bold text-lg">T</span>
              </div>
              <div>
                <span className="text-lg font-bold text-black">
                  Thumdra
                </span>
              </div>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-black transition"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 font-medium transition-all ${
                    isActive
                      ? 'bg-[#00ff88] text-black border-l-4 border-black'
                      : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                  }`}
                >
                  <item.icon className="w-5 h-5" strokeWidth={2} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}

          {/* Separador */}
          <div className="my-4 border-t-2 border-gray-200"></div>

          {/* Configurações */}
          <Link href={settingsItem.href}>
            <div
              className={`flex items-center gap-3 px-4 py-3 font-medium transition-all ${
                pathname.startsWith(settingsItem.href)
                  ? 'bg-[#00ff88] text-black border-l-4 border-black'
                  : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
              }`}
            >
              <settingsItem.icon className="w-5 h-5" strokeWidth={2} />
              <span>{settingsItem.name}</span>
            </div>
          </Link>
        </nav>

        {/* User info and admin/logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-black bg-white">
          <div className="mb-4 px-2">
            <p className="text-sm font-bold text-black truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block px-2 py-1 text-xs font-bold bg-black text-white">
                {user.role === 'ADMIN' ? 'Admin' : 'Loja'}
              </span>
              <span className="inline-block px-2 py-1 text-xs font-bold bg-[#00ff88] text-black">
                {user.plan || 'FREE'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Botão Admin */}
            {user.role === 'ADMIN' && (
              <Link href={adminItem.href}>
                <button className="w-full px-4 py-2.5 text-sm bg-black text-[#00ff88] hover:bg-gray-900 transition flex items-center gap-2 font-bold justify-center">
                  <Shield className="w-4 h-4" strokeWidth={2} />
                  {adminItem.name}
                </button>
              </Link>
            )}

            <button
              onClick={logout}
              className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2 font-medium justify-center"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 h-16 bg-white border-b-2 border-black flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-black transition"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>

          <div className="flex-1 lg:flex-none">
            <h1 className="text-lg font-bold text-black">
              {navigation.find((item) => pathname === item.href)?.name ||
                'Dashboard'}
            </h1>
          </div>

          {/* User avatar (mobile) */}
          <div className="lg:hidden">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <span className="text-[#00ff88] font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
