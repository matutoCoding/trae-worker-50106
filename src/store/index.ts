import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Furnace,
  Employee,
  CremationSchedule,
  FurnaceMonitor,
  EnergyRecord,
  MaintenanceOrder,
  SparePartUsage,
  AshHandover,
  EnvironmentMonitor,
  DashboardStats,
} from '@/types';
import {
  furnaces as mockFurnaces,
  employees as mockEmployees,
  schedules as mockSchedules,
  monitorData as mockMonitorData,
  energyRecords as mockEnergyRecords,
  maintenanceOrders as mockMaintenanceOrders,
  sparePartUsages as mockSparePartUsages,
  ashHandovers as mockAshHandovers,
  environmentData as mockEnvironmentData,
} from '@/data/mockData';
import { addMinutes, format, isSameDay } from 'date-fns';

const generateId = () => Math.random().toString(36).substring(2, 11);

const calculateDashboardStats = (
  schedules: CremationSchedule[],
  energyRecords: EnergyRecord[],
  furnaces: Furnace[],
  environmentData: EnvironmentMonitor[],
  maintenanceOrders: MaintenanceOrder[],
  ashHandovers: AshHandover[]
): DashboardStats => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySchedules = schedules.filter(s =>
    format(new Date(s.scheduledTime), 'yyyy-MM-dd') === todayStr
  );
  const todayEnergy = energyRecords.filter(e => e.recordDate === todayStr);
  const runningFurnaces = furnaces.filter(f => f.status === 'running');
  const idleFurnaces = furnaces.filter(f => f.status === 'idle');
  const maintenanceFurnaces = furnaces.filter(f => f.status === 'maintenance');
  const faultFurnaces = furnaces.filter(f => f.status === 'fault');

  const last24hEnvironment = environmentData.filter(e =>
    new Date(e.timestamp) > addMinutes(new Date(), -1440)
  );
  const complianceRate = last24hEnvironment.length > 0
    ? Math.round((last24hEnvironment.filter(e => e.complianceStatus === 'compliant').length / last24hEnvironment.length) * 100)
    : 0;

  const completedToday = todaySchedules.filter(s => s.status === 'completed');
  const avgDuration = completedToday.length > 0
    ? Math.round(completedToday.reduce((sum, s) => sum + (s.actualDuration || s.estimatedDuration), 0) / completedToday.length)
    : 0;

  return {
    todayCremations: todaySchedules.length,
    inProgressCount: todaySchedules.filter(s => s.status === 'cremating' || s.status === 'preheating').length,
    pendingCount: todaySchedules.filter(s => s.status === 'pending').length,
    completedCount: completedToday.length,
    totalFuelToday: Math.round(todayEnergy.reduce((sum, e) => sum + e.fuelConsumption, 0) * 10) / 10,
    totalElectricityToday: Math.round(todayEnergy.reduce((sum, e) => sum + e.electricityConsumption, 0) * 10) / 10,
    totalCostToday: Math.round(todayEnergy.reduce((sum, e) => sum + e.cost, 0)),
    avgDurationToday: avgDuration,
    furnacesRunning: runningFurnaces.length,
    furnacesIdle: idleFurnaces.length,
    furnacesMaintenance: maintenanceFurnaces.length,
    furnacesFault: faultFurnaces.length,
    complianceRate,
    pendingMaintenance: maintenanceOrders.filter(m => m.status === 'pending' || m.status === 'in_progress').length,
    pendingHandover: ashHandovers.filter(h => h.confirmationStatus !== 'confirmed').length,
  };
};

