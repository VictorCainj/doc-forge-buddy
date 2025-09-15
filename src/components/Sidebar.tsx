import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      active: location.pathname === '/',
    },
    {
      name: 'Contratos',
      icon: FileText,
      path: '/contratos',
      active: location.pathname === '/contratos',
    },
    {
      name: 'Configurações',
      icon: Settings,
      path: '/configuracoes',
      active: location.pathname === '/configuracoes',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4"></div>
    </aside>
  );
};

export default Sidebar;
