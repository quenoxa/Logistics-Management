import axios from 'axios';
import {
  User,
  Vehicle,
  Driver,
  Order,
  Delivery,
  DashboardKPIs,
  AuditLog,
  SystemSetting,
  MaintenanceLog,
} from '../types';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  demoLogin: async (role: string) => {
    const res = await apiClient.post<{ token: string; user: User }>('/auth/demo-login', { role });
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post<{ success: boolean }>('/auth/logout');
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
};

// Vehicles API
export const vehiclesApi = {
  getAll: async (params?: { status?: string; type?: string; search?: string; sort?: string; order?: string }) => {
    const res = await apiClient.get<{ vehicles: Vehicle[] }>('/vehicles', { params });
    return res.data.vehicles;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ vehicle: Vehicle }>(`/vehicles/${id}`);
    return res.data.vehicle;
  },
  create: async (data: Partial<Vehicle>) => {
    const res = await apiClient.post<{ vehicle: Vehicle }>('/vehicles', data);
    return res.data.vehicle;
  },
  update: async (id: string, data: Partial<Vehicle>) => {
    const res = await apiClient.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, data);
    return res.data.vehicle;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, { status });
    return res.data.vehicle;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/vehicles/${id}`);
    return res.data;
  },
  addMaintenanceLog: async (vehicleId: string, data: Partial<MaintenanceLog>) => {
    const res = await apiClient.post<{ log: MaintenanceLog }>(`/vehicles/${vehicleId}/maintenance`, data);
    return res.data.log;
  },
  updateMaintenanceLog: async (logId: string, data: Partial<MaintenanceLog>) => {
    const res = await apiClient.put<{ log: MaintenanceLog }>(`/vehicles/maintenance/${logId}`, data);
    return res.data.log;
  },
};

// Drivers API
export const driversApi = {
  getAll: async (params?: { status?: string; licenseClass?: string; search?: string; sort?: string; order?: string }) => {
    const res = await apiClient.get<{ drivers: Driver[] }>('/drivers', { params });
    return res.data.drivers;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ driver: Driver }>(`/drivers/${id}`);
    return res.data.driver;
  },
  create: async (data: Partial<Driver>) => {
    const res = await apiClient.post<{ driver: Driver }>('/drivers', data);
    return res.data.driver;
  },
  update: async (id: string, data: Partial<Driver>) => {
    const res = await apiClient.put<{ driver: Driver }>(`/drivers/${id}`, data);
    return res.data.driver;
  },
  toggleStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<{ driver: Driver }>(`/drivers/${id}/status`, { status });
    return res.data.driver;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<{ driver: Driver }>(`/drivers/${id}/status`, { status });
    return res.data.driver;
  },
  updateLocation: async (id: string, coords: { latitude: number; longitude: number }) => {
    const res = await apiClient.patch<{ success: boolean; data: Driver }>(`/drivers/${id}/location`, coords);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/drivers/${id}`);
    return res.data;
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: { status?: string; priority?: string; cargoType?: string; search?: string; sort?: string; order?: string }) => {
    const res = await apiClient.get<{ orders: Order[] }>('/orders', { params });
    return res.data.orders;
  },
  getUnassigned: async () => {
    const res = await apiClient.get<{ orders: Order[] }>('/orders/unassigned');
    return res.data.orders;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ order: Order }>(`/orders/${id}`);
    return res.data.order;
  },
  create: async (data: Partial<Order>) => {
    const res = await apiClient.post<{ order: Order }>('/orders', data);
    return res.data.order;
  },
  update: async (id: string, data: Partial<Order>) => {
    const res = await apiClient.put<{ order: Order }>(`/orders/${id}`, data);
    return res.data.order;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/orders/${id}`);
    return res.data;
  },
};

// Deliveries API
export const deliveriesApi = {
  getAll: async (params?: { status?: string; priority?: string; driverId?: string; vehicleId?: string; search?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{ success?: boolean; deliveries: Delivery[]; total?: number }>('/deliveries', { params });
    return res.data.deliveries;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ success?: boolean; delivery: Delivery }>(`/deliveries/${id}`);
    return res.data.delivery;
  },
  getDriverCurrent: async () => {
    const res = await apiClient.get<{ driver: Driver; delivery: Delivery | null }>('/deliveries/driver/current');
    return res.data;
  },
  getDriverHistory: async () => {
    const res = await apiClient.get<{ history: Delivery[] }>('/deliveries/driver/history');
    return res.data;
  },
  create: async (data: Partial<Delivery>) => {
    const res = await apiClient.post<{ success?: boolean; delivery: Delivery }>('/deliveries', data);
    return res.data.delivery;
  },
  update: async (id: string, data: Partial<Delivery>) => {
    const res = await apiClient.put<{ success?: boolean; delivery: Delivery }>(`/deliveries/${id}`, data);
    return res.data.delivery;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/deliveries/${id}`);
    return res.data;
  },
  assignDriver: async (id: string, driverId: string) => {
    const res = await apiClient.post<{ success?: boolean; delivery: Delivery }>(`/deliveries/${id}/assign-driver`, { driverId });
    return res.data.delivery;
  },
  assignVehicle: async (id: string, vehicleId: string) => {
    const res = await apiClient.post<{ success?: boolean; delivery: Delivery }>(`/deliveries/${id}/assign-vehicle`, { vehicleId });
    return res.data.delivery;
  },
  transitionStatus: async (
    id: string,
    data: {
      status?: string;
      nextStatus?: string;
      notes?: string;
      note?: string;
      recipientSignature?: string;
      delayReason?: string;
      currentLat?: number;
      currentLng?: number;
      latitude?: number;
      longitude?: number;
      locationName?: string;
    }
  ) => {
    const targetStatus = data.status || data.nextStatus;
    const res = await apiClient.patch<{ success?: boolean; delivery: Delivery }>(`/deliveries/${id}/status`, {
      status: targetStatus,
      note: data.notes || data.note,
      recipientSignature: data.recipientSignature,
      delayReason: data.delayReason,
      latitude: data.currentLat || data.latitude,
      longitude: data.currentLng || data.longitude,
    });
    return res.data.delivery;
  },
  getHistory: async (id: string) => {
    const res = await apiClient.get<{ success?: boolean; history: any[] }>(`/deliveries/${id}/history`);
    return res.data.history;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const res = await apiClient.get<{ success: boolean; stats: any }>('/dashboard/stats');
    return res.data.stats;
  },
  getDeliveryTrends: async () => {
    const res = await apiClient.get<{ success: boolean; deliveryTrends: any }>('/dashboard/delivery-trends');
    return res.data.deliveryTrends;
  },
  getDriverPerformance: async () => {
    const res = await apiClient.get<{ success: boolean; driverPerformance: any[] }>('/dashboard/driver-performance');
    return res.data.driverPerformance;
  },
  getVehicleUtilization: async () => {
    const res = await apiClient.get<{ success: boolean; vehicleUtilization: any }>('/dashboard/vehicle-utilization');
    return res.data.vehicleUtilization;
  },
};

