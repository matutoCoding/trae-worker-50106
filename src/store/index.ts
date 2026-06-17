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
          const newSchedules = state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );
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
      },

      deleteSchedule: (id) => {
        set((state) => {
          const newSchedules = state.schedules.filter((s) => s.id !== id);
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

          return {
            schedules: newSchedules,
            ashHandovers: newAshHandovers,
            dashboardStats: calculateDashboardStats(
              newSchedules,
              state.energyRecords,
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
          monitorData: [...state.monitorData.slice(-1000), { ...data, id: generateId() }],
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
