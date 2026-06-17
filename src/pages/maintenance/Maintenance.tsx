import { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Package,
  FileText,
  ChevronDown,
  Edit2,
  Download,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { statusLabels, formatDateTime, employees, furnaces, employeeRoleLabels } from '@/data/mockData';
import type { MaintenanceStatus, MaintenanceType } from '@/types';

export default function Maintenance() {
  const { maintenanceOrders, sparePartUsages, furnaces } = useAppStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'spareparts'>('orders');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all');

  const filteredOrders = maintenanceOrders.filter(
    (o) => filterStatus === 'all' || o.status === filterStatus
  );

  const stats = {
    total: maintenanceOrders.length,
    pending: maintenanceOrders.filter((o) => o.status === 'pending').length,
    inProgress: maintenanceOrders.filter((o) => o.status === 'in_progress').length,
    completed: maintenanceOrders.filter((o) => o.status === 'completed').length,
  };

  const statusFilterOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">设备维保</h1>
          <p className="text-industrial-500 mt-1">设备维护保养、故障报修与备件管理</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出记录
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增工单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-blue-500">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-industrial-900">{stats.total}</p>
              <p className="text-sm text-industrial-500">总工单数</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-yellow-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-industrial-500">待处理</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-orange-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              <p className="text-sm text-industrial-500">处理中</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-green-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-industrial-500">已完成</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-industrial-100">
          <div className="flex bg-industrial-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-industrial-600 hover:text-industrial-900'
              }`}
            >
              维保工单
            </button>
            <button
              onClick={() => setActiveTab('spareparts')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'spareparts'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-industrial-600 hover:text-industrial-900'
              }`}
            >
              备件更换
            </button>
          </div>

          {activeTab === 'orders' && (
            <div className="flex items-center gap-2">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value as MaintenanceStatus | 'all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filterStatus === option.value
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-industrial-500 hover:bg-industrial-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">工单编号</th>
                  <th className="table-header">设备</th>
                  <th className="table-header">类型</th>
                  <th className="table-header">问题描述</th>
                  <th className="table-header">报修人</th>
                  <th className="table-header">报修时间</th>
                  <th className="table-header">处理人</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">费用</th>
                  <th className="table-header">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const furnace = furnaces.find((f) => f.id === order.furnaceId);
                  const reporter = employees.find((e) => e.id === order.reporterId);
                  const handler = order.handlerId ? employees.find((e) => e.id === order.handlerId) : null;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-industrial-50 transition-colors border-b border-industrial-100"
                    >
                      <td className="table-cell font-mono text-sm font-medium">
                        {order.id.toUpperCase()}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{furnace?.name}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${statusLabels[order.type].className}`}>
                          {statusLabels[order.type].label}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="max-w-xs truncate" title={order.description}>
                          {order.description}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <span className="text-sm">{reporter?.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-industrial-600">
                        {formatDateTime(order.reportTime)}
                      </td>
                      <td className="table-cell">
                        {handler ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-sm">{handler?.name}</span>
                          </div>
                        ) : (
                          <span className="text-industrial-400 text-sm">待指派</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${statusLabels[order.status].className}`}>
                          {statusLabels[order.status].label}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-red-600">
                        {order.cost ? `¥${order.cost.toLocaleString()}` : '-'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {order.status === 'pending' && (
                            <button
                              className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                              title="开始处理"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-1.5 hover:bg-primary-100 text-primary-600 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-industrial-50">
                  <th className="table-header">更换日期</th>
                  <th className="table-header">设备</th>
                  <th className="table-header">关联工单</th>
                  <th className="table-header">备件名称</th>
                  <th className="table-header">规格型号</th>
                  <th className="table-header">数量</th>
                  <th className="table-header">操作人员</th>
                </tr>
              </thead>
              <tbody>
                {sparePartUsages.map((usage) => {
                  const furnace = furnaces.find((f) => f.id === usage.furnaceId);
                  return (
                    <tr
                      key={usage.id}
                      className="hover:bg-industrial-50 transition-colors border-b border-industrial-100"
                    >
                      <td className="table-cell text-sm text-industrial-600">{usage.replaceDate}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{furnace?.name}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-sm text-primary-600">
                        {usage.maintenanceId.toUpperCase()}
                      </td>
                      <td className="table-cell font-medium text-industrial-800">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-industrial-400" />
                          {usage.partName}
                        </div>
                      </td>
                      <td className="table-cell text-industrial-600">{usage.partModel}</td>
                      <td className="table-cell">
                        <span className="badge bg-blue-100 text-blue-700">{usage.quantity} 件</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <span className="text-sm">{usage.operator}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">设备档案</h2>
          <div className="space-y-4">
            {furnaces.map((furnace) => (
              <div
                key={furnace.id}
                className="p-4 rounded-xl border border-industrial-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-industrial-900 text-lg">{furnace.name}</span>
                      <span className={`badge ${statusLabels[furnace.status].className}`}>
                        {statusLabels[furnace.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-industrial-500 mt-1">
                      {furnace.model} · {furnace.manufacturer}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-industrial-900">
                      {furnace.runningHours.toLocaleString()}
                    </div>
                    <div className="text-xs text-industrial-500">累计运行小时</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-industrial-500">安装日期</div>
                    <div className="font-medium text-industrial-800">{furnace.installDate}</div>
                  </div>
                  <div>
                    <div className="text-industrial-500">最高温度</div>
                    <div className="font-medium text-industrial-800">{furnace.maxTemperature}°C</div>
                  </div>
                  <div>
                    <div className="text-industrial-500">上次维保</div>
                    <div className="font-medium text-industrial-800">{furnace.lastMaintenanceDate || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">维保计划</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">月度例行检查</span>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                每月1日对所有设备进行安全检查，包括温度传感器校准、炉膛密封性检测
              </p>
              <div className="text-xs text-blue-600">下次检查：2026-07-01</div>
            </div>

            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">季度保养</span>
              </div>
              <p className="text-sm text-green-700 mb-2">
                每季度末进行设备深度保养，更换易损件，清理烟道，检查燃烧器
              </p>
              <div className="text-xs text-green-600">下次保养：2026-06-30</div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">年度大修</span>
              </div>
              <p className="text-sm text-purple-700 mb-2">
                每年12月进行设备全面检修，更换耐火砖，检修电气系统，更换过滤器
              </p>
              <div className="text-xs text-purple-600">下次大修：2026-12-15</div>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">紧急维修</span>
              </div>
              <p className="text-sm text-red-700">
                5号炉燃烧器故障，需更换点火电极，已安排维修人员处理
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
