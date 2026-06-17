import { useState } from 'react';
import {
  Leaf,
  Wind,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  Flame,
  FileText,
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
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store';
import { statusLabels, formatTime, furnaces } from '@/data/mockData';
import { format, subDays, subHours } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Environment() {
  const { environmentData, dashboardStats } = useAppStore();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedFurnace, setSelectedFurnace] = useState<string>('all');

  const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
  const startTime = subHours(new Date(), hours);

  const filteredData = environmentData.filter((e) => {
    const matchTime = new Date(e.timestamp) > startTime;
    const matchFurnace = selectedFurnace === 'all' || e.furnaceId === selectedFurnace;
    return matchTime && matchFurnace;
  });

  const complianceStats = {
    total: filteredData.length,
    compliant: filteredData.filter((e) => e.complianceStatus === 'compliant').length,
    warning: filteredData.filter((e) => e.complianceStatus === 'warning').length,
    nonCompliant: filteredData.filter((e) => e.complianceStatus === 'non_compliant').length,
    rate: filteredData.length > 0
      ? Math.round((filteredData.filter((e) => e.complianceStatus === 'compliant').length / filteredData.length) * 100)
      : 0,
  };

  const chartData = Array.from({ length: timeRange === '24h' ? 24 : 7 }, (_, i) => {
    const date = timeRange === '24h'
      ? subHours(new Date(), 23 - i)
      : subDays(new Date(), 6 - i);
    
    const periodData = filteredData.filter((e) => {
      const eDate = new Date(e.timestamp);
      if (timeRange === '24h') {
        return eDate.getHours() === date.getHours() && eDate.toDateString() === date.toDateString();
      }
      return eDate.toDateString() === date.toDateString();
    });

    const avg = (key: keyof typeof periodData[0]) => {
      if (periodData.length === 0) return 0;
      const sum = periodData.reduce((s, d) => s + (d[key] as number), 0);
      return Math.round((sum / periodData.length) * 10) / 10;
    };

    return {
      time: timeRange === '24h'
        ? `${date.getHours().toString().padStart(2, '0')}:00`
        : format(date, 'MM-dd'),
      烟气浓度: avg('smokeDensity'),
      二氧化硫: avg('sulfurDioxide'),
      氮氧化物: avg('nitrogenOxide'),
      颗粒物: avg('particulateMatter'),
    };
  });

  const latestData = filteredData[filteredData.length - 1];

  const standards = {
    smokeDensity: { name: '烟气浓度', limit: 50, unit: 'mg/m³' },
    sulfurDioxide: { name: '二氧化硫', limit: 200, unit: 'mg/m³' },
    nitrogenOxide: { name: '氮氧化物', limit: 250, unit: 'mg/m³' },
    particulateMatter: { name: '颗粒物', limit: 40, unit: 'mg/m³' },
  };

  const recentAlerts = filteredData
    .filter((e) => e.complianceStatus !== 'compliant')
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">环保监测</h1>
          <p className="text-industrial-500 mt-1">烟气排放监测与环保达标记录</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-industrial-100 rounded-lg p-1">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-industrial-600 hover:text-industrial-900'
                }`}
              >
                {range === '24h' ? '24小时' : range === '7d' ? '7天' : '30天'}
              </button>
            ))}
          </div>
          <select
            value={selectedFurnace}
            onChange={(e) => setSelectedFurnace(e.target.value)}
            className="input-field w-40"
          >
            <option value="all">全部设备</option>
            {furnaces.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="stat-icon bg-green-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-industrial-500">达标率</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.complianceRate}%</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-industrial-500">监测次数</div>
              <div className="text-lg font-semibold text-industrial-700">{complianceStats.total}</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-green-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-industrial-500">达标</p>
              <p className="text-2xl font-bold text-green-600">{complianceStats.compliant}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-yellow-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-industrial-500">预警</p>
              <p className="text-2xl font-bold text-yellow-600">{complianceStats.warning}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-industrial-500">超标</p>
              <p className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-industrial-900 mb-4">排放趋势</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="smokeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="so2Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="noxGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
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
                  <Area type="monotone" dataKey="烟气浓度" stroke="#3B82F6" fill="url(#smokeGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="二氧化硫" stroke="#F59E0B" fill="url(#so2Gradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="氮氧化物" stroke="#10B981" fill="url(#noxGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="颗粒物" stroke="#EF4444" fill="url(#pmGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(standards).map(([key, standard]) => {
              const value = latestData ? (latestData[key as keyof typeof latestData] as number) : 0;
              const isWarning = value > standard.limit * 0.8;
              const isDanger = value > standard.limit;
              return (
                <div key={key} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-industrial-900">{standard.name}</h3>
                    <span className={`badge ${
                      isDanger ? 'bg-red-100 text-red-700' :
                      isWarning ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {isDanger ? '超标' : isWarning ? '接近限值' : '正常'}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold text-industrial-900">{value}</span>
                    <span className="text-sm text-industrial-500 mb-1">{standard.unit}</span>
                    <span className="ml-auto text-sm text-industrial-400">
                      限值: {standard.limit}{standard.unit}
                    </span>
                  </div>
                  <div className="h-3 bg-industrial-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (value / standard.limit) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-industrial-900 mb-4">实时数据</h3>
            {latestData && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">烟气浓度</span>
                    </div>
                    <span className="font-bold text-blue-700">{latestData.smokeDensity} mg/m³</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">二氧化硫</span>
                    </div>
                    <span className="font-bold text-amber-700">{latestData.sulfurDioxide} mg/m³</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">氮氧化物</span>
                    </div>
                    <span className="font-bold text-green-700">{latestData.nitrogenOxide} mg/m³</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">颗粒物</span>
                    </div>
                    <span className="font-bold text-red-700">{latestData.particulateMatter} mg/m³</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-industrial-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-industrial-500">状态</span>
                    <span className={`badge ${statusLabels[latestData.complianceStatus].className}`}>
                      {statusLabels[latestData.complianceStatus].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-industrial-500">监测时间</span>
                    <span className="text-industrial-700">{formatTime(latestData.timestamp)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-industrial-900">告警记录</h3>
              {recentAlerts.length > 0 && (
                <span className="badge bg-red-100 text-red-700">{recentAlerts.length}</span>
              )}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                  <p className="text-green-600 text-sm">暂无告警记录</p>
                </div>
              ) : (
                recentAlerts.map((alert, index) => {
                  const furnace = furnaces.find((f) => f.id === alert.furnaceId);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.complianceStatus === 'non_compliant'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            alert.complianceStatus === 'non_compliant' ? 'text-red-500' : 'text-yellow-500'
                          }`}
                        />
                        <span className="font-medium text-sm text-industrial-800">
                          {furnace?.name}
                        </span>
                        <span className="ml-auto text-xs text-industrial-500">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-industrial-600">
                        {alert.smokeDensity > 50 && `烟气浓度超标(${alert.smokeDensity}mg/m³) `}
                        {alert.sulfurDioxide > 200 && `SO₂超标(${alert.sulfurDioxide}mg/m³) `}
                        {alert.nitrogenOxide > 250 && `NOx超标(${alert.nitrogenOxide}mg/m³) `}
                        {alert.particulateMatter > 40 && `颗粒物超标(${alert.particulateMatter}mg/m³)`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-industrial-900 mb-4">设备监测状态</h3>
            <div className="space-y-3">
              {furnaces.filter((f) => f.id !== 'f5').map((furnace) => {
                const furnaceData = filteredData.filter((e) => e.furnaceId === furnace.id);
                const furnaceCompliant = furnaceData.filter((e) => e.complianceStatus === 'compliant').length;
                const rate = furnaceData.length > 0
                  ? Math.round((furnaceCompliant / furnaceData.length) * 100)
                  : 0;
                return (
                  <div key={furnace.id} className="p-3 rounded-lg bg-industrial-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm text-industrial-800">{furnace.name}</span>
                      </div>
                      <span className={`badge ${
                        rate >= 95 ? 'bg-green-100 text-green-700' :
                        rate >= 80 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {rate}% 达标
                      </span>
                    </div>
                    <div className="h-2 bg-industrial-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rate >= 95 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-industrial-900 mb-4">环保达标记录</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-industrial-50">
                <th className="table-header">时间</th>
                <th className="table-header">设备</th>
                <th className="table-header">烟气浓度(mg/m³)</th>
                <th className="table-header">二氧化硫(mg/m³)</th>
                <th className="table-header">氮氧化物(mg/m³)</th>
                <th className="table-header">颗粒物(mg/m³)</th>
                <th className="table-header">状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(-20).reverse().map((record) => {
                const furnace = furnaces.find((f) => f.id === record.furnaceId);
                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-industrial-50 transition-colors border-b border-industrial-100 ${
                      record.complianceStatus === 'non_compliant' ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="table-cell text-sm text-industrial-600">
                      {formatTime(record.timestamp)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{furnace?.name}</span>
                      </div>
                    </td>
                    <td className={`table-cell font-mono ${
                      record.smokeDensity > 50 ? 'text-red-600 font-medium' : ''
                    }`}>
                      {record.smokeDensity}
                    </td>
                    <td className={`table-cell font-mono ${
                      record.sulfurDioxide > 200 ? 'text-red-600 font-medium' : ''
                    }`}>
                      {record.sulfurDioxide}
                    </td>
                    <td className={`table-cell font-mono ${
                      record.nitrogenOxide > 250 ? 'text-red-600 font-medium' : ''
                    }`}>
                      {record.nitrogenOxide}
                    </td>
                    <td className={`table-cell font-mono ${
                      record.particulateMatter > 40 ? 'text-red-600 font-medium' : ''
                    }`}>
                      {record.particulateMatter}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[record.complianceStatus].className}`}>
                        {statusLabels[record.complianceStatus].label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
