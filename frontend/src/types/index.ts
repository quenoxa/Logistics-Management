export type UserRole = 'ADMIN' | 'DISPATCHER' | 'FLEET_MANAGER' | 'DRIVER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: string;
  createdAt?: string;
}

export type VehicleStatus = 'ACTIVE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'IDLE' | 'OUT_OF_SERVICE';
export type VehicleType = 'BOX_TRUCK' | 'SPRINTER_VAN' | 'SEMI_TRAILER' | 'EV_VAN' | 'REEFER_TRUCK';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  description: string;
  cost: number;
  odometerKm: number;
  serviceDate: string;
  performedBy: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Vehicle {
  id: string;
  code: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: VehicleType;
  status: VehicleStatus;
  maxPayloadKg: number;
  maxVolumeM3: number;
  fuelType: 'DIESEL' | 'ELECTRIC' | 'GASOLINE' | 'HYBRID';
  currentFuelPercent: number;
  currentMileageKm: number;
  currentLat?: number;
  currentLng?: number;
  lastServiceDate?: string;
  nextServiceDueKm?: number;
  assignedDriverId?: string | null;
  assignedDriver?: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
  } | null;
  maintenanceLogs?: MaintenanceLog[];
  _count?: {
    maintenanceLogs?: number;
    deliveries?: number;
  };
  notes?: string;
}

export type DriverStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'OFF_DUTY' | 'ON_LEAVE';

export interface Driver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseClass: 'CDL_A' | 'CDL_B' | 'STANDARD' | 'HAZMAT_CERTIFIED';
  licenseExpiry: string;
  status: DriverStatus;
  rating: number;
  totalDeliveries: number;
  onTimeRatePercent: number;
  emergencyContact?: string;
  currentVehicle?: {
    id: string;
    code: string;
    make: string;
    model: string;
    type: string;
    status: string;
  } | null;
  _count?: {
    deliveries?: number;
  };
}

export type CargoType = 'GENERAL_FREIGHT' | 'PERISHABLE' | 'HAZMAT' | 'FRAGILE' | 'COLD_CHAIN' | 'HIGH_VALUE';
export type PriorityLevel = 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT';
export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  weightKg: number;
  volumeM3: number;
  cargoType: CargoType;
  priority: PriorityLevel;
  status: OrderStatus;
  deliveryFee: number;
  notes?: string;
  createdAt: string;
  delivery?: {
    id: string;
    trackingNumber: string;
    status: string;
    driver?: { id: string; code: string; firstName: string; lastName: string };
    vehicle?: { id: string; code: string; licensePlate: string };
  };
}

export type DeliveryStatus =
  | 'DRAFT'
  | 'DISPATCHED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELAYED'
  | 'FAILED'
  | 'CANCELLED';

export interface DeliveryTimelineEvent {
  id: string;
  deliveryId: string;
  status: string;
  title: string;
  description: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  recordedAt: string;
  recordedBy?: string;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  orderId: string;
  driverId: string;
  vehicleId: string;
  status: DeliveryStatus;
  priority: PriorityLevel;
  pickupScheduledAt: string;
  pickupActualAt?: string;
  deliveryEstimatedAt: string;
  deliveryActualAt?: string;
  currentLat?: number;
  currentLng?: number;
  progressPercent: number;
  routeDistanceKm: number;
  routeDurationMin: number;
  recipientSignature?: string;
  delayReason?: string;
  notes?: string;
  createdAt: string;
  order: Order;
  driver: Driver;
  vehicle: Vehicle;
  timelineEvents?: DeliveryTimelineEvent[];
  telemetry?: {
    speedKmH: number;
    headingDeg: number;
    engineTempC: number;
    batteryOrFuelPercent: number;
    cargoTempC: number;
    signalStrength: string;
    etaMinutesRemaining: number;
  };
}

export interface DashboardKPIs {
  activeDeliveries: number;
  completedDeliveries: number;
  delayedDeliveries: number;
  totalDeliveries: number;
  pendingOrders: number;
  fleet: {
    total: number;
    active: number;
    maintenance: number;
    idle: number;
    utilizationPercent: number;
  };
  drivers: {
    total: number;
    available: number;
    onDelivery: number;
    offDuty: number;
  };
  onTimeRatePercent: number;
  totalDistanceKm: number;
  totalRevenueUsd: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  updatedAt: string;
}
