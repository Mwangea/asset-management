import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, Box, QrCode, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { logout, user } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Box, label: 'Assets', path: '/admin/assets' },
    { icon: QrCode, label: 'QR Scanner', path: '/admin/scan' },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[280px] bg-white shadow-lg transform transition-all duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12  flex items-center justify-center  transform transition-all duration-300 hover:scale-105">
            <img
                  src="/KMA LOGO.png"
                  alt="Logo"
                  className="h-10 w-auto"
                />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">KMA ASSETS</span>
          </div>
          <button
            title="Close sidebar"
            className="lg:hidden text-white/80 hover:text-white transition-all duration-300 hover:rotate-90"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-md">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-md transform transition-transform hover:scale-105">
              <User className="w-8 h-8 text-[#1e3a8a]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">{user?.username || 'Administrator'}</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-4 px-5 py-4 text-gray-600 hover:text-[#1e3a8a] rounded-xl transition-all duration-300 group relative overflow-hidden hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 ${
                  location.pathname === item.path ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-[#1e3a8a]' : ''
                }`}
              >
                <div className="relative flex items-center space-x-4">
                  <item.icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-4 px-5 py-4 text-gray-600 hover:text-[#e47524] rounded-xl transition-all duration-300 w-full group relative overflow-hidden hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
          >
            <div className="relative flex items-center space-x-4">
              <LogOut className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              <span className="font-medium">Logout</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] sticky top-0 shadow-lg z-40">
          <div className="flex items-center justify-between px-6 h-full">
            <button
              title="Toggle sidebar"
              className="lg:hidden text-white/80 hover:text-white transition-all duration-300 hover:scale-110"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-8 h-8" />
            </button>
            
            <div className="ml-auto flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/80 to-gray-100/80 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=32&h=32&q=80"
                  alt="User avatar"
                  className="relative w-12 h-12 rounded-xl ring-2 ring-white/90 ring-offset-2 ring-offset-[#1e3a8a] transition-all duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 bg-gradient-to-b from-white to-blue-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;