// Maintenance API
export const maintenanceApi = {
  getAll: async (params?: { vehicleId?: string; status?: string; search?: string }) => {
    const res = await apiClient.get<{ success: boolean; records: any[] }>('/maintenance', { params });
    return res.data.records;
  },
  create: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; record: any }>('/maintenance', data);
    return res.data.record;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.put<{ success: boolean; record: any }>(`/maintenance/${id}`, data);
    return res.data.record;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/maintenance/${id}`);
    return res.data;
  },
};

// Issues API
export const issuesApi = {
  getAll: async (params?: { status?: string; priority?: string; deliveryId?: string; driverId?: string }) => {
    const res = await apiClient.get<{ success: boolean; issues: any[] }>('/issues', { params });
    return res.data.issues;
  },
  create: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; issue: any }>('/issues', data);
    return res.data.issue;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch<{ success: boolean; issue: any }>(`/issues/${id}`, data);
    return res.data.issue;
  },
  resolve: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; issue: any }>(`/issues/${id}/resolve`);
    return res.data.issue;
  },
};

// Tracking API
export const trackingApi = {
  getActive: async () => {
    const res = await apiClient.get<{ activeDeliveries: Delivery[] }>('/tracking/active');
    return res.data.activeDeliveries;
  },
  getRoute: async (id: string) => {
    const res = await apiClient.get<{
      delivery: Delivery;
      route: {
        origin: { lat: number; lng: number; address: string };
        destination: { lat: number; lng: number; address: string };
        currentPosition: { lat: number; lng: number };
        waypoints: [number, number][];
        distanceKm: number;
        durationMin: number;
        etaMinutesRemaining: number;
      };
      telemetry: any;
    }>(`/tracking/${id}/route`);
    return res.data;
  },
  simulateStep: async (id: string, stepDeltaPercent: number = 5) => {
    const res = await apiClient.post<{ delivery: Delivery }>(`/tracking/${id}/simulate-step`, { stepDeltaPercent });
    return res.data.delivery;
  },
  simulateAll: async () => {
    const res = await apiClient.post<{ updatedCount: number; deliveries: Delivery[] }>('/tracking/simulate-all');
    return res.data;
  },
};

// Reports API
export const reportsApi = {
  getKPIs: async () => {
    const res = await apiClient.get<{ kpis: DashboardKPIs }>('/reports/kpis');
    return res.data.kpis;
  },
  getVolumeTrend: async () => {
    const res = await apiClient.get<{ trend: { date: string; completed: number; delayed: number; dispatched: number }[] }>('/reports/volume-trend');
    return res.data.trend;
  },
  getDriverLeaderboard: async () => {
    const res = await apiClient.get<{ leaderboard: any[] }>('/reports/driver-performance');
    return res.data.leaderboard;
  },
  getFleetUtilization: async () => {
    const res = await apiClient.get<{ summaryByType: any[]; vehiclesCount: number }>('/reports/fleet-utilization');
    return res.data;
  },
  getDelaysBreakdown: async () => {
    const res = await apiClient.get<{ delaysList: any[]; chartData: { reason: string; count: number }[] }>('/reports/delays-breakdown');
    return res.data;
  },
};

// Settings API
export const settingsApi = {
  getAll: async () => {
    const res = await apiClient.get<{ settings: SystemSetting[] }>('/settings');
    return res.data.settings;
  },
  update: async (key: string, value: string) => {
    const res = await apiClient.put<{ setting: SystemSetting }>(`/settings/${key}`, { value });
    return res.data.setting;
  },
  bulkUpdate: async (settings: { key: string; value: string }[]) => {
    const res = await apiClient.post('/settings/bulk', { settings });
    return res.data;
  },
};

// Admin API
export const adminApi = {
  getUsers: async () => {
    const res = await apiClient.get<{ users: User[] }>('/admin/users');
    return res.data.users;
  },
  createUser: async (data: Partial<User> & { password?: string }) => {
    const res = await apiClient.post<{ user: User }>('/admin/users', data);
    return res.data.user;
  },
  updateUser: async (id: string, data: Partial<User> & { password?: string }) => {
    const res = await apiClient.put<{ user: User }>(`/admin/users/${id}`, data);
    return res.data.user;
  },
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },
  getAuditLogs: async (params?: { action?: string; entityType?: string; search?: string }) => {
    const res = await apiClient.get<{ auditLogs: AuditLog[] }>('/admin/audit-logs', { params });
    return res.data.auditLogs;
  },
  getSystemHealth: async () => {
    const res = await apiClient.get<{ health: any }>('/admin/system-health');
    return res.data.health;
  },
};
