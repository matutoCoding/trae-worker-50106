export type ScheduleStatus = 'pending' | 'preheating' | 'cremating' | 'completed' | 'cancelled';
export type FurnaceStatus = 'running' | 'idle' | 'maintenance' | 'fault';
export type MaintenanceType = 'repair' | 'preventive' | 'inspection';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'warning';
export type HandoverStatus = 'pending' | 'collected' | 'handover' | 'confirmed';
export type EmployeeRole = 'admin' | 'director' | 'operator' | 'maintenance' | 'environmental';

export interface Furnace {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  installDate: string;
  maxTemperature: number;
  status: FurnaceStatus;
  currentTemperature?: number;
  runningHours: number;
  lastMaintenanceDate?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface CremationSchedule {
  id: string;
  deceasedName: string;
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  furnaceId: string;
  operatorId: string;
  status: ScheduleStatus;
  remarks?: string;
  estimatedDuration: number;
  actualDuration?: number;
}

export interface FurnaceMonitor {
  id: string;
  scheduleId?: string;
  furnaceId: string;
  timestamp: string;
  temperature: number;
  pressure: number;
  oxygenLevel: number;
  status: FurnaceStatus;
}

export interface EnergyRecord {
  id: string;
  scheduleId?: string;
  furnaceId: string;
  recordDate: string;
  fuelConsumption: number;
  electricityConsumption: number;
  durationMinutes: number;
  cost: number;
}

export interface MaintenanceOrder {
  id: string;
  furnaceId: string;
  type: MaintenanceType;
  description: string;
  reporterId: string;
  reportTime: string;
  handlerId?: string;
  handleTime?: string;
  status: MaintenanceStatus;
  result?: string;
  cost?: number;
}

export interface SparePartUsage {
  id: string;
  maintenanceId: string;
  furnaceId: string;
  partName: string;
  partModel: string;
  quantity: number;
  replaceDate: string;
  operator: string;
}

export interface AshHandover {
  id: string;
  scheduleId: string;
  collectTime?: string;
  collector?: string;
  familyMember: string;
  handoverTime?: string;
  handoverPerson?: string;
  confirmationStatus: HandoverStatus;
  remarks?: string;
}

export interface EnvironmentMonitor {
  id: string;
  furnaceId: string;
  timestamp: string;
  smokeDensity: number;
  sulfurDioxide: number;
  nitrogenOxide: number;
  particulateMatter: number;
  complianceStatus: ComplianceStatus;
}

export interface DashboardStats {
  todayCremations: number;
  inProgressCount: number;
  pendingCount: number;
  completedCount: number;
  totalFuelToday: number;
  totalElectricityToday: number;
  totalCostToday: number;
  avgDurationToday: number;
  furnacesRunning: number;
  furnacesIdle: number;
  furnacesMaintenance: number;
  furnacesFault: number;
  complianceRate: number;
  pendingMaintenance: number;
  pendingHandover: number;
}
