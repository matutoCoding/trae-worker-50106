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
import { addDays, addHours, addMinutes, format, startOfDay, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const furnaces: Furnace[] = [
  {
    id: 'f1',
    name: '1号火化炉',
    model: 'THG-2000',
    manufacturer: '天鸿环保设备有限公司',
    installDate: '2022-03-15',
    maxTemperature: 1200,
    status: 'running',
    currentTemperature: 850,
    runningHours: 8650,
    lastMaintenanceDate: '2026-05-10',
  },
  {
    id: 'f2',
    name: '2号火化炉',
    model: 'THG-2000',
    manufacturer: '天鸿环保设备有限公司',
    installDate: '2022-03-15',
    maxTemperature: 1200,
    status: 'running',
    currentTemperature: 920,
    runningHours: 8420,
    lastMaintenanceDate: '2026-05-12',
  },
  {
    id: 'f3',
    name: '3号火化炉',
    model: 'THG-2500',
    manufacturer: '天鸿环保设备有限公司',
    installDate: '2023-06-20',
    maxTemperature: 1300,
    status: 'idle',
    currentTemperature: 45,
    runningHours: 5230,
    lastMaintenanceDate: '2026-06-01',
  },
  {
    id: 'f4',
    name: '4号火化炉',
    model: 'THG-2500',
    manufacturer: '天鸿环保设备有限公司',
    installDate: '2023-06-20',
    maxTemperature: 1300,
    status: 'maintenance',
    currentTemperature: 35,
    runningHours: 5180,
    lastMaintenanceDate: '2026-06-15',
  },
  {
    id: 'f5',
    name: '5号火化炉',
    model: 'THG-1800',
    manufacturer: '永安环保科技',
    installDate: '2021-11-08',
    maxTemperature: 1150,
    status: 'fault',
    currentTemperature: 38,
    runningHours: 12560,
    lastMaintenanceDate: '2026-04-20',
  },
];

export const employees: Employee[] = [
  { id: 'e1', name: '张建国', role: 'director', phone: '13800138001', status: 'active' },
  { id: 'e2', name: '李明华', role: 'operator', phone: '13800138002', status: 'active' },
  { id: 'e3', name: '王志强', role: 'operator', phone: '13800138003', status: 'active' },
  { id: 'e4', name: '赵德胜', role: 'operator', phone: '13800138004', status: 'active' },
  { id: 'e5', name: '刘维修', role: 'maintenance', phone: '13800138005', status: 'active' },
  { id: 'e6', name: '陈环保', role: 'environmental', phone: '13800138006', status: 'active' },
  { id: 'e7', name: '孙管理员', role: 'admin', phone: '13800138007', status: 'active' },
];

const deceasedNames = [
  '张某某', '李某某', '王某某', '赵某某', '刘某某', '陈某某', '杨某某', '黄某某',
  '周某某', '吴某某', '郑某某', '孙某某', '马某某', '朱某某', '胡某某', '郭某某',
];

const generateSchedules = (): CremationSchedule[] => {
  const schedules: CremationSchedule[] = [];
  const today = new Date();
  
  for (let day = -15; day < 15; day++) {
    const date = addDays(startOfDay(today), day);
    const count = 5 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < count; i++) {
      const hour = 7 + i * 1.5;
      const scheduledTime = addHours(date, hour);
      const furnaceIndex = Math.floor(Math.random() * 3) + 1;
      const operatorIndex = Math.floor(Math.random() * 3) + 2;
      const estimatedDuration = 90 + Math.floor(Math.random() * 60);
      
      let status: CremationSchedule['status'];
      let startTime: Date | undefined;
      let endTime: Date | undefined;
      let actualDuration: number | undefined;
      
      if (day < 0 || (day === 0 && hour < new Date().getHours() - 2)) {
        status = 'completed';
        startTime = addMinutes(scheduledTime, Math.floor(Math.random() * 15));
        actualDuration = estimatedDuration + Math.floor(Math.random() * 30) - 10;
        endTime = addMinutes(startTime, actualDuration);
      } else if (day === 0 && hour < new Date().getHours() && hour >= new Date().getHours() - 2) {
        status = 'cremating';
        startTime = addMinutes(scheduledTime, Math.floor(Math.random() * 10));
      } else if (day === 0) {
        status = Math.random() > 0.7 ? 'preheating' : 'pending';
        if (status === 'preheating') {
          startTime = new Date();
        }
      } else {
        status = 'pending';
      }
      
      schedules.push({
        id: generateId(),
        deceasedName: deceasedNames[Math.floor(Math.random() * deceasedNames.length)],
        scheduledTime: scheduledTime.toISOString(),
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        furnaceId: `f${furnaceIndex}`,
        operatorId: `e${operatorIndex}`,
        status,
        estimatedDuration,
        actualDuration,
        remarks: Math.random() > 0.8 ? '特殊要求：需提前30分钟预热' : undefined,
      });
    }
  }
  
  return schedules;
};

