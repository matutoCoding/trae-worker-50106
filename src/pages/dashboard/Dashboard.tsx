import {
  Flame,
  Thermometer,
  Zap,
  Fuel,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useAppStore } from '@/store';
import { statusLabels, formatTime, formatDuration, employees, furnaces } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
  const { dashboardStats, schedules, maintenanceOrders, monitorData, getSchedulesByDate } = useAppStore();

  const todaySchedules = getSchedulesByDate(new Date()).sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );

  const furnaceStatusData = [
    { name: '运行中', value: dashboardStats.furnacesRunning, color: '#10B981' },
    { name: '空闲', value: dashboardStats.furnacesIdle, color: '#6B7280' },
    { name: '维护中', value: dashboardStats.furnacesMaintenance, color: '#3B82F6' },
    { name: '故障', value: dashboardStats.furnacesFault, color: '#EF4444' },
  ];

  const last7DaysEnergy = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySchedules = schedules.filter(
      (s) => s.scheduledTime.split('T')[0] === dateStr && s.status === 'completed'
    );
    return {
      date: format(date, 'MM-dd'),
      火化量: daySchedules.length,
      平均时长: daySchedules.length > 0
        ? Math.round(daySchedules.reduce((sum, s) => sum + (s.actualDuration || s.estimatedDuration), 0) / daySchedules.length)
        : 0,
    };
  });

  const tempChartData = monitorData
    .filter((m) => m.furnaceId === 'f1')
    .slice(-30)
    .map((m) => ({
      time: formatTime(m.timestamp),
      温度: Math.round(m.temperature),
      压力: Math.round(m.pressure * 10) / 10,
    }));

  const pendingOrders = maintenanceOrders.filter(
    (m) => m.status === 'pending' || m.status === 'in_progress'
  );

  const activeSchedules = todaySchedules.filter(
    (s) => s.status === 'cremating' || s.status === 'preheating'
  );

  const statCards = [
    {
      title: '今日火化',
      value: dashboardStats.todayCremations,
      unit: '具',
      icon: Flame,
      color: 'bg-orange-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '进行中',
      value: dashboardStats.inProgressCount,
      unit: '具',
      icon: Activity,
      color: 'bg-blue-500',
      subText: `${dashboardStats.pendingCount} 待开始`,
    },
    {
      title: '已完成',
      value: dashboardStats.completedCount,
      unit: '具',
      icon: CheckCircle,
      color: 'bg-green-500',
      subText: `平均 ${formatDuration(dashboardStats.avgDurationToday)}`,
    },
    {
      title: '燃料消耗',
      value: dashboardStats.totalFuelToday,
      unit: 'kg',
      icon: Fuel,
      color: 'bg-amber-600',
      trend: '-5%',
      trendUp: false,
    },
    {
      title: '电力消耗',
      value: dashboardStats.totalElectricityToday,
      unit: 'kWh',
      icon: Zap,
      color: 'bg-yellow-500',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: '运营成本',
      value: dashboardStats.totalCostToday,
      unit: '元',
      icon: TrendingUp,
      color: 'bg-red-500',
      subText: '今日累计',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">工作台</h1>
          <p className="text-industrial-500 mt-1">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-green-100 text-green-700">
            环保达标率 {dashboardStats.complianceRate}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-start justify-between">
              <div className={`stat-icon ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.trend}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-industrial-900">
                {stat.value}
                <span className="text-sm font-normal text-industrial-500 ml-1">{stat.unit}</span>
              </p>
              <p className="text-sm text-industrial-500 mt-1">{stat.title}</p>
              {stat.subText && (
                <p className="text-xs text-industrial-400 mt-1">{stat.subText}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-industrial-900">设备状态概览</h2>
              <Link to="/monitor" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                查看详情 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {furnaces.map((furnace) => (
                <div
                  key={furnace.id}
                  className="p-4 rounded-xl border border-industrial-200 hover:border-primary-300 transition-colors bg-industrial-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-industrial-800">{furnace.name}</span>
                    <span className={`badge ${statusLabels[furnace.status].className}`}>
                      {statusLabels[furnace.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <Thermometer className={`w-5 h-5 ${furnace.status === 'running' ? 'text-red-500 animate-temp-pulse' : 'text-industrial-400'}`} />
                    <span className={furnace.status === 'running' ? 'text-red-600' : 'text-industrial-600'}>
                      {furnace.currentTemperature}°C
                    </span>
                  </div>
                  <p className="text-xs text-industrial-500 mt-2">
                    累计运行 {furnace.runningHours.toLocaleString()} 小时
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-industrial-900">1号炉温度曲线</h2>
                <span className="badge bg-green-100 text-green-700">实时</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tempChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" domain={[0, 1200]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="温度"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-industrial-900">设备状态分布</h2>
              </div>
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={furnaceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {furnaceStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {furnaceStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-industrial-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-industrial-900">近7天火化趋势</h2>
              <Link to="/energy" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                能耗分析 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysEnergy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="火化量" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="平均时长" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-industrial-900">今日排程</h2>
              <Link to="/schedule" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                全部排程 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {todaySchedules.slice(0, 8).map((schedule) => {
                const operator = employees.find((e) => e.id === schedule.operatorId);
                const furnace = furnaces.find((f) => f.id === schedule.furnaceId);
                return (
                  <div
                    key={schedule.id}
                    className="p-3 rounded-lg border border-industrial-200 hover:bg-industrial-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-industrial-800">{schedule.deceasedName}</span>
                      <span className={`badge ${statusLabels[schedule.status].className}`}>
                        {statusLabels[schedule.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-industrial-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(schedule.scheduledTime)}
                      </div>
                      <div>{furnace?.name}</div>
                      <div>{operator?.name}</div>
                    </div>
                  </div>
                );
              })}
              {todaySchedules.length === 0 && (
                <div className="text-center py-8 text-industrial-400">
                  今日暂无排程
                </div>
              )}
            </div>
          </div>

          {activeSchedules.length > 0 && (
            <div className="card p-5 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-industrial-900">正在进行</h2>
                <span className="badge bg-orange-100 text-orange-700 animate-pulse">
                  {activeSchedules.length} 具火化中
                </span>
              </div>
              <div className="space-y-3">
                {activeSchedules.map((schedule) => {
                  const furnace = furnaces.find((f) => f.id === schedule.furnaceId);
                  return (
                    <div
                      key={schedule.id}
                      className="p-3 rounded-lg bg-orange-50 border border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-industrial-800">{schedule.deceasedName}</span>
                        <span className="text-orange-600 text-sm font-medium">
                          {furnace?.currentTemperature}°C
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-industrial-500">{furnace?.name}</span>
                        <span className="text-orange-600 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {schedule.status === 'preheating' ? '预热中' : '火化中'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pendingOrders.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-industrial-900">待处理维保</h2>
                <Link to="/maintenance" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {pendingOrders.map((order) => {
                  const furnace = furnaces.find((f) => f.id === order.furnaceId);
                  return (
                    <div
                      key={order.id}
                      className="p-3 rounded-lg border border-yellow-200 bg-yellow-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-industrial-800">{furnace?.name}</span>
                        <span className={`badge ${statusLabels[order.type].className} ml-auto`}>
                          {statusLabels[order.type].label}
                        </span>
                      </div>
                      <p className="text-sm text-industrial-600 line-clamp-2">{order.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-industrial-900 mb-4">待办提醒</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-industrial-800">骨灰待交接</p>
                  <p className="text-xs text-industrial-500">{dashboardStats.pendingHandover} 份待家属确认</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-industrial-800">环保监测</p>
                  <p className="text-xs text-industrial-500">24小时达标率 {dashboardStats.complianceRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
