import { useState } from 'react';
import {
  HandHeart,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Search,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { statusLabels, formatDateTime, employees, furnaces } from '@/data/mockData';
import type { HandoverStatus } from '@/types';

export default function Handover() {
  const { ashHandovers, schedules, updateAshHandover } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<HandoverStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  const filteredHandovers = ashHandovers.filter((h) => {
    const schedule = schedules.find((s) => s.id === h.scheduleId);
    const matchStatus = filterStatus === 'all' || h.confirmationStatus === filterStatus;
    const matchSearch =
      !searchText ||
      h.familyMember.includes(searchText) ||
      (schedule?.deceasedName.includes(searchText) ?? false);
    return matchStatus && matchSearch;
  }).sort((a, b) => {
    const order = { pending: 0, collected: 1, handover: 2, confirmed: 3 };
    return order[a.confirmationStatus] - order[b.confirmationStatus];
  });

  const stats = {
    total: ashHandovers.length,
    pending: ashHandovers.filter((h) => h.confirmationStatus === 'pending').length,
    collected: ashHandovers.filter((h) => h.confirmationStatus === 'collected').length,
    handover: ashHandovers.filter((h) => h.confirmationStatus === 'handover').length,
    confirmed: ashHandovers.filter((h) => h.confirmationStatus === 'confirmed').length,
  };

  const handleStatusChange = (id: string, status: HandoverStatus) => {
    if (window.confirm('确认更新交接状态吗？')) {
      const updates: any = { confirmationStatus: status };
      if (status === 'collected') {
        updates.collectTime = new Date().toISOString();
        updates.collector = employees[1].name;
      }
      if (status === 'handover') {
        updates.handoverTime = new Date().toISOString();
        updates.handoverPerson = employees[1].name;
      }
      updateAshHandover(id, updates);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">骨灰交接</h1>
          <p className="text-industrial-500 mt-1">骨灰收殓、交接登记与家属确认</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出记录
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            打印交接单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-primary-500">
              <HandHeart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-industrial-900">{stats.total}</p>
              <p className="text-sm text-industrial-500">总记录</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-orange-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-sm text-industrial-500">待收殓</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-blue-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.collected}</p>
              <p className="text-sm text-industrial-500">已收殓</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-yellow-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.handover}</p>
              <p className="text-sm text-industrial-500">待确认</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-green-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              <p className="text-sm text-industrial-500">已完成</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'collected', 'handover', 'confirmed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-industrial-600 hover:bg-industrial-100'
                }`}
              >
                {status === 'all'
                  ? '全部'
                  : statusLabels[status].label}
                <span className="ml-1 text-xs opacity-70">
                  ({status === 'all' ? stats.total : stats[status as keyof typeof stats]})
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
            <input
              type="text"
              placeholder="搜索逝者姓名或家属..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-industrial-50">
                <th className="table-header">编号</th>
                <th className="table-header">逝者姓名</th>
                <th className="table-header">火化炉</th>
                <th className="table-header">火化完成</th>
                <th className="table-header">收殓时间</th>
                <th className="table-header">收殓人</th>
                <th className="table-header">家属</th>
                <th className="table-header">交接时间</th>
                <th className="table-header">交接人</th>
                <th className="table-header">状态</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredHandovers.map((handover, index) => {
                const schedule = schedules.find((s) => s.id === handover.scheduleId);
                const furnace = schedule ? furnaces.find((f) => f.id === schedule.furnaceId) : null;
                return (
                  <tr
                    key={handover.id}
                    className={`hover:bg-industrial-50 transition-colors border-b border-industrial-100 ${
                      handover.confirmationStatus === 'pending' ? 'bg-orange-50/50' : ''
                    }`}
                  >
                    <td className="table-cell font-mono text-sm">
                      HJ{String(index + 1).padStart(4, '0')}
                    </td>
                    <td className="table-cell font-medium text-industrial-800">
                      {schedule?.deceasedName || '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{furnace?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-industrial-600">
                      {schedule?.endTime ? formatDateTime(schedule.endTime) : '-'}
                    </td>
                    <td className="table-cell text-sm text-industrial-600">
                      {handover.collectTime ? formatDateTime(handover.collectTime) : '-'}
                    </td>
                    <td className="table-cell">
                      {handover.collector ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <span className="text-sm">{handover.collector}</span>
                        </div>
                      ) : (
                        <span className="text-industrial-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm font-medium text-industrial-800">
                        {handover.familyMember}
                      </div>
                      {handover.remarks && (
                        <div className="text-xs text-industrial-500 mt-0.5">{handover.remarks}</div>
                      )}
                    </td>
                    <td className="table-cell text-sm text-industrial-600">
                      {handover.handoverTime ? formatDateTime(handover.handoverTime) : '-'}
                    </td>
                    <td className="table-cell">
                      {handover.handoverPerson ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="text-sm">{handover.handoverPerson}</span>
                        </div>
                      ) : (
                        <span className="text-industrial-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusLabels[handover.confirmationStatus].className}`}>
                        {statusLabels[handover.confirmationStatus].label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {handover.confirmationStatus === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(handover.id, 'collected')}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            确认收殓
                          </button>
                        )}
                        {handover.confirmationStatus === 'collected' && (
                          <button
                            onClick={() => handleStatusChange(handover.id, 'handover')}
                            className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
                          >
                            通知交接
                          </button>
                        )}
                        {handover.confirmationStatus === 'handover' && (
                          <button
                            onClick={() => handleStatusChange(handover.id, 'confirmed')}
                            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                          >
                            家属确认
                          </button>
                        )}
                        <button
                          className="p-1.5 hover:bg-primary-100 text-primary-600 rounded transition-colors"
                          title="查看详情"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredHandovers.length === 0 && (
        <div className="card p-12 text-center">
          <HandHeart className="w-16 h-16 mx-auto text-industrial-300 mb-4" />
          <p className="text-industrial-500">暂无符合条件的交接记录</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">交接流程说明</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium text-industrial-800">火化完成</h3>
                <p className="text-sm text-industrial-600">火化流程结束后，系统自动创建待收殓记录</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-industrial-800">骨灰收殓</h3>
                <p className="text-sm text-industrial-600">操作工收殓骨灰，登记收殓时间和收殓人信息</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-industrial-800">通知交接</h3>
                <p className="text-sm text-industrial-600">通知家属前来领取骨灰，记录交接时间</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-medium text-industrial-800">家属确认</h3>
                <p className="text-sm text-industrial-600">家属确认无误后签字确认，完成交接流程</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">待处理提醒</h2>
          <div className="space-y-3">
            {stats.pending > 0 && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-orange-800">待收殓</span>
                  <span className="ml-auto badge bg-orange-100 text-orange-700">{stats.pending} 份</span>
                </div>
                <p className="text-sm text-orange-700">请及时收殓已完成火化的骨灰</p>
              </div>
            )}
            {stats.handover > 0 && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-800">待家属确认</span>
                  <span className="ml-auto badge bg-yellow-100 text-yellow-700">{stats.handover} 份</span>
                </div>
                <p className="text-sm text-yellow-700">请联系家属确认领取骨灰</p>
              </div>
            )}
            {stats.pending === 0 && stats.handover === 0 && (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-green-600 font-medium">所有交接已处理完成</p>
                <p className="text-sm text-green-500 mt-1">暂无待处理的交接记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