export const schedules: CremationSchedule[] = generateSchedules();

const generateMonitorData = (): FurnaceMonitor[] => {
  const data: FurnaceMonitor[] = [];
  const now = new Date();
  
  furnaces.filter(f => f.status === 'running').forEach(furnace => {
    const totalMinutes = 24 * 60;
    const intervalMinutes = 5;
    const count = Math.floor(totalMinutes / intervalMinutes);
    
    for (let i = 0; i < count; i++) {
      const timestamp = addMinutes(now, -i * intervalMinutes);
      const baseTemp = furnace.id === 'f1' ? 850 : 920;
      const tempVariation = Math.sin(i / 12) * 40 + (Math.random() - 0.5) * 25;
      
      data.push({
        id: generateId(),
        furnaceId: furnace.id,
        timestamp: timestamp.toISOString(),
        temperature: Math.max(200, Math.min(1200, baseTemp + tempVariation)),
        pressure: 101.3 + Math.sin(i / 20) * 2 + (Math.random() - 0.5),
        oxygenLevel: 8 + Math.sin(i / 25) * 1.5 + (Math.random() - 0.5) * 0.5,
        status: 'running',
      });
    }
  });
  
  return data.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const monitorData: FurnaceMonitor[] = generateMonitorData();

const generateEnergyRecords = (): EnergyRecord[] => {
  const records: EnergyRecord[] = [];
  const today = new Date();
  
  for (let day = -90; day < 1; day++) {
    const recordDate = addDays(startOfDay(today), day);
    const dateStr = format(recordDate, 'yyyy-MM-dd');
    
    furnaces.filter(f => f.id !== 'f5').forEach(furnace => {
      const cremationsCount = 3 + Math.floor(Math.random() * 5);
      const durationMinutes = cremationsCount * (90 + Math.floor(Math.random() * 30));
      const fuelConsumption = durationMinutes * 0.08 + (Math.random() - 0.3) * 10;
      const electricityConsumption = durationMinutes * 0.15 + (Math.random() - 0.3) * 5;
      
      records.push({
        id: generateId(),
        furnaceId: furnace.id,
        recordDate: dateStr,
        fuelConsumption: Math.max(0, fuelConsumption),
        electricityConsumption: Math.max(0, electricityConsumption),
        durationMinutes,
        cost: fuelConsumption * 8 + electricityConsumption * 1.2,
      });
    });
  }
  
  return records;
};

export const energyRecords: EnergyRecord[] = generateEnergyRecords();

export const maintenanceOrders: MaintenanceOrder[] = [
  {
    id: 'm1',
    furnaceId: 'f4',
    type: 'preventive',
    description: '季度例行保养，更换耐火砖，清理烟道',
    reporterId: 'e1',
    reportTime: subDays(new Date(), 2).toISOString(),
    handlerId: 'e5',
    handleTime: new Date().toISOString(),
    status: 'in_progress',
    cost: 8500,
  },
  {
    id: 'm2',
    furnaceId: 'f5',
    type: 'repair',
    description: '燃烧器故障，无法正常点火，需更换点火电极',
    reporterId: 'e2',
    reportTime: subDays(new Date(), 5).toISOString(),
    handlerId: 'e5',
    status: 'pending',
  },
  {
    id: 'm3',
    furnaceId: 'f1',
    type: 'inspection',
    description: '月度安全检查，检测炉膛密封性和温度传感器',
    reporterId: 'e1',
    reportTime: subDays(new Date(), 10).toISOString(),
    handlerId: 'e5',
    handleTime: subDays(new Date(), 8).toISOString(),
    status: 'completed',
    result: '设备运行正常，各项指标符合要求',
    cost: 0,
  },
  {
    id: 'm4',
    furnaceId: 'f2',
    type: 'repair',
    description: '尾气处理装置异常，净化效率下降',
    reporterId: 'e6',
    reportTime: subDays(new Date(), 12).toISOString(),
    handlerId: 'e5',
    handleTime: subDays(new Date(), 10).toISOString(),
    status: 'completed',
    result: '更换过滤器滤芯，已恢复正常',
    cost: 3200,
  },
  {
    id: 'm5',
    furnaceId: 'f3',
    type: 'preventive',
    description: '更换热电偶，校准温度控制系统',
    reporterId: 'e1',
    reportTime: subDays(new Date(), 20).toISOString(),
    handlerId: 'e5',
    handleTime: subDays(new Date(), 18).toISOString(),
    status: 'completed',
    result: '热电偶已更换，温度偏差控制在±5℃以内',
    cost: 2800,
  },
];

export const sparePartUsages: SparePartUsage[] = [
  {
    id: 'sp1',
    maintenanceId: 'm4',
    furnaceId: 'f2',
    partName: '高效过滤器滤芯',
    partModel: 'H13-800',
    quantity: 2,
    replaceDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    operator: '刘维修',
  },
  {
    id: 'sp2',
    maintenanceId: 'm5',
    furnaceId: 'f3',
    partName: '耐高温热电偶',
    partModel: 'WRN-1300',
    quantity: 4,
    replaceDate: format(subDays(new Date(), 18), 'yyyy-MM-dd'),
    operator: '刘维修',
  },
  {
    id: 'sp3',
    maintenanceId: 'm3',
    furnaceId: 'f1',
    partName: '温度传感器密封圈',
    partModel: 'GF-25',
    quantity: 8,
    replaceDate: format(subDays(new Date(), 8), 'yyyy-MM-dd'),
    operator: '刘维修',
  },
  {
    id: 'sp4',
    maintenanceId: 'm1',
    furnaceId: 'f4',
    partName: '高铝耐火砖',
    partModel: 'LZ-75',
    quantity: 50,
    replaceDate: format(new Date(), 'yyyy-MM-dd'),
    operator: '刘维修',
  },
  {
    id: 'sp5',
    maintenanceId: 'm1',
    furnaceId: 'f4',
    partName: '耐火泥',
    partModel: 'NN-1',
    quantity: 10,
    replaceDate: format(new Date(), 'yyyy-MM-dd'),
    operator: '刘维修',
  },
];

export const ashHandovers: AshHandover[] = schedules
  .filter(s => s.status === 'completed' || s.status === 'cremating')
  .slice(-30)
  .map((s, index) => {
    const isCompleted = s.status === 'completed';
    return {
      id: generateId(),
      scheduleId: s.id,
      collectTime: isCompleted ? s.endTime : undefined,
      collector: isCompleted ? employees[1].name : undefined,
      familyMember: `${s.deceasedName.replace('某某', '')}家属`,
      handoverTime: isCompleted ? addMinutes(new Date(s.endTime!), 30).toISOString() : undefined,
      handoverPerson: isCompleted ? employees[1].name : undefined,
      confirmationStatus: isCompleted ? (index % 5 === 0 ? 'handover' : 'confirmed') : 'pending',
      remarks: Math.random() > 0.7 ? '家属要求分盒装殓' : undefined,
    };
  });

const generateEnvironmentData = (): EnvironmentMonitor[] => {
  const data: EnvironmentMonitor[] = [];
  const now = new Date();
  
  for (let hour = 0; hour < 720; hour++) {
    const timestamp = addHours(now, -hour);
    
    furnaces.filter(f => f.id !== 'f5').forEach(furnace => {
      const isWorkingHour = timestamp.getHours() >= 7 && timestamp.getHours() <= 20;
      const baseMultiplier = isWorkingHour ? 1 : 0.3;
      
      const smokeDensity = (15 + Math.random() * 25) * baseMultiplier;
      const sulfurDioxide = (50 + Math.random() * 100) * baseMultiplier;
      const nitrogenOxide = (80 + Math.random() * 120) * baseMultiplier;
      const particulateMatter = (10 + Math.random() * 20) * baseMultiplier;
      
      let complianceStatus: 'compliant' | 'non_compliant' | 'warning' = 'compliant';
      if (smokeDensity > 50 || sulfurDioxide > 200 || nitrogenOxide > 250 || particulateMatter > 40) {
        complianceStatus = 'non_compliant';
      } else if (smokeDensity > 40 || sulfurDioxide > 150 || nitrogenOxide > 200 || particulateMatter > 30) {
        complianceStatus = 'warning';
      }
      
      data.push({
        id: generateId(),
        furnaceId: furnace.id,
        timestamp: timestamp.toISOString(),
        smokeDensity: Math.round(smokeDensity * 10) / 10,
        sulfurDioxide: Math.round(sulfurDioxide * 10) / 10,
        nitrogenOxide: Math.round(nitrogenOxide * 10) / 10,
        particulateMatter: Math.round(particulateMatter * 10) / 10,
        complianceStatus,
      });
    });
  }
  
  return data;
};

export const environmentData: EnvironmentMonitor[] = generateEnvironmentData();

export const calculateDashboardStats = (): DashboardStats => {
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
    new Date(e.timestamp) > addHours(new Date(), -24)
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

export const dashboardStats: DashboardStats = calculateDashboardStats();

export const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: '待开始', className: 'bg-gray-100 text-gray-800' },
  preheating: { label: '预热中', className: 'bg-yellow-100 text-yellow-800' },
  cremating: { label: '火化中', className: 'bg-orange-100 text-orange-800' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-800' },
  running: { label: '运行中', className: 'bg-green-100 text-green-800' },
  idle: { label: '空闲', className: 'bg-gray-100 text-gray-800' },
  maintenance: { label: '维护中', className: 'bg-blue-100 text-blue-800' },
  fault: { label: '故障', className: 'bg-red-100 text-red-800' },
  repair: { label: '故障维修', className: 'bg-red-100 text-red-800' },
  preventive: { label: '预防性保养', className: 'bg-blue-100 text-blue-800' },
  inspection: { label: '检查', className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: '处理中', className: 'bg-yellow-100 text-yellow-800' },
  compliant: { label: '达标', className: 'bg-green-100 text-green-800' },
  non_compliant: { label: '超标', className: 'bg-red-100 text-red-800' },
  warning: { label: '预警', className: 'bg-yellow-100 text-yellow-800' },
  collected: { label: '已收殓', className: 'bg-blue-100 text-blue-800' },
  handover: { label: '待确认', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', className: 'bg-green-100 text-green-800' },
};

export const employeeRoleLabels: Record<string, string> = {
  admin: '系统管理员',
  director: '车间主任',
  operator: '操作工',
  maintenance: '设备维护员',
  environmental: '环保管理员',
};

export const formatDateTime = (date: string | Date) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'yyyy-MM-dd', { locale: zhCN });
};

export const formatTime = (date: string | Date) => {
  return format(new Date(date), 'HH:mm', { locale: zhCN });
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};
