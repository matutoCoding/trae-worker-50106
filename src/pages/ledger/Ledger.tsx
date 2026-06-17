import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  Calendar,
  Flame,
  Users,
  Gauge,
  Wrench,
  Leaf,
  Archive,
  TrendingUp,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Thermometer,
  Droplets,
  Wind,
  Fuel,
  Zap,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppStore } from '@/store';
import { statusLabels, formatDateTime, formatDate, formatDuration, furnaces, employees } from '@/data/mockData';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { CremationSchedule, EnergyRecord, MaintenanceOrder, AshHandover, EnvironmentMonitor } from '@/types';

type LedgerTab = 'schedule' | 'energy' | 'maintenance' | 'handover' | 'environment';

export default function Ledger() {
  const { schedules, energyRecords, maintenanceOrders, sparePartUsages, ashHandovers, environmentData, getFullTraceBySchedule, getEnergyBySchedule } = useAppStore();
  const [activeTab, setActiveTab] = useState<LedgerTab>('schedule');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedFurnace, setSelectedFurnace] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStats, setShowStats] = useState(true);
  const [traceScheduleId, setTraceScheduleId] = useState<string | null>(null);

  const traceData = useMemo(() => {
    if (!traceScheduleId) return null;
    return getFullTraceBySchedule(traceScheduleId);
  }, [traceScheduleId, getFullTraceBySchedule]);

  const getDateRange = () => {
    const now = new Date();
    if (dateRange === '7d') return subDays(now, 7);
    if (dateRange === '30d') return subDays(now, 30);
    if (dateRange === '90d') return subDays(now, 90);
    return new Date('2020-01-01');
  };

  const startTime = getDateRange();

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchDate = new Date(s.scheduledTime) >= startTime;
      const matchFurnace = selectedFurnace === 'all' || s.furnaceId === selectedFurnace;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchSearch = s.deceasedName.includes(searchTerm) ||
        employees.find(e => e.id === s.operatorId)?.name.includes(searchTerm);
      return matchDate && matchFurnace && matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
  }, [schedules, startTime, selectedFurnace, statusFilter, searchTerm]);

  const filteredEnergy = useMemo(() => {
    return energyRecords.filter((e) => {
      const matchDate = new Date(e.recordDate) >= startOfDay(startTime);
      const matchFurnace = selectedFurnace === 'all' || e.furnaceId === selectedFurnace;
      return matchDate && matchFurnace;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  }, [energyRecords, startTime, selectedFurnace]);

  const filteredMaintenance = useMemo(() => {
    return maintenanceOrders.filter((m) => {
      const matchDate = new Date(m.reportTime) >= startTime;
      const matchFurnace = selectedFurnace === 'all' || m.furnaceId === selectedFurnace;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchDate && matchFurnace && matchStatus;
    }).sort((a, b) => new Date(b.reportTime).getTime() - new Date(a.reportTime).getTime());
  }, [maintenanceOrders, startTime, selectedFurnace, statusFilter]);

  const filteredHandover = useMemo(() => {
    return ashHandovers.filter((h) => {
      const schedule = schedules.find(s => s.id === h.scheduleId);
      if (!schedule) return false;
      const matchDate = new Date(schedule.scheduledTime) >= startTime;
      const matchFurnace = selectedFurnace === 'all' || schedule.furnaceId === selectedFurnace;
      const matchStatus = statusFilter === 'all' || h.confirmationStatus === statusFilter;
      const matchSearch = h.familyMember.includes(searchTerm) ||
        schedule.deceasedName.includes(searchTerm);
      return matchDate && matchFurnace && matchStatus && matchSearch;
    }).sort((a, b) => {
      const schedA = schedules.find(s => s.id === a.scheduleId);
      const schedB = schedules.find(s => s.id === b.scheduleId);
      return new Date(schedB?.scheduledTime || 0).getTime() - new Date(schedA?.scheduledTime || 0).getTime();
    });
  }, [ashHandovers, schedules, startTime, selectedFurnace, statusFilter, searchTerm]);

  const filteredEnvironment = useMemo(() => {
    return environmentData.filter((e) => {
      const matchDate = new Date(e.timestamp) >= startTime;
      const matchFurnace = selectedFurnace === 'all' || e.furnaceId === selectedFurnace;
      const matchStatus = statusFilter === 'all' || e.complianceStatus === statusFilter;
      return matchDate && matchFurnace && matchStatus;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [environmentData, startTime, selectedFurnace, statusFilter]);

  const summaryStats = useMemo(() => {
    const periodSchedules = schedules.filter(s => new Date(s.scheduledTime) >= startTime);
    const periodEnergy = energyRecords.filter(e => new Date(e.recordDate) >= startOfDay(startTime));
    const periodMaintenance = maintenanceOrders.filter(m => new Date(m.reportTime) >= startTime);
    const periodEnvironment = environmentData.filter(e => new Date(e.timestamp) >= startTime);

    return {
      totalCremations: periodSchedules.filter(s => s.status === 'completed').length,
      totalFuel: Math.round(periodEnergy.reduce((sum, e) => sum + e.fuelConsumption, 0)),
      totalElectricity: Math.round(periodEnergy.reduce((sum, e) => sum + e.electricityConsumption, 0)),
      totalCost: Math.round(periodEnergy.reduce((sum, e) => sum + e.cost, 0)),
      maintenanceCount: periodMaintenance.length,
      maintenanceCost: Math.round(periodMaintenance.filter(m => m.status === 'completed').reduce((sum, m) => sum + (m.cost || 0), 0)),
      complianceRate: periodEnvironment.length > 0
        ? Math.round((periodEnvironment.filter(e => e.complianceStatus === 'compliant').length / periodEnvironment.length) * 100)
        : 0,
      avgDuration: periodSchedules.filter(s => s.status === 'completed' && s.actualDuration).length > 0
        ? Math.round(periodSchedules.filter(s => s.status === 'completed' && s.actualDuration).reduce((sum, s) => sum + (s.actualDuration || 0), 0) /
          periodSchedules.filter(s => s.status === 'completed' && s.actualDuration).length)
        : 0,
    };
  }, [schedules, energyRecords, maintenanceOrders, environmentData, startTime]);

  const trendData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = subDays(new Date(), Math.min(days, 30) - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySchedules = schedules.filter(s =>
        format(new Date(s.scheduledTime), 'yyyy-MM-dd') === dateStr && s.status === 'completed'
      );
      const dayEnergy = energyRecords.filter(e => e.recordDate === dateStr);
      const dayEnv = environmentData.filter(e =>
        format(new Date(e.timestamp), 'yyyy-MM-dd') === dateStr
      );

      return {
        date: format(date, 'MM-dd'),
        火化量: daySchedules.length,
        燃料消耗: Math.round(dayEnergy.reduce((sum, e) => sum + e.fuelConsumption, 0)),
        电力消耗: Math.round(dayEnergy.reduce((sum, e) => sum + e.electricityConsumption, 0)),
        达标率: dayEnv.length > 0
          ? Math.round((dayEnv.filter(e => e.complianceStatus === 'compliant').length / dayEnv.length) * 100)
          : 0,
      };
    });
  }, [schedules, energyRecords, environmentData, dateRange]);

  const furnaceStats = useMemo(() => {
    return furnaces.map(furnace => {
      const furnaceSchedules = filteredSchedules.filter(s => s.furnaceId === furnace.id && s.status === 'completed');
      const furnaceEnergy = filteredEnergy.filter(e => e.furnaceId === furnace.id);
      return {
        name: furnace.name,
        火化量: furnaceSchedules.length,
        燃料消耗: Math.round(furnaceEnergy.reduce((sum, e) => sum + e.fuelConsumption, 0)),
        运行时长: furnaceSchedules.reduce((sum, s) => sum + (s.actualDuration || s.estimatedDuration), 0),
      };
    });
  }, [filteredSchedules, filteredEnergy]);

  const statusDistribution = useMemo(() => {
    if (activeTab === 'schedule') {
      const statuses = ['pending', 'preheating', 'cremating', 'completed'];
      return statuses.map(status => ({
        name: statusLabels[status].label,
        value: filteredSchedules.filter(s => s.status === status).length,
      }));
    }
    if (activeTab === 'maintenance') {
      const statuses = ['pending', 'in_progress', 'completed'];
      return statuses.map(status => ({
        name: statusLabels[status].label,
        value: filteredMaintenance.filter(m => m.status === status).length,
      }));
    }
    if (activeTab === 'environment') {
      const statuses = ['compliant', 'warning', 'non_compliant'];
      return statuses.map(status => ({
        name: statusLabels[status].label,
        value: filteredEnvironment.filter(e => e.complianceStatus === status).length,
      }));
    }
    return [];
  }, [activeTab, filteredSchedules, filteredMaintenance, filteredEnvironment]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getStatusOptions = () => {
    if (activeTab === 'schedule') {
      return [
        { value: 'all', label: '全部状态' },
        { value: 'pending', label: '待开始' },
        { value: 'preheating', label: '预热中' },
        { value: 'cremating', label: '火化中' },
        { value: 'completed', label: '已完成' },
      ];
    }
    if (activeTab === 'maintenance') {
      return [
        { value: 'all', label: '全部状态' },
        { value: 'pending', label: '待处理' },
        { value: 'in_progress', label: '处理中' },
        { value: 'completed', label: '已完成' },
      ];
    }
    if (activeTab === 'handover') {
      return [
        { value: 'all', label: '全部状态' },
        { value: 'pending', label: '待收殓' },
        { value: 'collected', label: '已收殓' },
        { value: 'handover', label: '待确认' },
        { value: 'confirmed', label: '已确认' },
      ];
    }
    if (activeTab === 'environment') {
      return [
        { value: 'all', label: '全部状态' },
        { value: 'compliant', label: '达标' },
        { value: 'warning', label: '预警' },
        { value: 'non_compliant', label: '超标' },
      ];
    }
    return [{ value: 'all', label: '全部状态' }];
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFurnace('all');
    setStatusFilter('all');
  };

  const exportData = () => {
    let data: any[] = [];
    let filename = '';

    if (activeTab === 'schedule') {
      data = filteredSchedules.map(s => ({
        排程编号: s.id,
        逝者姓名: s.deceasedName,
        预约时间: formatDateTime(s.scheduledTime),
        火化炉: furnaces.find(f => f.id === s.furnaceId)?.name,
        操作工: employees.find(e => e.id === s.operatorId)?.name,
        状态: statusLabels[s.status].label,
        预计时长: formatDuration(s.estimatedDuration),
        实际时长: s.actualDuration ? formatDuration(s.actualDuration) : '-',
        备注: s.remarks || '-',
      }));
      filename = `火化排程台账_${format(new Date(), 'yyyyMMdd')}.csv`;
    } else if (activeTab === 'energy') {
      data = filteredEnergy.map(e => ({
        记录日期: e.recordDate,
        火化炉: furnaces.find(f => f.id === e.furnaceId)?.name,
        燃料消耗: `${e.fuelConsumption.toFixed(1)}kg`,
        电力消耗: `${e.electricityConsumption.toFixed(1)}kWh`,
        运行时长: formatDuration(e.durationMinutes),
        费用: `¥${e.cost.toFixed(2)}`,
      }));
      filename = `能耗统计台账_${format(new Date(), 'yyyyMMdd')}.csv`;
    } else if (activeTab === 'maintenance') {
      data = filteredMaintenance.map(m => ({
        工单编号: m.id,
        火化炉: furnaces.find(f => f.id === m.furnaceId)?.name,
        类型: statusLabels[m.type].label,
        描述: m.description,
        报修人: employees.find(e => e.id === m.reporterId)?.name,
        报修时间: formatDateTime(m.reportTime),
        处理人: m.handlerId ? employees.find(e => e.id === m.handlerId)?.name : '-',
        处理时间: m.handleTime ? formatDateTime(m.handleTime) : '-',
        状态: statusLabels[m.status].label,
        费用: m.cost ? `¥${m.cost}` : '-',
      }));
      filename = `设备维保台账_${format(new Date(), 'yyyyMMdd')}.csv`;
    } else if (activeTab === 'handover') {
      data = filteredHandover.map(h => {
        const schedule = schedules.find(s => s.id === h.scheduleId);
        return {
          交接编号: h.id,
          逝者姓名: schedule?.deceasedName,
          家属: h.familyMember,
          收殓时间: h.collectTime ? formatDateTime(h.collectTime) : '-',
          收殓人: h.collector || '-',
          交接时间: h.handoverTime ? formatDateTime(h.handoverTime) : '-',
          交接人: h.handoverPerson || '-',
          状态: statusLabels[h.confirmationStatus].label,
          备注: h.remarks || '-',
        };
      });
      filename = `骨灰交接台账_${format(new Date(), 'yyyyMMdd')}.csv`;
    } else if (activeTab === 'environment') {
      data = filteredEnvironment.slice(0, 1000).map(e => ({
        记录时间: formatDateTime(e.timestamp),
        火化炉: furnaces.find(f => f.id === e.furnaceId)?.name,
        烟气浓度: `${e.smokeDensity}mg/m³`,
        二氧化硫: `${e.sulfurDioxide}mg/m³`,
        氮氧化物: `${e.nitrogenOxide}mg/m³`,
        颗粒物: `${e.particulateMatter}mg/m³`,
        状态: statusLabels[e.complianceStatus].label,
      }));
      filename = `环保监测台账_${format(new Date(), 'yyyyMMdd')}.csv`;
    }

    if (data.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const tabs = [
    { key: 'schedule' as const, label: '火化排程', icon: Calendar },
    { key: 'energy' as const, label: '能耗记录', icon: Gauge },
    { key: 'maintenance' as const, label: '设备维保', icon: Wrench },
    { key: 'handover' as const, label: '骨灰交接', icon: Users },
    { key: 'environment' as const, label: '环保监测', icon: Leaf },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'schedule': return filteredSchedules;
      case 'energy': return filteredEnergy;
      case 'maintenance': return filteredMaintenance;
      case 'handover': return filteredHandover;
      case 'environment': return filteredEnvironment;
      default: return [];
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">运行台账</h1>
          <p className="text-industrial-500 mt-1">综合查询、历史记录与数据统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={exportData}>
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-primary-500">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">火化总量</p>
                <p className="text-xl font-bold text-industrial-900">{summaryStats.totalCremations}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-orange-500">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">燃料消耗</p>
                <p className="text-xl font-bold text-industrial-900">{summaryStats.totalFuel}<span className="text-sm font-normal">kg</span></p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-blue-500">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">电力消耗</p>
                <p className="text-xl font-bold text-industrial-900">{summaryStats.totalElectricity}<span className="text-sm font-normal">kWh</span></p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-green-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">运行费用</p>
                <p className="text-xl font-bold text-industrial-900">¥{summaryStats.totalCost}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-purple-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">维保次数</p>
                <p className="text-xl font-bold text-industrial-900">{summaryStats.maintenanceCount}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-red-500">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">维保费用</p>
                <p className="text-xl font-bold text-industrial-900">¥{summaryStats.maintenanceCost}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-emerald-500">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">环保达标率</p>
                <p className="text-xl font-bold text-emerald-600">{summaryStats.complianceRate}%</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-amber-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-industrial-500">平均时长</p>
                <p className="text-xl font-bold text-industrial-900">{formatDuration(summaryStats.avgDuration)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-industrial-900">运行趋势分析</h3>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-sm text-industrial-500 hover:text-industrial-700 flex items-center gap-1"
            >
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showStats ? '收起' : '展开'}统计
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="火化量" stroke="#1E3A5F" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="燃料消耗" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="达标率" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-industrial-900 mb-4">状态分布</h3>
          {statusDistribution.length > 0 && statusDistribution.some(s => s.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter(s => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-industrial-400">
              暂无数据
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold text-industrial-900 mb-4">设备运行统计</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={furnaceStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="火化量" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="燃料消耗" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setStatusFilter('all');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-industrial-100 text-industrial-600 hover:bg-industrial-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-industrial-500">
            共 {currentData.length} 条记录
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
            <input
              type="text"
              placeholder="搜索姓名、操作工..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-industrial-400 hover:text-industrial-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="input-field w-32"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="all">全部</option>
          </select>

          <select
            value={selectedFurnace}
            onChange={(e) => setSelectedFurnace(e.target.value)}
            className="input-field w-36"
          >
            <option value="all">全部设备</option>
            {furnaces.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-32"
          >
            {getStatusOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>

          <button onClick={resetFilters} className="text-sm text-industrial-500 hover:text-industrial-700">
            重置
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'schedule' && (
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">排程编号</th>
                  <th className="table-header">逝者姓名</th>
                  <th className="table-header">预约时间</th>
                  <th className="table-header">火化炉</th>
                  <th className="table-header">操作工</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">预计时长</th>
                  <th className="table-header">实际时长</th>
                  <th className="table-header">备注</th>
                  <th className="table-header">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.slice(0, 50).map((s) => (
                  <tr key={s.id} className="hover:bg-industrial-50 transition-colors border-b border-industrial-100">
                    <td className="table-cell font-mono text-xs text-industrial-500">{s.id}</td>
                    <td className="table-cell font-medium">{s.deceasedName}</td>
                    <td className="table-cell text-sm text-industrial-600">{formatDateTime(s.scheduledTime)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {furnaces.find(f => f.id === s.furnaceId)?.name}
                      </div>
                    </td>
                    <td className="table-cell">{employees.find(e => e.id === s.operatorId)?.name}</td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[s.status].className}`}>
                        {statusLabels[s.status].label}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{formatDuration(s.estimatedDuration)}</td>
                    <td className="table-cell text-sm">{s.actualDuration ? formatDuration(s.actualDuration) : '-'}</td>
                    <td className="table-cell text-sm text-industrial-500">{s.remarks || '-'}</td>
                    <td className="table-cell">
                      <button onClick={() => setTraceScheduleId(s.id)} className="p-1 hover:bg-primary-100 text-primary-600 rounded" title="查看完整链路">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'energy' && (
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">记录日期</th>
                  <th className="table-header">火化炉</th>
                  <th className="table-header">燃料消耗(kg)</th>
                  <th className="table-header">电力消耗(kWh)</th>
                  <th className="table-header">运行时长</th>
                  <th className="table-header">费用(元)</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnergy.slice(0, 50).map((e) => (
                  <tr key={e.id} className="hover:bg-industrial-50 transition-colors border-b border-industrial-100">
                    <td className="table-cell text-sm text-industrial-600">{e.recordDate}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {furnaces.find(f => f.id === e.furnaceId)?.name}
                        {e.scheduleId && (
                          <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                            {schedules.find(s => s.id === e.scheduleId)?.deceasedName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell font-mono">{e.fuelConsumption.toFixed(1)}</td>
                    <td className="table-cell font-mono">{e.electricityConsumption.toFixed(1)}</td>
                    <td className="table-cell text-sm">{formatDuration(e.durationMinutes)}</td>
                    <td className="table-cell font-mono text-amber-600">¥{e.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'maintenance' && (
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">工单编号</th>
                  <th className="table-header">火化炉</th>
                  <th className="table-header">类型</th>
                  <th className="table-header">描述</th>
                  <th className="table-header">报修人</th>
                  <th className="table-header">报修时间</th>
                  <th className="table-header">处理人</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">费用</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaintenance.slice(0, 50).map((m) => (
                  <tr key={m.id} className="hover:bg-industrial-50 transition-colors border-b border-industrial-100">
                    <td className="table-cell font-mono text-xs text-industrial-500">{m.id}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {furnaces.find(f => f.id === m.furnaceId)?.name}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[m.type].className}`}>
                        {statusLabels[m.type].label}
                      </span>
                    </td>
                    <td className="table-cell text-sm max-w-xs truncate">{m.description}</td>
                    <td className="table-cell">{employees.find(e => e.id === m.reporterId)?.name}</td>
                    <td className="table-cell text-sm text-industrial-600">{formatDateTime(m.reportTime)}</td>
                    <td className="table-cell">{m.handlerId ? employees.find(e => e.id === m.handlerId)?.name : '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[m.status].className}`}>
                        {statusLabels[m.status].label}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-amber-600">{m.cost ? `¥${m.cost}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'handover' && (
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">交接编号</th>
                  <th className="table-header">逝者姓名</th>
                  <th className="table-header">家属</th>
                  <th className="table-header">收殓时间</th>
                  <th className="table-header">收殓人</th>
                  <th className="table-header">交接时间</th>
                  <th className="table-header">交接人</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">备注</th>
                </tr>
              </thead>
              <tbody>
                {filteredHandover.slice(0, 50).map((h) => {
                  const schedule = schedules.find(s => s.id === h.scheduleId);
                  return (
                    <tr key={h.id} className="hover:bg-industrial-50 transition-colors border-b border-industrial-100">
                      <td className="table-cell font-mono text-xs text-industrial-500">{h.id}</td>
                      <td className="table-cell font-medium">{schedule?.deceasedName}</td>
                      <td className="table-cell">{h.familyMember}</td>
                      <td className="table-cell text-sm text-industrial-600">{h.collectTime ? formatDateTime(h.collectTime) : '-'}</td>
                      <td className="table-cell">{h.collector || '-'}</td>
                      <td className="table-cell text-sm text-industrial-600">{h.handoverTime ? formatDateTime(h.handoverTime) : '-'}</td>
                      <td className="table-cell">{h.handoverPerson || '-'}</td>
                      <td className="table-cell">
                        <span className={`badge ${statusLabels[h.confirmationStatus].className}`}>
                          {statusLabels[h.confirmationStatus].label}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-industrial-500">{h.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'environment' && (
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">记录时间</th>
                  <th className="table-header">火化炉</th>
                  <th className="table-header">烟气浓度</th>
                  <th className="table-header">二氧化硫</th>
                  <th className="table-header">氮氧化物</th>
                  <th className="table-header">颗粒物</th>
                  <th className="table-header">状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnvironment.slice(0, 50).map((e) => (
                  <tr
                    key={e.id}
                    className={`hover:bg-industrial-50 transition-colors border-b border-industrial-100 ${
                      e.complianceStatus === 'non_compliant' ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="table-cell text-sm text-industrial-600">{formatDateTime(e.timestamp)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {furnaces.find(f => f.id === e.furnaceId)?.name}
                      </div>
                    </td>
                    <td className={`table-cell font-mono ${e.smokeDensity > 50 ? 'text-red-600 font-medium' : ''}`}>
                      {e.smokeDensity}
                    </td>
                    <td className={`table-cell font-mono ${e.sulfurDioxide > 200 ? 'text-red-600 font-medium' : ''}`}>
                      {e.sulfurDioxide}
                    </td>
                    <td className={`table-cell font-mono ${e.nitrogenOxide > 250 ? 'text-red-600 font-medium' : ''}`}>
                      {e.nitrogenOxide}
                    </td>
                    <td className={`table-cell font-mono ${e.particulateMatter > 40 ? 'text-red-600 font-medium' : ''}`}>
                      {e.particulateMatter}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[e.complianceStatus].className}`}>
                        {statusLabels[e.complianceStatus].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {currentData.length === 0 && (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto text-industrial-300 mb-3" />
              <p className="text-industrial-500">暂无符合条件的记录</p>
            </div>
          )}
        </div>

        {currentData.length > 50 && (
          <div className="mt-4 text-center text-sm text-industrial-500">
            显示前50条记录，共{currentData.length}条。请使用筛选条件缩小范围或导出完整数据。
          </div>
        )}
      </div>

      {traceScheduleId && traceData && traceData.schedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTraceScheduleId(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-industrial-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-industrial-900">完整链路追踪</h2>
                  <p className="text-sm text-industrial-500">{traceData.schedule.deceasedName} - {furnaces.find(f => f.id === traceData.schedule.furnaceId)?.name}</p>
                </div>
              </div>
              <button onClick={() => setTraceScheduleId(null)} className="p-2 hover:bg-industrial-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-industrial-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-industrial-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base font-semibold text-industrial-900">排程信息</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">逝者姓名</p>
                    <p className="text-sm font-medium text-industrial-900">{traceData.schedule.deceasedName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">预约时间</p>
                    <p className="text-sm font-medium text-industrial-900">{formatDateTime(traceData.schedule.scheduledTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">火化炉</p>
                    <p className="text-sm font-medium text-industrial-900">{furnaces.find(f => f.id === traceData.schedule.furnaceId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">操作工</p>
                    <p className="text-sm font-medium text-industrial-900">{employees.find(e => e.id === traceData.schedule.operatorId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">状态</p>
                    <span className={`badge ${statusLabels[traceData.schedule.status].className}`}>
                      {statusLabels[traceData.schedule.status].label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">预计时长</p>
                    <p className="text-sm font-medium text-industrial-900">{formatDuration(traceData.schedule.estimatedDuration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">实际时长</p>
                    <p className="text-sm font-medium text-industrial-900">{traceData.schedule.actualDuration ? formatDuration(traceData.schedule.actualDuration) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">开始时间</p>
                    <p className="text-sm font-medium text-industrial-900">{traceData.schedule.startTime ? formatDateTime(traceData.schedule.startTime) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-industrial-500 mb-1">结束时间</p>
                    <p className="text-sm font-medium text-industrial-900">{traceData.schedule.endTime ? formatDateTime(traceData.schedule.endTime) : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-industrial-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="w-5 h-5 text-orange-500" />
                  <h3 className="text-base font-semibold text-industrial-900">炉况数据</h3>
                </div>
                {traceData.monitorData.length > 0 ? (
                  <div>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={traceData.monitorData.map((m, i) => ({
                          time: format(new Date(m.timestamp), 'HH:mm'),
                          温度: m.temperature,
                          压力: m.pressure,
                          含氧量: m.oxygenLevel,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="温度" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="压力" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="含氧量" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <Thermometer className="w-4 h-4 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-industrial-500">平均温度</p>
                        <p className="text-sm font-bold text-industrial-900">{Math.round(traceData.monitorData.reduce((s, m) => s + m.temperature, 0) / traceData.monitorData.length)}°C</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-industrial-500">平均压力</p>
                        <p className="text-sm font-bold text-industrial-900">{(traceData.monitorData.reduce((s, m) => s + m.pressure, 0) / traceData.monitorData.length).toFixed(1)} kPa</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <Wind className="w-4 h-4 text-green-500 mx-auto mb-1" />
                        <p className="text-xs text-industrial-500">平均含氧量</p>
                        <p className="text-sm font-bold text-industrial-900">{(traceData.monitorData.reduce((s, m) => s + m.oxygenLevel, 0) / traceData.monitorData.length).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-industrial-400">
                    <Thermometer className="w-5 h-5 mr-2" />
                    无炉况数据
                  </div>
                )}
              </div>

              <div className="bg-industrial-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Fuel className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-semibold text-industrial-900">能耗记录</h3>
                </div>
                {traceData.energyRecords.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white">
                        <th className="px-3 py-2 text-left text-xs font-medium text-industrial-500 rounded-tl-lg">日期</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-industrial-500">燃料(kg)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-industrial-500">电力(kWh)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-industrial-500">时长</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-industrial-500 rounded-tr-lg">费用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceData.energyRecords.map((e) => (
                        <tr key={e.id} className="border-t border-industrial-100">
                          <td className="px-3 py-2">{e.recordDate}</td>
                          <td className="px-3 py-2 font-mono">{e.fuelConsumption.toFixed(1)}</td>
                          <td className="px-3 py-2 font-mono">{e.electricityConsumption.toFixed(1)}</td>
                          <td className="px-3 py-2">{formatDuration(e.durationMinutes)}</td>
                          <td className="px-3 py-2 font-mono text-amber-600">¥{e.cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-industrial-200 font-medium">
                        <td className="px-3 py-2">合计</td>
                        <td className="px-3 py-2 font-mono">{traceData.energyRecords.reduce((s, e) => s + e.fuelConsumption, 0).toFixed(1)}</td>
                        <td className="px-3 py-2 font-mono">{traceData.energyRecords.reduce((s, e) => s + e.electricityConsumption, 0).toFixed(1)}</td>
                        <td className="px-3 py-2">{formatDuration(traceData.energyRecords.reduce((s, e) => s + e.durationMinutes, 0))}</td>
                        <td className="px-3 py-2 font-mono text-amber-600">¥{traceData.energyRecords.reduce((s, e) => s + e.cost, 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="flex items-center justify-center py-8 text-industrial-400">
                    <Zap className="w-5 h-5 mr-2" />
                    无能耗记录
                  </div>
                )}
              </div>

              <div className="bg-industrial-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-purple-500" />
                  <h3 className="text-base font-semibold text-industrial-900">骨灰交接</h3>
                </div>
                {traceData.ashHandover ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-industrial-500 mb-1">家属</p>
                      <p className="text-sm font-medium text-industrial-900">{traceData.ashHandover.familyMember}</p>
                    </div>
                    <div>
                      <p className="text-xs text-industrial-500 mb-1">确认状态</p>
                      <span className={`badge ${statusLabels[traceData.ashHandover.confirmationStatus].className}`}>
                        {statusLabels[traceData.ashHandover.confirmationStatus].label}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-industrial-500 mb-1">收殓时间</p>
                      <p className="text-sm font-medium text-industrial-900">{traceData.ashHandover.collectTime ? formatDateTime(traceData.ashHandover.collectTime) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-industrial-500 mb-1">交接时间</p>
                      <p className="text-sm font-medium text-industrial-900">{traceData.ashHandover.handoverTime ? formatDateTime(traceData.ashHandover.handoverTime) : '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-industrial-400">
                    <Package className="w-5 h-5 mr-2" />
                    无交接记录
                  </div>
                )}
              </div>

              <div className="bg-industrial-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-semibold text-industrial-900">环保监测</h3>
                </div>
                {traceData.environmentData.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        达标 {traceData.environmentData.filter(e => e.complianceStatus === 'compliant').length} 条
                      </div>
                      <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        超标/预警 {traceData.environmentData.filter(e => e.complianceStatus !== 'compliant').length} 条
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-industrial-500 mb-1">平均烟气浓度</p>
                        <p className="text-sm font-bold text-industrial-900">{(traceData.environmentData.reduce((s, e) => s + e.smokeDensity, 0) / traceData.environmentData.length).toFixed(1)} mg/m³</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-industrial-500 mb-1">平均SO₂</p>
                        <p className="text-sm font-bold text-industrial-900">{(traceData.environmentData.reduce((s, e) => s + e.sulfurDioxide, 0) / traceData.environmentData.length).toFixed(1)} mg/m³</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-industrial-500 mb-1">平均NOx</p>
                        <p className="text-sm font-bold text-industrial-900">{(traceData.environmentData.reduce((s, e) => s + e.nitrogenOxide, 0) / traceData.environmentData.length).toFixed(1)} mg/m³</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-industrial-500 mb-1">平均PM</p>
                        <p className="text-sm font-bold text-industrial-900">{(traceData.environmentData.reduce((s, e) => s + e.particulateMatter, 0) / traceData.environmentData.length).toFixed(1)} mg/m³</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-industrial-400">
                    <Leaf className="w-5 h-5 mr-2" />
                    无环保数据
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