const generateMonitorDataForFurnace = (
  furnaceId: string,
  baseTemp: number,
  hours: number,
  intervalMinutes: number = 5
): FurnaceMonitor[] => {
  const data: FurnaceMonitor[] = [];
  const now = new Date();
  const count = Math.floor((hours * 60) / intervalMinutes);

  for (let i = 0; i < count; i++) {
    const timestamp = addMinutes(now, -i * intervalMinutes);
    const tempVariation = Math.sin(i / 12) * 40 + (Math.random() - 0.5) * 25;

    data.push({
      id: generateId(),
      furnaceId,
      timestamp: timestamp.toISOString(),
      temperature: Math.max(200, Math.min(1200, baseTemp + tempVariation)),
      pressure: 101.3 + Math.sin(i / 20) * 2 + (Math.random() - 0.5),
      oxygenLevel: 8 + Math.sin(i / 25) * 1.5 + (Math.random() - 0.5) * 0.5,
      status: 'running',
    });
  }

  return data.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

interface AppState {
  furnaces: Furnace[];
  employees: Employee[];
  schedules: CremationSchedule[];
  monitorData: FurnaceMonitor[];
  energyRecords: EnergyRecord[];
  maintenanceOrders: MaintenanceOrder[];
  sparePartUsages: SparePartUsage[];
  ashHandovers: AshHandover[];
  environmentData: EnvironmentMonitor[];
  dashboardStats: DashboardStats;
  currentUser: Employee;
  selectedDate: Date;
  _hasHydrated: boolean;

  setSelectedDate: (date: Date) => void;
  setHasHydrated: (value: boolean) => void;
  refreshDashboardStats: () => void;

  addSchedule: (schedule: Omit<CremationSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<CremationSchedule>) => void;
  deleteSchedule: (id: string) => void;
  updateScheduleStatus: (id: string, status: CremationSchedule['status']) => void;
  checkScheduleConflict: (furnaceId: string, startTime: Date, durationMinutes: number, excludeId?: string) => boolean;

  addMaintenanceOrder: (order: Omit<MaintenanceOrder, 'id'>) => void;
  updateMaintenanceOrder: (id: string, updates: Partial<MaintenanceOrder>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceOrder['status'], updates?: Partial<MaintenanceOrder>) => void;
  addSparePartUsage: (usage: Omit<SparePartUsage, 'id'>) => void;
  getSparePartsByMaintenance: (maintenanceId: string) => SparePartUsage[];

  updateAshHandover: (id: string, updates: Partial<AshHandover>) => void;

  addMonitorData: (data: FurnaceMonitor) => void;
  getMonitorDataByFurnace: (furnaceId: string) => FurnaceMonitor[];
  getMonitorDataByFurnaceAndRange: (furnaceId: string, hours: number) => FurnaceMonitor[];
  replenishMonitorData: (furnaceId: string, hours: number) => void;
  resetMonitorData: () => void;
  getMonitorDataByTimeRange: (furnaceId: string, startTime: string, endTime: string) => FurnaceMonitor[];

  updateFurnaceStatus: (furnaceId: string, status: Furnace['status']) => void;

  addEnergyRecord: (record: Omit<EnergyRecord, 'id'>) => void;
  updateEnergyRecord: (id: string, updates: Partial<EnergyRecord>) => void;
  getEnergyBySchedule: (scheduleId: string) => EnergyRecord[];
  getEnergyByFurnaceAndDate: (furnaceId: string, date: string) => EnergyRecord[];

  getFullTraceBySchedule: (scheduleId: string) => {
    schedule: CremationSchedule | undefined;
    monitorData: FurnaceMonitor[];
    energyRecords: EnergyRecord[];
    ashHandover: AshHandover | undefined;
    environmentData: EnvironmentMonitor[];
  };

  getFurnaceById: (id: string) => Furnace | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getSchedulesByDate: (date: Date) => CremationSchedule[];
  getSchedulesByFurnace: (furnaceId: string) => CremationSchedule[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      furnaces: mockFurnaces,
      employees: mockEmployees,
      schedules: mockSchedules,
      monitorData: mockMonitorData,
      energyRecords: mockEnergyRecords,
      maintenanceOrders: mockMaintenanceOrders,
      sparePartUsages: mockSparePartUsages,
      ashHandovers: mockAshHandovers,
      environmentData: mockEnvironmentData,
      dashboardStats: calculateDashboardStats(
        mockSchedules,
        mockEnergyRecords,
        mockFurnaces,
        mockEnvironmentData,
        mockMaintenanceOrders,
        mockAshHandovers
      ),
      currentUser: mockEmployees[0],
      selectedDate: new Date(),
      _hasHydrated: false,

      setSelectedDate: (date: Date) => set({ selectedDate: date }),
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),

      refreshDashboardStats: () => {
        const { schedules, energyRecords, furnaces, environmentData, maintenanceOrders, ashHandovers } = get();
        set({
          dashboardStats: calculateDashboardStats(
            schedules,
            energyRecords,
            furnaces,
            environmentData,
            maintenanceOrders,
            ashHandovers
          ),
        });
      },

      addSchedule: (schedule) => {
        const newSchedule = { ...schedule, id: generateId() };
        set((state) => {
          const newSchedules = [...state.schedules, newSchedule];
          return {
            schedules: newSchedules,
            dashboardStats: calculateDashboardStats(
              newSchedules,
              state.energyRecords,
              state.furnaces,
              state.environmentData,
              state.maintenanceOrders,
              state.ashHandovers
            ),
          };
        });
        return newSchedule;
      },

      updateSchedule: (id, updates) => {
        set((state) => {
          const oldSchedule = state.schedules.find(s => s.id === id);
          const newSchedules = state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );

          let newEnergyRecords = state.energyRecords;
          if (oldSchedule && (updates.furnaceId || updates.actualDuration || updates.estimatedDuration)) {
            const updatedSchedule = { ...oldSchedule, ...updates };
            newEnergyRecords = state.energyRecords.map(e => {
              if (e.scheduleId !== id) return e;
              const duration = updatedSchedule.actualDuration || updatedSchedule.estimatedDuration;
              return {
                ...e,
                furnaceId: updatedSchedule.furnaceId,
                durationMinutes: duration,
                fuelConsumption: Math.max(0, duration * 0.08 + (Math.random() - 0.3) * 5),
                electricityConsumption: Math.max(0, duration * 0.15 + (Math.random() - 0.3) * 3),
                cost: 0,
              };
            });
            newEnergyRecords = newEnergyRecords.map(e => {
              if (e.scheduleId !== id) return e;
              return { ...e, cost: e.fuelConsumption * 8 + e.electricityConsumption * 1.2 };
            });
          }

          return {
            schedules: newSchedules,
            energyRecords: newEnergyRecords,
            dashboardStats: calculateDashboardStats(
              newSchedules,
              newEnergyRecords,
              state.furnaces,
              state.environmentData,
              state.maintenanceOrders,
              state.ashHandovers
            ),
          };
        });
      },

      deleteSchedule: (id) => {
        set((state) => {
          const newSchedules = state.schedules.filter((s) => s.id !== id);
          const newEnergyRecords = state.energyRecords.filter(e => e.scheduleId !== id);
          return {
            schedules: newSchedules,
            energyRecords: newEnergyRecords,
            dashboardStats: calculateDashboardStats(
              newSchedules,
              newEnergyRecords,
              state.furnaces,
              state.environmentData,
              state.maintenanceOrders,
              state.ashHandovers
            ),
          };
        });
      },

      updateScheduleStatus: (id, status) => {
        set((state) => {
          const schedule = state.schedules.find((s) => s.id === id);
          if (!schedule) return {};

          const updates: Partial<CremationSchedule> = { status };
          if (status === 'preheating' && !schedule.startTime) {
            updates.startTime = new Date().toISOString();
          }
          if (status === 'cremating' && !schedule.startTime) {
            updates.startTime = new Date().toISOString();
          }
          if (status === 'completed' && schedule.startTime) {
            updates.endTime = new Date().toISOString();
            const start = new Date(schedule.startTime);
            const end = new Date();
            updates.actualDuration = Math.round((end.getTime() - start.getTime()) / 60000);
          }

          const newSchedules = state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );

          let newAshHandovers = state.ashHandovers;
          if (status === 'completed') {
            const existingHandover = state.ashHandovers.find(h => h.scheduleId === id);
            if (!existingHandover) {
              newAshHandovers = [
                ...state.ashHandovers,
                {
                  id: generateId(),
                  scheduleId: id,
                  familyMember: `${schedule.deceasedName.replace('某某', '')}家属`,
                  confirmationStatus: 'pending',
                },
              ];
            }
          }

          let newEnergyRecords = state.energyRecords;
          if (status === 'completed' && updates.actualDuration) {
            const existingEnergy = state.energyRecords.find(e => e.scheduleId === id);
            if (!existingEnergy) {
              const duration = updates.actualDuration;
              const fuelConsumption = Math.max(0, duration * 0.08 + (Math.random() - 0.3) * 5);
              const electricityConsumption = Math.max(0, duration * 0.15 + (Math.random() - 0.3) * 3);
              newEnergyRecords = [
                ...state.energyRecords,
                {
                  id: generateId(),
                  scheduleId: id,
                  furnaceId: schedule.furnaceId,
                  recordDate: format(new Date(schedule.scheduledTime), 'yyyy-MM-dd'),
                  fuelConsumption,
                  electricityConsumption,
                  durationMinutes: duration,
                  cost: fuelConsumption * 8 + electricityConsumption * 1.2,
                },
              ];
            }
          }

          return {
            schedules: newSchedules,
            ashHandovers: newAshHandovers,
            energyRecords: newEnergyRecords,
            dashboardStats: calculateDashboardStats(
              newSchedules,
              newEnergyRecords,
              state.furnaces,
              state.environmentData,
              state.maintenanceOrders,
              newAshHandovers
            ),
          };
        });
      },

      checkScheduleConflict: (furnaceId, startTime, durationMinutes, excludeId) => {
        const { schedules } = get();
        const endTime = addMinutes(startTime, durationMinutes);

        return schedules.some((s) => {
          if (excludeId && s.id === excludeId) return false;
          if (s.furnaceId !== furnaceId) return false;
          if (s.status === 'cancelled') return false;

          const sStart = new Date(s.scheduledTime);
          const sEnd = addMinutes(sStart, s.estimatedDuration);

          return (startTime < sEnd && endTime > sStart);
        });
      },

      addMaintenanceOrder: (order) => {
        const newOrder = { ...order, id: generateId() };
        set((state) => {
          const newOrders = [...state.maintenanceOrders, newOrder];
          let newFurnaces = state.furnaces;
          if (order.type === 'repair') {
            newFurnaces = state.furnaces.map(f =>
              f.id === order.furnaceId ? { ...f, status: 'fault' as const } : f
            );
          }
          return {
            maintenanceOrders: newOrders,
            furnaces: newFurnaces,
            dashboardStats: calculateDashboardStats(
              state.schedules,
              state.energyRecords,
              newFurnaces,
              state.environmentData,
              newOrders,
              state.ashHandovers
            ),
          };
        });
        return newOrder;
      },

      updateMaintenanceOrder: (id, updates) => {
        set((state) => {
          const newOrders = state.maintenanceOrders.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          );
          return {
            maintenanceOrders: newOrders,
            dashboardStats: calculateDashboardStats(
              state.schedules,
              state.energyRecords,
              state.furnaces,
              state.environmentData,
              newOrders,
              state.ashHandovers
            ),
          };
        });
      },

      updateMaintenanceStatus: (id, status, updates = {}) => {
        const state = get();
        const order = state.maintenanceOrders.find((m) => m.id === id);
        if (!order) return;

        const fullUpdates: Partial<MaintenanceOrder> = { ...updates, status };
        if (status === 'in_progress' && !order.handlerId) {
          fullUpdates.handlerId = state.currentUser.id;
          fullUpdates.handleTime = new Date().toISOString();
        }

        if (status === 'completed') {
          const newFurnaces = state.furnaces.map(f => {
            if (f.id === order.furnaceId && (f.status === 'fault' || f.status === 'maintenance')) {
              return { ...f, status: 'idle' as const, lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd') };
            }
            return f;
          });

          set((s) => ({
            furnaces: newFurnaces,
            dashboardStats: calculateDashboardStats(
              s.schedules,
              s.energyRecords,
              newFurnaces,
              s.environmentData,
              s.maintenanceOrders.map(m => m.id === id ? { ...m, ...fullUpdates } : m),
              s.ashHandovers
            ),
          }));

          get().updateMaintenanceOrder(id, fullUpdates);
          return;
        }

        get().updateMaintenanceOrder(id, fullUpdates);
      },

      addSparePartUsage: (usage) => {
        set((state) => ({
          sparePartUsages: [...state.sparePartUsages, { ...usage, id: generateId() }],
        }));
      },

      getSparePartsByMaintenance: (maintenanceId) => {
        return get().sparePartUsages.filter((u) => u.maintenanceId === maintenanceId);
      },

      updateAshHandover: (id, updates) => {
        set((state) => {
          const newHandovers = state.ashHandovers.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          );
          return {
            ashHandovers: newHandovers,
            dashboardStats: calculateDashboardStats(
              state.schedules,
              state.energyRecords,
              state.furnaces,
              state.environmentData,
              state.maintenanceOrders,
              newHandovers
            ),
          };
        });
      },

      addMonitorData: (data) => {
        set((state) => ({
          monitorData: [...state.monitorData.slice(-2000), { ...data, id: generateId() }],
        }));
      },

      getMonitorDataByFurnace: (furnaceId) => {
        return get()
          .monitorData.filter((m) => m.furnaceId === furnaceId)
          .sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
      },

      getMonitorDataByFurnaceAndRange: (furnaceId, hours) => {
        const now = new Date();
        const startTime = addMinutes(now, -hours * 60);
        return get()
          .monitorData.filter((m) => m.furnaceId === furnaceId && new Date(m.timestamp) >= startTime)
          .sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
      },

      replenishMonitorData: (furnaceId, hours) => {
        const state = get();
        const now = new Date();
        const targetStart = addMinutes(now, -hours * 60);

        const existing = state.monitorData.filter(m => m.furnaceId === furnaceId);
        const existingSorted = existing.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const existingStart = existingSorted.length > 0
          ? new Date(existingSorted[0].timestamp)
          : null;
        const existingEnd = existingSorted.length > 0
          ? new Date(existingSorted[existingSorted.length - 1].timestamp)
          : null;

        const furnace = state.furnaces.find(f => f.id === furnaceId);
        if (!furnace || furnace.status !== 'running') return;

        const baseTemp = furnaceId === 'f1' ? 850 : furnaceId === 'f2' ? 920 : 880;

        const newPoints: FurnaceMonitor[] = [];

        if (!existingStart || existingStart > targetStart) {
          const gapStart = existingStart || targetStart;
          const gapMs = gapStart.getTime() - targetStart.getTime();
          const gapMinutes = Math.floor(gapMs / 60000);
          const count = Math.floor(gapMinutes / 5);

          for (let i = 0; i < count; i++) {
            const timestamp = addMinutes(targetStart, i * 5);
            if (existingStart && timestamp >= existingStart) break;
            const tempVariation = Math.sin(i / 12) * 40 + (Math.random() - 0.5) * 25;
            newPoints.push({
              id: generateId(),
              furnaceId,
              timestamp: timestamp.toISOString(),
              temperature: Math.max(200, Math.min(1200, baseTemp + tempVariation)),
              pressure: 101.3 + Math.sin(i / 20) * 2 + (Math.random() - 0.5),
              oxygenLevel: 8 + Math.sin(i / 25) * 1.5 + (Math.random() - 0.5) * 0.5,
              status: 'running',
            });
          }
        }

        if (!existingEnd || existingEnd < now) {
          const gapEnd = existingEnd || targetStart;
          const gapMs = now.getTime() - gapEnd.getTime();
          const gapMinutes = Math.floor(gapMs / 60000);
          const count = Math.floor(gapMinutes / 5);

          const startIdx = existingSorted.length;
          for (let i = 0; i < count; i++) {
            const timestamp = addMinutes(gapEnd, (i + 1) * 5);
            if (timestamp > now) break;
            const tempVariation = Math.sin((startIdx + i) / 12) * 40 + (Math.random() - 0.5) * 25;
            newPoints.push({
              id: generateId(),
              furnaceId,
              timestamp: timestamp.toISOString(),
              temperature: Math.max(200, Math.min(1200, baseTemp + tempVariation)),
              pressure: 101.3 + Math.sin((startIdx + i) / 20) * 2 + (Math.random() - 0.5),
              oxygenLevel: 8 + Math.sin((startIdx + i) / 25) * 1.5 + (Math.random() - 0.5) * 0.5,
              status: 'running',
            });
          }
        }

        if (newPoints.length > 0) {
          set((s) => ({
            monitorData: [...s.monitorData, ...newPoints].slice(-5000),
          }));
        }
      },

      resetMonitorData: () => {
        set({ monitorData: mockMonitorData });
      },

      getMonitorDataByTimeRange: (furnaceId, startTime, endTime) => {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return get()
          .monitorData.filter(m =>
            m.furnaceId === furnaceId &&
            new Date(m.timestamp).getTime() >= start &&
            new Date(m.timestamp).getTime() <= end
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      },

      updateFurnaceStatus: (furnaceId, status) => {
        set((state) => {
          const newFurnaces = state.furnaces.map(f =>
            f.id === furnaceId ? { ...f, status } : f
          );
          return {
            furnaces: newFurnaces,
            dashboardStats: calculateDashboardStats(
              state.schedules,
              state.energyRecords,
              newFurnaces,
              state.environmentData,
              state.maintenanceOrders,
              state.ashHandovers
            ),
          };
        });
      },

      addEnergyRecord: (record) => {
        set((state) => ({
          energyRecords: [...state.energyRecords, { ...record, id: generateId() }],
        }));
      },

      updateEnergyRecord: (id, updates) => {
        set((state) => ({
          energyRecords: state.energyRecords.map(e =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      getEnergyBySchedule: (scheduleId) => {
        return get().energyRecords.filter(e => e.scheduleId === scheduleId);
      },

      getEnergyByFurnaceAndDate: (furnaceId, date) => {
        return get().energyRecords.filter(e =>
          e.furnaceId === furnaceId && e.recordDate === date
        );
      },

      getFullTraceBySchedule: (scheduleId) => {
        const state = get();
        const schedule = state.schedules.find(s => s.id === scheduleId);
        const ashHandover = state.ashHandovers.find(h => h.scheduleId === scheduleId);
        const energyRecords = state.energyRecords.filter(e => e.scheduleId === scheduleId);

        let monitorData: FurnaceMonitor[] = [];
        let environmentData: EnvironmentMonitor[] = [];

        if (schedule) {
          const start = schedule.startTime || schedule.scheduledTime;
          const end = schedule.endTime || (schedule.startTime ? new Date().toISOString() : schedule.scheduledTime);
          monitorData = state.monitorData.filter(m =>
            m.furnaceId === schedule.furnaceId &&
            new Date(m.timestamp) >= new Date(start) &&
            new Date(m.timestamp) <= new Date(end)
          ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          environmentData = state.environmentData.filter(e =>
            e.furnaceId === schedule.furnaceId &&
            new Date(e.timestamp) >= new Date(start) &&
            new Date(e.timestamp) <= new Date(end)
          ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }

        return { schedule, monitorData, energyRecords, ashHandover, environmentData };
      },

      getFurnaceById: (id) => get().furnaces.find((f) => f.id === id),

      getEmployeeById: (id) => get().employees.find((e) => e.id === id),

      getSchedulesByDate: (date) => {
        return get().schedules.filter(
          (s) => isSameDay(new Date(s.scheduledTime), date)
        );
      },

      getSchedulesByFurnace: (furnaceId) =>
        get().schedules.filter((s) => s.furnaceId === furnaceId),
    }),
    {
      name: 'cremation-furnace-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schedules: state.schedules,
        maintenanceOrders: state.maintenanceOrders,
        sparePartUsages: state.sparePartUsages,
        ashHandovers: state.ashHandovers,
        monitorData: state.monitorData,
        energyRecords: state.energyRecords,
        furnaces: state.furnaces,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          state.refreshDashboardStats();
        }
      },
    }
  )
);
