import { useState, useEffect } from 'react';
import {
  Gauge,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  AlertTriangle,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useAppStore } from '@/store';
import { statusLabels, formatTime, furnaces } from '@/data/mockData';
import type { Furnace } from '@/types';

export default function Monitor() {
  const { monitorData, getMonitorDataByFurnace } = useAppStore();
  const [selectedFurnace, setSelectedFurnace] = useState<string>('f1');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  const activeFurnaces = furnaces.filter((f) => f.status === 'running' || f.status === 'idle');
  const furnaceData = getMonitorDataByFurnace(selectedFurnace);

  const chartData = furnaceData.slice(-30).map((m) => ({
    time: formatTime(m.timestamp),
    温度: Math.round(m.temperature),
    压力: Math.round(m.pressure * 10) / 10,
    含氧量: Math.round(m.oxygenLevel * 10) / 10,
  }));

  const latestData = furnaceData[furnaceData.length - 1];

  const getTemperatureColor = (temp: number) => {
    if (temp >= 900) return 'text-red-600';
    if (temp >= 700) return 'text-orange-600';
    if (temp >= 400) return 'text-yellow-600';
    return 'text-industrial-600';
  };

  const getTemperatureBg = (temp: number) => {
    if (temp >= 900) return 'from-red-500 to-orange-500';
    if (temp >= 700) return 'from-orange-500 to-yellow-500';
    if (temp >= 400) return 'from-yellow-500 to-amber-500';
    return 'from-industrial-400 to-industrial-500';
  };

  const alarms = [
    { id: 1, furnace: '1号炉', type: '温度过高', message: '炉膛温度超过1000℃', time: '10:25', level: 'danger' },
    { id: 2, furnace: '2号炉', type: '压力异常', message: '炉内压力波动较大', time: '11:05', level: 'warning' },
    { id: 3, furnace: '5号炉', type: '设备故障', message: '燃烧器无法点火', time: '08:30', level: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">炉况监控</h1>
          <p className="text-industrial-500 mt-1">实时监控火化炉运行状态和参数</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-industrial-100 rounded-lg p-1">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-industrial-600 hover:text-industrial-900'
                }`}
              >
                {range === '1h' ? '1小时' : range === '6h' ? '6小时' : '24小时'}
              </button>
            ))}
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            大屏模式
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {furnaces.map((furnace) => (
          <button
            key={furnace.id}
            onClick={() => setSelectedFurnace(furnace.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedFurnace === furnace.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-industrial-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-industrial-800">{furnace.name}</span>
              <span className={`badge ${statusLabels[furnace.status].className}`}>
                {statusLabels[furnace.status].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer
                className={`w-5 h-5 ${
                  furnace.status === 'running' ? 'text-red-500 animate-temp-pulse' : 'text-industrial-400'
                }`}
              />
              <span
                className={`text-2xl font-bold ${getTemperatureColor(
                  furnace.currentTemperature || 0
                )}`}
              >
                {furnace.currentTemperature}°C
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-industrial-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getTemperatureBg(
                  furnace.currentTemperature || 0
                )} transition-all duration-500`}
                style={{ width: `${Math.min(100, ((furnace.currentTemperature || 0) / furnace.maxTemperature) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-industrial-500 mt-1">
              最高 {furnace.maxTemperature}°C
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-industrial-900">
                  {furnaces.find((f) => f.id === selectedFurnace)?.name} - 温度曲线
                </h2>
                <p className="text-sm text-industrial-500 mt-0.5">实时温度监控数据</p>
              </div>
              {latestData && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-industrial-500">当前温度</div>
                    <div className={`text-2xl font-bold ${getTemperatureColor(latestData.temperature)}`}>
                      {Math.round(latestData.temperature)}°C
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="温度"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="url(#tempGradient)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#EF4444' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-industrial-900 mb-4">压力变化</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" domain={[98, 106]} />
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
                      dataKey="压力"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {latestData && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-industrial-500">当前压力</span>
                  <span className="font-semibold text-blue-600">{latestData.pressure.toFixed(1)} kPa</span>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-semibold text-industrial-900 mb-4">含氧量变化</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" domain={[0, 15]} />
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
                      dataKey="含氧量"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {latestData && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-industrial-500">当前含氧量</span>
                  <span className="font-semibold text-green-600">{latestData.oxygenLevel.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-industrial-900 mb-4">运行参数</h3>
            {latestData && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Thermometer className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-xs text-industrial-500">炉膛温度</div>
                      <div className="text-xl font-bold text-red-600">
                        {Math.round(latestData.temperature)}°C
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                      style={{ width: `${(latestData.temperature / 1200) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wind className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-industrial-500">炉内压力</div>
                      <div className="text-xl font-bold text-blue-600">
                        {latestData.pressure.toFixed(1)} kPa
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-industrial-500">氧气含量</div>
                      <div className="text-xl font-bold text-green-600">
                        {latestData.oxygenLevel.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-industrial-500">运行状态</div>
                      <div className="text-xl font-bold text-purple-600">
                        {statusLabels[latestData.status].label}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-industrial-900">告警信息</h3>
              <span className="badge bg-red-100 text-red-700">{alarms.length} 条</span>
            </div>
            <div className="space-y-3">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`p-3 rounded-lg border ${
                    alarm.level === 'danger'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        alarm.level === 'danger' ? 'text-red-500' : 'text-yellow-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-industrial-800 text-sm">
                          {alarm.furnace} - {alarm.type}
                        </span>
                        <span className="text-xs text-industrial-500">{alarm.time}</span>
                      </div>
                      <p className="text-xs text-industrial-600 mt-0.5">{alarm.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
