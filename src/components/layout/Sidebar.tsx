import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Gauge,
  Zap,
  Wrench,
  HandHeart,
  Leaf,
  FileText,
  Settings,
  Flame,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/schedule', label: '火化排程', icon: CalendarDays },
  { path: '/monitor', label: '炉况监控', icon: Gauge },
  { path: '/energy', label: '能耗统计', icon: Zap },
  { path: '/maintenance', label: '设备维保', icon: Wrench },
  { path: '/handover', label: '骨灰交接', icon: HandHeart },
  { path: '/environment', label: '环保监测', icon: Leaf },
  { path: '/ledger', label: '运行台账', icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-primary-800 text-white flex flex-col h-full">
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold">火化炉管理系统</h1>
            <p className="text-xs text-primary-300">Cremation Furnace System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
          业务管理
        </div>
        <ul className="space-y-1">
          {navItems.slice(0, 4).map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
          运营管理
        </div>
        <ul className="space-y-1">
          {navItems.slice(4).map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-primary-700">
        <button className="sidebar-link w-full justify-center">
          <Settings className="w-5 h-5" />
          <span className="font-medium">系统设置</span>
        </button>
      </div>
    </aside>
  );
}
