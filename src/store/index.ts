import { create } from 'zustand';
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
  calculateDashboardStats,
} from '@/data/mockData';
import { addMinutes } from 'date-fns';

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
  setSelectedDate: (date: Date) => void;
  addSchedule: (schedule: Omit<CremationSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<CremationSchedule>) => void;
  updateScheduleStatus: (id: string, status: CremationSchedule['status']) => void;
  addMaintenanceOrder: (order: Omit<MaintenanceOrder, 'id'>) => void;
  updateMaintenanceOrder: (id: string, updates: Partial<MaintenanceOrder>) => void;
  addSparePartUsage: (usage: Omit<SparePartUsage, 'id'>) => void;
  updateAshHandover: (id: string, updates: Partial<AshHandover>) => void;
  addMonitorData: (data: FurnaceMonitor) => void;
  getFurnaceById: (id: string) => Furnace | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getSchedulesByDate: (date: Date) => CremationSchedule[];
  getSchedulesByFurnace: (furnaceId: string) => CremationSchedule[];
  getMonitorDataByFurnace: (furnaceId: string) => FurnaceMonitor[];
  refreshDashboardStats: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAppStore = create<AppState>((set, get) => ({
  furnaces: mockFurnaces,
  employees: mockEmployees,
  schedules: mockSchedules,
  monitorData: mockMonitorData,
  energyRecords: mockEnergyRecords,
  maintenanceOrders: mockMaintenanceOrders,
  sparePartUsages: mockSparePartUsages,
  ashHandovers: mockAshHandovers,
  environmentData: mockEnvironmentData,
  dashboardStats: calculateDashboardStats(),
  currentUser: mockEmployees[0],
  selectedDate: new Date(),

  setSelectedDate: (date: Date) => set({ selectedDate: date }),

  addSchedule: (schedule) => set((state) => ({
    schedules: [...state.schedules, { ...schedule, id: generateId() }],
  })),

  updateSchedule: (id, updates) => set((state) => ({
    schedules: state.schedules.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  updateScheduleStatus: (id, status) => set((state) => {
    const schedule = state.schedules.find((s) => s.id === id);
    if (!schedule) return {};

    const updates: Partial<CremationSchedule> = { status };
    if (status === 'cremating' && !schedule.startTime) {
      updates.startTime = new Date().toISOString();
    }
    if (status === 'completed' && schedule.startTime) {
      updates.endTime = new Date().toISOString();
      const start = new Date(schedule.startTime);
      const end = new Date();
      updates.actualDuration = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    return {
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      ashHandovers: status === 'completed'
        ? [
            ...state.ashHandovers,
            {
              id: generateId(),
              scheduleId: id,
              familyMember: `${schedule.deceasedName.replace('某某', '')}家属`,
              confirmationStatus: 'pending',
            },
          ]
        : state.ashHandovers,
    };
  }),

  addMaintenanceOrder: (order) => set((state) => ({
    maintenanceOrders: [...state.maintenanceOrders, { ...order, id: generateId() }],
  })),

  updateMaintenanceOrder: (id, updates) => set((state) => ({
    maintenanceOrders: state.maintenanceOrders.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
  })),

  addSparePartUsage: (usage) => set((state) => ({
    sparePartUsages: [...state.sparePartUsages, { ...usage, id: generateId() }],
  })),

  updateAshHandover: (id, updates) => set((state) => ({
    ashHandovers: state.ashHandovers.map((h) =>
      h.id === id ? { ...h, ...updates } : h
    ),
  })),

  addMonitorData: (data) => set((state) => ({
    monitorData: [...state.monitorData.slice(-500), { ...data, id: generateId() }],
  })),

  getFurnaceById: (id) => get().furnaces.find((f) => f.id === id),

  getEmployeeById: (id) => get().employees.find((e) => e.id === id),

  getSchedulesByDate: (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return get().schedules.filter(
      (s) => s.scheduledTime.split('T')[0] === dateStr
    );
  },

  getSchedulesByFurnace: (furnaceId) =>
    get().schedules.filter((s) => s.furnaceId === furnaceId),

  getMonitorDataByFurnace: (furnaceId) =>
    get()
      .monitorData.filter((m) => m.furnaceId === furnaceId)
      .sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),

  refreshDashboardStats: () => set({ dashboardStats: calculateDashboardStats() }),
}));
