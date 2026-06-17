import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  Flame,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  XCircle,
  Edit2,
  X,
  AlertTriangle,
  Trash2,
  Save,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  statusLabels,
  formatTime,
  formatDateTime,
  formatDuration,
  employees,
  furnaces,
  employeeRoleLabels,
} from '@/data/mockData';
import { format, addDays, startOfWeek, isToday, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleStatus, CremationSchedule } from '@/types';

interface ScheduleFormData {
  deceasedName: string;
  scheduledDate: string;
  scheduledTime: string;
  furnaceId: string;
  operatorId: string;
  estimatedDuration: number;
  remarks: string;
}

export default function Schedule() {
  const {
    schedules,
    selectedDate,
    setSelectedDate,
    updateScheduleStatus,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    checkScheduleConflict,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CremationSchedule | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<ScheduleFormData>({
    deceasedName: '',
    scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
    scheduledTime: '08:00',
    furnaceId: 'f1',
    operatorId: 'e2',
    estimatedDuration: 90,
    remarks: '',
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSchedulesForDate = (date: Date) => {
    return schedules
      .filter((s) => isSameDay(new Date(s.scheduledTime), date) && s.status !== 'cancelled')
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

  useEffect(() => {
    if (showModal && !editingSchedule) {
      setFormData({
        deceasedName: '',
        scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
        scheduledTime: '08:00',
        furnaceId: 'f1',
        operatorId: 'e2',
        estimatedDuration: 90,
        remarks: '',
      });
      setHasConflict(false);
      setFormError('');
    }
  }, [showModal, editingSchedule, selectedDate]);

  useEffect(() => {
    if (editingSchedule) {
      const date = new Date(editingSchedule.scheduledTime);
      setFormData({
        deceasedName: editingSchedule.deceasedName,
        scheduledDate: format(date, 'yyyy-MM-dd'),
        scheduledTime: format(date, 'HH:mm'),
        furnaceId: editingSchedule.furnaceId,
        operatorId: editingSchedule.operatorId,
        estimatedDuration: editingSchedule.estimatedDuration,
        remarks: editingSchedule.remarks || '',
      });
      setHasConflict(false);
      setFormError('');
    }
  }, [editingSchedule]);

  useEffect(() => {
    if (formData.furnaceId && formData.scheduledDate && formData.scheduledTime && formData.estimatedDuration) {
      const scheduleDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const conflict = checkScheduleConflict(
        formData.furnaceId,
        scheduleDateTime,
        formData.estimatedDuration,
        editingSchedule?.id
      );
      setHasConflict(conflict);
    }
  }, [formData.furnaceId, formData.scheduledDate, formData.scheduledTime, formData.estimatedDuration, editingSchedule, checkScheduleConflict]);

  const handleStatusChange = (id: string, status: ScheduleStatus) => {
    if (window.confirm(`确认将状态更改为"${statusLabels[status].label}"吗？`)) {
      updateScheduleStatus(id, status);
    }
  };

  const handleEdit = (schedule: CremationSchedule) => {
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条排程记录吗？')) {
      deleteSchedule(id);
    }
  };

  const handleSubmit = () => {
    setFormError('');

    if (!formData.deceasedName.trim()) {
      setFormError('请输入逝者姓名');
      return;
    }
    if (!formData.scheduledDate || !formData.scheduledTime) {
      setFormError('请选择日期和时间');
      return;
    }
    if (!formData.furnaceId) {
      setFormError('请选择火化炉');
      return;
    }
    if (!formData.operatorId) {
      setFormError('请选择操作工');
      return;
    }
    if (formData.estimatedDuration < 30 || formData.estimatedDuration > 300) {
      setFormError('预计时长应在30-300分钟之间');
      return;
    }

    const scheduleDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

    if (hasConflict) {
      setFormError('该火化炉在此时段已有排程，请选择其他时间或火化炉');
      return;
    }

    const scheduleData = {
      deceasedName: formData.deceasedName.trim(),
      scheduledTime: scheduleDateTime.toISOString(),
      furnaceId: formData.furnaceId,
      operatorId: formData.operatorId,
      status: 'pending' as ScheduleStatus,
      estimatedDuration: formData.estimatedDuration,
      remarks: formData.remarks.trim() || undefined,
    };

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, scheduleData);
    } else {
      addSchedule(scheduleData);
    }

    setShowModal(false);
    setEditingSchedule(null);
  };

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 7 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">火化排程</h1>
          <p className="text-industrial-500 mt-1">管理火化业务排程和操作工排班</p>
        </div>
        <button
          onClick={() => {
            setEditingSchedule(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增排程
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-2 hover:bg-industrial-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-industrial-900 min-w-[200px] text-center">
              {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </h2>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-industrial-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
            >
              今天
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-industrial-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-industrial-600 hover:text-industrial-900'
                }`}
              >
                日视图
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-industrial-600 hover:text-industrial-900'
                }`}
              >
                周视图
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 bg-industrial-50 border-b border-industrial-200">
                <div className="table-header">时间</div>
                <div className="table-header">逝者姓名</div>
                <div className="table-header">火化炉</div>
                <div className="table-header">操作工</div>
                <div className="table-header">状态</div>
                <div className="table-header">操作</div>
              </div>

              {getSchedulesForDate(selectedDate).length === 0 ? (
                <div className="py-16 text-center text-industrial-400">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>该日期暂无排程</p>
                  <button
                    onClick={() => {
                      setEditingSchedule(null);
                      setShowModal(true);
                    }}
                    className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    + 添加第一条排程
                  </button>
                </div>
              ) : (
                getSchedulesForDate(selectedDate).map((schedule) => {
                  const operator = employees.find((e) => e.id === schedule.operatorId);
                  const furnace = furnaces.find((f) => f.id === schedule.furnaceId);
                  return (
                    <div
                      key={schedule.id}
                      className={`grid grid-cols-6 border-b border-industrial-100 hover:bg-industrial-50 transition-colors ${
                        schedule.status === 'cremating' ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="table-cell">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-industrial-400" />
                          <span className="font-mono">{formatTime(schedule.scheduledTime)}</span>
                        </div>
                        {schedule.estimatedDuration && (
                          <div className="text-xs text-industrial-400 mt-1">
                            预计 {formatDuration(schedule.estimatedDuration)}
                          </div>
                        )}
                      </div>
                      <div className="table-cell">
                        <div className="font-medium text-industrial-900">{schedule.deceasedName}</div>
                        {schedule.remarks && (
                          <div className="text-xs text-industrial-500 mt-1">{schedule.remarks}</div>
                        )}
                      </div>
                      <div className="table-cell">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{furnace?.name}</span>
                        </div>
                      </div>
                      <div className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{operator?.name}</div>
                            <div className="text-xs text-industrial-400">
                              {operator && employeeRoleLabels[operator.role]}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className={`badge ${statusLabels[schedule.status].className}`}>
                          {statusLabels[schedule.status].label}
                        </span>
                        {schedule.actualDuration && (
                          <div className="text-xs text-industrial-500 mt-1">
                            实际 {formatDuration(schedule.actualDuration)}
                          </div>
                        )}
                      </div>
                      <div className="table-cell">
                        <div className="flex items-center gap-1">
                          {schedule.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(schedule.id, 'preheating')}
                                className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded transition-colors"
                                title="开始预热"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(schedule)}
                                className="p-1.5 hover:bg-primary-100 text-primary-600 rounded transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {schedule.status === 'preheating' && (
                            <button
                              onClick={() => handleStatusChange(schedule.id, 'cremating')}
                              className="p-1.5 hover:bg-orange-100 text-orange-600 rounded transition-colors"
                              title="开始火化"
                            >
                              <Flame className="w-4 h-4" />
                            </button>
                          )}
                          {schedule.status === 'cremating' && (
                            <button
                              onClick={() => handleStatusChange(schedule.id, 'completed')}
                              className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                              title="完成火化"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {schedule.status === 'completed' && (
                            <span className="text-xs text-industrial-400">已完成</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-8 bg-industrial-50 border-b border-industrial-200">
                <div className="table-header">时间</div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`table-header ${isToday(day) ? 'bg-primary-50 text-primary-600' : ''}`}
                  >
                    <div>{format(day, 'MM/dd', { locale: zhCN })}</div>
                    <div className="text-xs font-normal">
                      {format(day, 'EEE', { locale: zhCN })}
                    </div>
                  </div>
                ))}
              </div>

              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b border-industrial-100">
                  <div className="table-cell font-mono text-sm text-industrial-500">{time}</div>
                  {weekDays.map((day) => {
                    const daySchedules = getSchedulesForDate(day).filter((s) =>
                      formatTime(s.scheduledTime) === time
                    );
                    return (
                      <div
                        key={day.toISOString()}
                        className={`table-cell min-h-[80px] ${isToday(day) ? 'bg-primary-50/30' : ''}`}
                      >
                        {daySchedules.map((schedule) => {
                          const furnace = furnaces.find((f) => f.id === schedule.furnaceId);
                          return (
                            <div
                              key={schedule.id}
                              className={`p-2 rounded-lg text-xs mb-1 cursor-pointer transition-all hover:shadow-md ${
                                schedule.status === 'cremating'
                                  ? 'bg-orange-100 border border-orange-300'
                                  : schedule.status === 'completed'
                                  ? 'bg-green-50 border border-green-200'
                                  : schedule.status === 'preheating'
                                  ? 'bg-yellow-50 border border-yellow-200'
                                  : 'bg-white border border-industrial-200 hover:border-primary-300'
                              }`}
                              onClick={() => handleEdit(schedule)}
                            >
                              <div className="font-medium text-industrial-800 truncate">
                                {schedule.deceasedName}
                              </div>
                              <div className="text-industrial-500 flex items-center gap-1 mt-1">
                                <Flame className="w-3 h-3" />
                                {furnace?.name.replace('号火化炉', '号')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">操作工排班</h2>
          <div className="space-y-3">
            {employees.filter((e) => e.role === 'operator').map((employee) => {
              const todaySchedules = getSchedulesForDate(selectedDate).filter(
                (s) => s.operatorId === employee.id
              );
              return (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-industrial-200 hover:bg-industrial-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-industrial-800">{employee.name}</div>
                      <div className="text-xs text-industrial-500">
                        {employeeRoleLabels[employee.role]}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-industrial-700">
                      {todaySchedules.length} 具任务
                    </div>
                    <div className="text-xs text-industrial-500">
                      {todaySchedules.map((s) => formatTime(s.scheduledTime)).join(' / ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">火化炉使用情况</h2>
          <div className="space-y-4">
            {furnaces.map((furnace) => {
              const daySchedules = getSchedulesForDate(selectedDate).filter(
                (s) => s.furnaceId === furnace.id
              );
              const completedCount = daySchedules.filter((s) => s.status === 'completed').length;
              const totalDuration = daySchedules.reduce(
                (sum, s) => sum + (s.actualDuration || s.estimatedDuration),
                0
              );

              return (
                <div key={furnace.id} className="p-4 rounded-xl bg-industrial-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Flame
                        className={`w-5 h-5 ${
                          furnace.status === 'running' ? 'text-orange-500' : 'text-industrial-400'
                        }`}
                      />
                      <span className="font-semibold text-industrial-800">{furnace.name}</span>
                      <span className={`badge ${statusLabels[furnace.status].className}`}>
                        {statusLabels[furnace.status].label}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-industrial-700">
                        {completedCount}/{daySchedules.length} 具
                      </div>
                      <div className="text-xs text-industrial-500">{formatDuration(totalDuration)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`flex-1 h-2 rounded-full cursor-pointer ${
                          schedule.status === 'completed'
                            ? 'bg-green-500'
                            : schedule.status === 'cremating'
                            ? 'bg-orange-500 animate-pulse'
                            : schedule.status === 'preheating'
                            ? 'bg-yellow-500'
                            : 'bg-industrial-300 hover:bg-industrial-400'
                        }`}
                        title={`${formatTime(schedule.scheduledTime)} - ${schedule.deceasedName}`}
                        onClick={() => handleEdit(schedule)}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-industrial-100">
              <h3 className="text-lg font-semibold text-industrial-900">
                {editingSchedule ? '编辑排程' : '新增排程'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSchedule(null);
                }}
                className="p-1 hover:bg-industrial-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-industrial-400" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {hasConflict && !formError && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  该火化炉在此时段已有排程，请选择其他时间或火化炉
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                  逝者姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deceasedName}
                  onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                  placeholder="请输入逝者姓名"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                    时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                    火化炉 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.furnaceId}
                    onChange={(e) => setFormData({ ...formData, furnaceId: e.target.value })}
                    className="input-field"
                  >
                    {furnaces.filter(f => f.status !== 'fault' && f.status !== 'maintenance').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({statusLabels[f.status].label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                    操作工 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.operatorId}
                    onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                    className="input-field"
                  >
                    {employees.filter(e => e.role === 'operator' && e.status === 'active').map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                  预计时长（分钟）
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="240"
                    step="15"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-20 text-center font-mono text-lg font-semibold text-primary-600">
                    {formData.estimatedDuration}分钟
                  </span>
                </div>
                <div className="flex justify-between text-xs text-industrial-400 mt-1">
                  <span>30分钟</span>
                  <span>240分钟</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-700 mb-1.5">
                  备注
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="请输入备注信息（选填）"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-industrial-100">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSchedule(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={hasConflict}
                className={`btn-primary flex items-center gap-2 ${hasConflict ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-4 h-4" />
                {editingSchedule ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
