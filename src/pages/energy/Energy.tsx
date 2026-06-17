import { useState } from 'react';
import {
  Zap,
  Fuel,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Download,
  Clock,
  Flame,
  X,
  Eye,
  User,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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
  Legend,
  ComposedChart,
  Area,
} from 'recharts';
import { useAppStore } from '@/store';
import { formatDate, formatDuration, formatDateTime, employees, statusLabels } from '@/data/mockData';
import { format, subDays, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Energy() {
  const { energyRecords, schedules, furnaces } = useAppStore();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const energySummary = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = energyRecords.filter((e) => e.recordDate === dateStr);
    const daySchedules = schedules.filter(
      (s) => s.scheduledTime.split('T')[0] === dateStr && s.status === 'completed'
    );

    return {
      date: format(date, period === '7d' ? 'MM-dd' : 'dd'),
      fullDate: format(date, 'MM月dd日', { locale: zhCN }),
      燃料消耗: Math.round(dayRecords.reduce((sum, e) => sum + e.fuelConsumption, 0) * 10) / 10,
      电力消耗: Math.round(dayRecords.reduce((sum, e) => sum + e.electricityConsumption, 0) * 10) / 10,
      运营成本: Math.round(dayRecords.reduce((sum, e) => sum + e.cost, 0)),
      火化量: daySchedules.length,
      平均时长: daySchedules.length > 0
        ? Math.round(daySchedules.reduce((sum, s) => sum + (s.actualDuration || s.estimatedDuration), 0) / daySchedules.length)
        : 0,
    };
  });

  const furnaceEnergy = furnaces.filter((f) => f.id !== 'f5').map((furnace) => {
    const furnaceRecords = energyRecords.filter((e) => e.furnaceId === furnace.id);
    const recentRecords = furnaceRecords.slice(-days);
    const totalFuel = recentRecords.reduce((sum, e) => sum + e.fuelConsumption, 0);
    const totalElectricity = recentRecords.reduce((sum, e) => sum + e.electricityConsumption, 0);
    const totalCost = recentRecords.reduce((sum, e) => sum + e.cost, 0);
    const totalDuration = recentRecords.reduce((sum, e) => sum + e.durationMinutes, 0);
    const furnaceSchedules = schedules.filter(
      (s) => s.furnaceId === furnace.id && s.status === 'completed'
    );
    const cremationsCount = furnaceSchedules.filter(
      (s) => new Date(s.endTime!) > subDays(new Date(), days)
    ).length;

    return {
      ...furnace,
      totalFuel: Math.round(totalFuel * 10) / 10,
      totalElectricity: Math.round(totalElectricity * 10) / 10,
      totalCost: Math.round(totalCost),
      totalDuration,
      cremationsCount,
      avgFuelPerCremation: cremationsCount > 0 ? Math.round((totalFuel / cremationsCount) * 10) / 10 : 0,
      avgCostPerCremation: cremationsCount > 0 ? Math.round(totalCost / cremationsCount) : 0,
    };
  });

  const totalFuel = energySummary.reduce((sum, d) => sum + d.燃料消耗, 0);
  const totalElectricity = energySummary.reduce((sum, d) => sum + d.电力消耗, 0);
  const totalCost = energySummary.reduce((sum, d) => sum + d.运营成本, 0);
  const totalCremations = energySummary.reduce((sum, d) => sum + d.火化量, 0);
  const avgFuelPerCremation = totalCremations > 0 ? Math.round((totalFuel / totalCremations) * 10) / 10 : 0;
  const avgCostPerCremation = totalCremations > 0 ? Math.round(totalCost / totalCremations) : 0;

  const energyStructure = [
    { name: '燃料费用', value: Math.round(totalFuel * 8), color: '#F59E0B' },
    { name: '电力费用', value: Math.round(totalElectricity * 1.2), color: '#3B82F6' },
  ];

  const perFurnaceComparison = furnaceEnergy.map((f) => ({
    name: f.name.replace('火化炉', ''),
    单炉能耗: f.avgFuelPerCremation,
    单炉成本: f.avgCostPerCremation,
  }));

  const statCards = [
    {
      title: '燃料消耗总量',
      value: Math.round(totalFuel * 10) / 10,
      unit: 'kg',
      icon: Fuel,
      color: 'bg-amber-500',
      trend: '-8.5%',
      trendUp: false,
    },
    {
      title: '电力消耗总量',
      value: Math.round(totalElectricity * 10) / 10,
      unit: 'kWh',
      icon: Zap,
      color: 'bg-yellow-500',
      trend: '-5.2%',
      trendUp: false,
    },
    {
      title: '运营总成本',
      value: Math.round(totalCost).toLocaleString(),
      unit: '元',
      icon: TrendingUp,
      color: 'bg-red-500',
      trend: '-6.8%',
      trendUp: false,
    },
    {
      title: '累计火化量',
      value: totalCremations,
      unit: '具',
      icon: Flame,
      color: 'bg-orange-500',
      subText: `平均 ${avgFuelPerCremation}kg/具`,
    },
    {
      title: '平均单炉成本',
      value: avgCostPerCremation,
      unit: '元/具',
      icon: BarChart3,
      color: 'bg-blue-500',
      trend: '-12元',
      trendUp: false,
    },
    {
      title: '平均运行时长',
      value: Math.round((totalCremations > 0 ? energySummary.reduce((sum, d) => sum + d.平均时长, 0) / totalCremations : 0) * 10) / 10,
      unit: '分钟',
      icon: Clock,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">能耗统计</h1>
          <p className="text-industrial-500 mt-1">燃料消耗记录与能耗分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-industrial-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  period === p
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-industrial-600 hover:text-industrial-900'
                }`}
              >
                {p === '7d' ? '近7天' : p === '30d' ? '近30天' : '近90天'}
              </button>
            ))}
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between">
              <div className={`stat-icon ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? 'text-red-600' : 'text-green-600'}`}>
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
            <h2 className="text-lg font-semibold text-industrial-900 mb-4">能耗趋势分析</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={energySummary}>
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
                  <Bar yAxisId="left" dataKey="燃料消耗" fill="#F59E0B" radius={[4, 4, 0, 0]} name="燃料(kg)" />
                  <Bar yAxisId="left" dataKey="电力消耗" fill="#3B82F6" radius={[4, 4, 0, 0]} name="电力(kWh)" />
                  <Line yAxisId="right" type="monotone" dataKey="运营成本" stroke="#EF4444" strokeWidth={2} dot={false} name="成本(元)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-industrial-900 mb-4">能耗结构占比</h3>
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={energyStructure}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {energyStructure.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-semibold text-industrial-900 mb-4">单炉能耗对比</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perFurnaceComparison}>
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
                    <Bar dataKey="单炉能耗" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="燃料(kg/具)" />
                    <Bar dataKey="单炉成本" fill="#6366F1" radius={[4, 4, 0, 0]} name="成本(元/具)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-industrial-900 mb-4">设备能耗排行</h3>
            <div className="space-y-4">
              {furnaceEnergy.sort((a, b) => b.totalCost - a.totalCost).map((furnace, index) => (
                <div key={furnace.id} className="p-4 rounded-xl bg-industrial-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-industrial-400' : 'bg-amber-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-industrial-800">{furnace.name}</div>
                        <div className="text-xs text-industrial-500">{furnace.model}</div>
                      </div>
                    </div>
                    <span className={`badge ${statusLabels[furnace.status].className}`}>
                      {statusLabels[furnace.status].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-industrial-500">燃料</div>
                      <div className="font-semibold text-amber-600">{furnace.totalFuel}kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-industrial-500">电力</div>
                      <div className="font-semibold text-blue-600">{furnace.totalElectricity}kWh</div>
                    </div>
                    <div>
                      <div className="text-xs text-industrial-500">成本</div>
                      <div className="font-semibold text-red-600">{furnace.totalCost}元</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-industrial-200 flex items-center justify-between text-sm">
                    <span className="text-industrial-500">火化 {furnace.cremationsCount} 具</span>
                    <span className="text-industrial-500">运行 {formatDuration(furnace.totalDuration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-industrial-900 mb-4">能耗明细记录</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {energyRecords.slice(-10).reverse().map((record) => {
                const furnace = furnaces.find((f) => f.id === record.furnaceId);
                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-lg border border-industrial-200 hover:bg-industrial-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRecordId(record.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-industrial-800 text-sm">{furnace?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-industrial-500">{record.recordDate}</span>
                        <button
                          className="p-1 hover:bg-industrial-200 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordId(record.id);
                          }}
                        >
                          <Eye className="w-4 h-4 text-industrial-400" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-industrial-500">燃料</span>
                        <div className="font-semibold text-amber-600">{record.fuelConsumption}kg</div>
                      </div>
                      <div>
                        <span className="text-industrial-500">电力</span>
                        <div className="font-semibold text-blue-600">{record.electricityConsumption}kWh</div>
                      </div>
                      <div>
                        <span className="text-industrial-500">时长</span>
                        <div className="font-semibold text-industrial-700">{formatDuration(record.durationMinutes)}</div>
                      </div>
                      <div>
                        <span className="text-industrial-500">费用</span>
                        <div className="font-semibold text-red-600">{Math.round(record.cost)}元</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {selectedRecordId && (() => {
        const record = energyRecords.find((r) => r.id === selectedRecordId);
        if (!record) return null;

        const furnace = furnaces.find((f) => f.id === record.furnaceId);
        const schedule = record.scheduleId ? schedules.find((s) => s.id === record.scheduleId) : null;
        const operator = schedule ? employees.find((e) => e.id === schedule.operatorId) : null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-in">
              <div className="flex items-center justify-between p-5 border-b border-industrial-100">
                <h3 className="text-lg font-semibold text-industrial-900">能耗记录详情</h3>
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="p-1 hover:bg-industrial-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-industrial-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {schedule ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-industrial-50 rounded-lg">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-xs text-industrial-500">逝者姓名</div>
                        <div className="font-semibold text-industrial-900">{schedule.deceasedName}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-industrial-400" />
                        <div className="flex-1">
                          <div className="text-xs text-industrial-500">排程时间</div>
                          <div className="text-sm font-medium text-industrial-800">
                            {formatDateTime(schedule.scheduledTime)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <div className="flex-1">
                          <div className="text-xs text-industrial-500">火化炉</div>
                          <div className="text-sm font-medium text-industrial-800">{furnace?.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-industrial-400" />
                        <div className="flex-1">
                          <div className="text-xs text-industrial-500">操作工</div>
                          <div className="text-sm font-medium text-industrial-800">{operator?.name}</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-industrial-50 rounded-lg text-center">
                    <div className="text-sm text-industrial-500">关联排程：无</div>
                  </div>
                )}

                <div className="border-t border-industrial-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-industrial-400" />
                      <span className="text-sm text-industrial-600">实际运行时长</span>
                    </div>
                    <span className="font-semibold text-industrial-800">
                      {formatDuration(record.durationMinutes)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-industrial-600">燃料消耗</span>
                    </div>
                    <span className="font-semibold text-amber-600">
                      {record.fuelConsumption} kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-industrial-600">电力消耗</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {record.electricityConsumption} kWh
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-industrial-100">
                    <span className="text-sm font-medium text-industrial-700">总费用</span>
                    <span className="text-xl font-bold text-red-600">
                      {Math.round(record.cost)} 元
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
