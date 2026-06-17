import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  Flame,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit2,
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
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ScheduleStatus } from '@/types';

export default function Schedule() {
  const { schedules, selectedDate, setSelectedDate, updateScheduleStatus } = useAppStore();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSchedulesForDate = (date: Date) => {
    return schedules
      .filter((s) => isSameDay(new Date(s.scheduledTime), date))
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  };

  const handleStatusChange = (id: string, status: ScheduleStatus) => {
    if (window.confirm(`确认将状态更改为"${statusLabels[status].label}"吗？`)) {
      updateScheduleStatus(id, status);
    }
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
        <button className="btn-primary flex items-center gap-2">
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
                              <button className="p-1.5 hover:bg-primary-100 text-primary-600 rounded transition-colors" title="编辑">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(schedule.id, 'cancelled')}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                title="取消"
                              >
                                <XCircle className="w-4 h-4" />
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
                              className={`p-2 rounded-lg text-xs mb-1 ${
                                schedule.status === 'cremating'
                                  ? 'bg-orange-100 border border-orange-300'
                                  : schedule.status === 'completed'
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-white border border-industrial-200'
                              }`}
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
                    {daySchedules.map((schedule, idx) => (
                      <div
                        key={schedule.id}
                        className={`flex-1 h-2 rounded-full ${
                          schedule.status === 'completed'
                            ? 'bg-green-500'
                            : schedule.status === 'cremating'
                            ? 'bg-orange-500 animate-pulse'
                            : schedule.status === 'preheating'
                            ? 'bg-yellow-500'
                            : 'bg-industrial-300'
                        }`}
                        title={`${formatTime(schedule.scheduledTime)} - ${schedule.deceasedName}`}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
