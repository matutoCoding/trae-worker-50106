import { Bell, User, Clock, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDateTime } from '@/data/mockData';
import { useEffect, useState } from 'react';

export default function Header() {
  const { currentUser, dashboardStats } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-industrial-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-industrial-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{formatDateTime(currentTime)}</span>
        </div>
        
        {dashboardStats.furnacesFault > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>{dashboardStats.furnacesFault} 台设备故障</span>
          </div>
        )}
        
        {dashboardStats.pendingMaintenance > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>{dashboardStats.pendingMaintenance} 项维保待处理</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-industrial-500 hover:text-primary-600 hover:bg-industrial-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="h-8 w-px bg-industrial-200"></div>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-industrial-800">{currentUser.name}</p>
            <p className="text-xs text-industrial-500">
              {currentUser.role === 'director' ? '车间主任' : 
               currentUser.role === 'operator' ? '操作工' :
               currentUser.role === 'maintenance' ? '设备维护员' :
               currentUser.role === 'environmental' ? '环保管理员' : '系统管理员'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
