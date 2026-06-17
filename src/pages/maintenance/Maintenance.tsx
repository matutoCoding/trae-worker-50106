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
  Edit2,
  Download,
  Flame,
  X,
  Save,
  Play,
  CheckSquare,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { statusLabels, formatDateTime, employees, employeeRoleLabels, formatDate } from '@/data/mockData';
import type { MaintenanceStatus, MaintenanceType, MaintenanceOrder, SparePartUsage } from '@/types';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SparePartFormItem {
  partName: string;
  partModel: string;
  quantity: number;
}

export default function Maintenance() {
  const {
    furnaces,
    maintenanceOrders,
    sparePartUsages,
    addMaintenanceOrder,
    updateMaintenanceStatus,
    updateMaintenanceOrder,
    addSparePartUsage,
    getSparePartsByMaintenance,
    currentUser,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'spareparts'>('orders');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [formError, setFormError] = useState('');

  const [orderForm, setOrderForm] = useState({
    furnaceId: 'f1',
    type: 'repair' as MaintenanceType,
    description: '',
  });

  const [completeForm, setCompleteForm] = useState({
    result: '',
    cost: 0,
    spareParts: [] as SparePartFormItem[],
  });

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

  const handleAddOrder = () => {
    setOrderForm({
      furnaceId: 'f1',
      type: 'repair',
      description: '',
    });
    setFormError('');
    setShowOrderModal(true);
  };

  const handleSubmitOrder = () => {
    setFormError('');

    if (!orderForm.furnaceId) {
      setFormError('请选择设备');
      return;
    }
    if (!orderForm.description.trim()) {
      setFormError('请填写问题描述');
      return;
    }

    addMaintenanceOrder({
      furnaceId: orderForm.furnaceId,
      type: orderForm.type,
      description: orderForm.description.trim(),
      reporterId: currentUser.id,
      reportTime: new Date().toISOString(),
      status: 'pending',
    });

    setShowOrderModal(false);
  };

  const handleStartProcess = (order: MaintenanceOrder) => {
    if (window.confirm('确认开始处理此工单？')) {
      updateMaintenanceStatus(order.id, 'in_progress');
    }
  };

  const handleOpenComplete = (order: MaintenanceOrder) => {
    setSelectedOrder(order);
    setCompleteForm({
      result: '',
      cost: 0,
      spareParts: [],
    });
    setFormError('');
    setShowCompleteModal(true);
  };

  const handleAddSparePart = () => {
    setCompleteForm({
      ...completeForm,
      spareParts: [...completeForm.spareParts, { partName: '', partModel: '', quantity: 1 }],
    });
  };

  const handleRemoveSparePart = (index: number) => {
    setCompleteForm({
      ...completeForm,
      spareParts: completeForm.spareParts.filter((_, i) => i !== index),
    });
  };

  const handleUpdateSparePart = (index: number, field: keyof SparePartFormItem, value: string | number) => {
    const newParts = [...completeForm.spareParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setCompleteForm({ ...completeForm, spareParts: newParts });
  };

  const handleSubmitComplete = () => {
    setFormError('');

    if (!completeForm.result.trim()) {
      setFormError('请填写处理结果');
      return;
    }

    if (completeForm.cost < 0) {
      setFormError('费用不能为负数');
      return;
    }

    const invalidParts = completeForm.spareParts.filter(
      (p) => !p.partName.trim() || !p.partModel.trim() || p.quantity <= 0
    );
    if (invalidParts.length > 0) {
      setFormError('请填写完整的备件信息（名称、型号、数量）');
      return;
    }

    if (selectedOrder) {
      updateMaintenanceOrder(selectedOrder.id, {
        result: completeForm.result.trim(),
        cost: completeForm.cost,
        status: 'completed',
        handleTime: new Date().toISOString(),
        handlerId: currentUser.id,
      });

      completeForm.spareParts.forEach((part) => {
        addSparePartUsage({
          maintenanceId: selectedOrder.id,
          furnaceId: selectedOrder.furnaceId,
          partName: part.partName.trim(),
          partModel: part.partModel.trim(),
          quantity: part.quantity,
          replaceDate: format(new Date(), 'yyyy-MM-dd'),
          operator: currentUser.name,
        });
      });
    }

    setShowCompleteModal(false);
    setSelectedOrder(null);
  };

  const getOrderSpareParts = (orderId: string) => {
    return getSparePartsByMaintenance(orderId);
  };

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
          <button onClick={handleAddOrder} className="btn-primary flex items-center gap-2">
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-cell text-center py-12 text-industrial-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无工单记录</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const furnace = furnaces.find((f) => f.id === order.furnaceId);
                    const reporter = employees.find((e) => e.id === order.reporterId);
                    const handler = order.handlerId ? employees.find((e) => e.id === order.handlerId) : null;
                    const orderSpareParts = getOrderSpareParts(order.id);
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
                          {orderSpareParts.length > 0 && (
                            <div className="text-xs text-industrial-400 mt-1">
                              备件: {orderSpareParts.length}件
                            </div>
                          )}
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
                                onClick={() => handleStartProcess(order)}
                                className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                                title="开始处理"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'in_progress' && (
                              <button
                                onClick={() => handleOpenComplete(order)}
                                className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                                title="完成工单"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'completed' && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowCompleteModal(true);
                                }}
                                className="p-1.5 hover:bg-primary-100 text-primary-600 rounded transition-colors"
                                title="查看详情"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
                {sparePartUsages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-cell text-center py-12 text-industrial-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无备件更换记录</p>
                    </td>
                  </tr>
                ) : (
                  sparePartUsages.map((usage) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">设备档案</h2>
          <div className="space-y-4">
            {furnaces.map((furnace) => {
              const lastMaintenance = maintenanceOrders
                .filter((o) => o.furnaceId === furnace.id && o.status === 'completed' && o.handleTime)
                .sort((a, b) => new Date(b.handleTime!).getTime() - new Date(a.handleTime!).getTime())[0];

              const lastSpareParts = lastMaintenance
                ? getSparePartsByMaintenance(lastMaintenance.id)
                : [];

              const maintenanceInterval = lastMaintenance?.type === 'preventive' ? 90 : 30;
              const nextMaintenanceDate = furnace.lastMaintenanceDate
                ? format(addDays(new Date(furnace.lastMaintenanceDate), maintenanceInterval), 'yyyy-MM-dd')
                : null;

              const isOverdue = nextMaintenanceDate
                ? new Date(nextMaintenanceDate) < new Date()
                : false;

              return (
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

                  {lastMaintenance && (
                    <div className="mt-3 pt-3 border-t border-industrial-100 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-industrial-500">最近维保：</span>
                        <span className="font-medium text-industrial-800">{lastMaintenance.result}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-industrial-500">
                        <span>费用: ¥{lastMaintenance.cost?.toLocaleString() ?? 0}</span>
                        <span>完成时间: {formatDateTime(lastMaintenance.handleTime!)}</span>
                      </div>
                      {lastSpareParts.length > 0 && (
                        <div className="text-xs text-industrial-500 mt-1">
                          备件: {lastSpareParts.map((p) => `${p.partName} x${p.quantity}`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {nextMaintenanceDate && (
                    <div className={`mt-2 flex items-center gap-2 text-xs ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>下次维保提醒: {nextMaintenanceDate}</span>
                      {isOverdue && <span className="badge bg-red-100 text-red-700">已逾期</span>}
                    </div>
                  )}
                </div>
              );
            })}
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

            {stats.pending > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">待处理工单</span>
                </div>
                <p className="text-sm text-red-700">
                  当前有 {stats.pending} 条待处理工单，请及时安排维修人员处理
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-industrial-100">
              <h3 className="text-lg font-semibold text-industrial-900">新增维保工单</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1 hover:bg-industrial-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-industrial-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                  设备 <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderForm.furnaceId}
                  onChange={(e) => setOrderForm({ ...orderForm, furnaceId: e.target.value })}
                  className="input-field"
                >
                  {furnaces.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({statusLabels[f.status].label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                  工单类型 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'repair', label: '故障维修', icon: AlertTriangle, color: 'red' },
                    { value: 'preventive', label: '预防性保养', icon: Wrench, color: 'blue' },
                    { value: 'inspection', label: '检查', icon: FileText, color: 'purple' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setOrderForm({ ...orderForm, type: type.value as MaintenanceType })}
                      className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                        orderForm.type === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-industrial-200 hover:border-industrial-300'
                      }`}
                      style={{
                        borderColor: orderForm.type === type.value 
                          ? type.color === 'red' ? '#ef4444' : type.color === 'blue' ? '#3b82f6' : '#8b5cf6'
                          : undefined,
                        backgroundColor: orderForm.type === type.value 
                          ? type.color === 'red' ? '#fef2f2' : type.color === 'blue' ? '#eff6ff' : '#faf5ff'
                          : undefined,
                      }}
                    >
                      <type.icon className={`w-5 h-5 mx-auto mb-1 ${
                        orderForm.type === type.value 
                          ? type.color === 'red' ? 'text-red-500' : type.color === 'blue' ? 'text-blue-500' : 'text-purple-500'
                          : 'text-industrial-400'
                      }`} />
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                  问题描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  placeholder="请详细描述故障现象或维保需求..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-industrial-100">
              <button onClick={() => setShowOrderModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmitOrder} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                提交工单
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-slide-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-industrial-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-industrial-900">
                {selectedOrder.status === 'completed' ? '工单详情' : '完成工单'}
              </h3>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedOrder(null);
                }}
                className="p-1 hover:bg-industrial-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-industrial-400" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="p-4 rounded-lg bg-industrial-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-industrial-500">工单编号：</span>
                    <span className="font-mono font-medium">{selectedOrder.id.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-industrial-500">设备：</span>
                    <span className="font-medium">{furnaces.find(f => f.id === selectedOrder.furnaceId)?.name}</span>
                  </div>
                  <div>
                    <span className="text-industrial-500">类型：</span>
                    <span className={`badge ${statusLabels[selectedOrder.type].className}`}>
                      {statusLabels[selectedOrder.type].label}
                    </span>
                  </div>
                  <div>
                    <span className="text-industrial-500">状态：</span>
                    <span className={`badge ${statusLabels[selectedOrder.status].className}`}>
                      {statusLabels[selectedOrder.status].label}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-industrial-200">
                  <div className="text-industrial-500 text-sm mb-1">问题描述：</div>
                  <p className="text-sm text-industrial-700">{selectedOrder.description}</p>
                </div>
              </div>

              {selectedOrder.status !== 'completed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                      处理结果 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={completeForm.result}
                      onChange={(e) => setCompleteForm({ ...completeForm, result: e.target.value })}
                      placeholder="请填写处理结果和解决方案..."
                      rows={4}
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                      维修费用（元）
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={completeForm.cost}
                      onChange={(e) => setCompleteForm({ ...completeForm, cost: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-industrial-700">
                        更换备件
                      </label>
                      <button
                        onClick={handleAddSparePart}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + 添加备件
                      </button>
                    </div>

                    {completeForm.spareParts.length === 0 ? (
                      <div className="p-6 border-2 border-dashed border-industrial-200 rounded-lg text-center text-industrial-400 text-sm">
                        暂无备件，点击上方按钮添加
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completeForm.spareParts.map((part, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-industrial-50 rounded-lg">
                            <div className="flex-1">
                              <label className="text-xs text-industrial-500 mb-1 block">备件名称</label>
                              <input
                                type="text"
                                value={part.partName}
                                onChange={(e) => handleUpdateSparePart(index, 'partName', e.target.value)}
                                placeholder="备件名称"
                                className="input-field text-sm py-1.5"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-industrial-500 mb-1 block">规格型号</label>
                              <input
                                type="text"
                                value={part.partModel}
                                onChange={(e) => handleUpdateSparePart(index, 'partModel', e.target.value)}
                                placeholder="规格型号"
                                className="input-field text-sm py-1.5"
                              />
                            </div>
                            <div className="w-20">
                              <label className="text-xs text-industrial-500 mb-1 block">数量</label>
                              <input
                                type="number"
                                min="1"
                                value={part.quantity}
                                onChange={(e) => handleUpdateSparePart(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="input-field text-sm py-1.5"
                              />
                            </div>
                            <div className="flex items-end pb-1">
                              <button
                                onClick={() => handleRemoveSparePart(index)}
                                className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedOrder.status === 'completed' && selectedOrder.result && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-industrial-700 mb-2">处理结果</div>
                    <p className="text-sm text-industrial-600 p-3 bg-green-50 rounded-lg border border-green-100">
                      {selectedOrder.result}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-industrial-700 mb-2">维修费用</div>
                    <p className="text-2xl font-bold text-red-600">
                      ¥{selectedOrder.cost?.toLocaleString() || 0}
                    </p>
                  </div>
                  {getOrderSpareParts(selectedOrder.id).length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-industrial-700 mb-2">更换备件</div>
                      <div className="space-y-2">
                        {getOrderSpareParts(selectedOrder.id).map((part) => (
                          <div key={part.id} className="flex justify-between items-center p-3 bg-industrial-50 rounded-lg">
                            <div>
                              <div className="font-medium text-industrial-800">{part.partName}</div>
                              <div className="text-xs text-industrial-500">{part.partModel}</div>
                            </div>
                            <span className="badge bg-blue-100 text-blue-700">{part.quantity} 件</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-industrial-100 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedOrder(null);
                }}
                className="btn-secondary"
              >
                {selectedOrder.status === 'completed' ? '关闭' : '取消'}
              </button>
              {selectedOrder.status !== 'completed' && (
                <button
                  onClick={handleSubmitComplete}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
