import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Logistics Management System Database Seeding...');

  // 1. Clean existing records
  await prisma.issue.deleteMany({});
  await prisma.deliveryStatusHistory.deleteMany({});
  await prisma.deliveryTimelineEvent.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 2. Create Passwords
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const dispatchPassword = await bcrypt.hash('dispatch123', 10);
  const opsPassword = await bcrypt.hash('ops123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);

  // Requirement accounts (Prompt Section 5)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: defaultPassword,
      name: 'System Admin',
      role: 'ADMIN',
      phone: '+1-555-0101',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  const dispatcherUser = await prisma.user.create({
    data: {
      email: 'dispatcher@example.com',
      password: defaultPassword,
      name: 'Priya Dispatcher',
      role: 'DISPATCHER',
      phone: '+1-555-0102',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@example.com',
      password: defaultPassword,
      name: 'Vikram Driver',
      role: 'DRIVER',
      phone: '+1-555-0103',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  // Explicit Driver Login Accounts (Option A - Driver 1 to 5)
  const driverUser1 = await prisma.user.create({
    data: { email: 'driver1@example.com', password: defaultPassword, name: 'Vikram Driver', role: 'DRIVER', phone: '+1-555-0103', isActive: true },
  });
  const driverUser2 = await prisma.user.create({
    data: { email: 'driver2@example.com', password: defaultPassword, name: 'Ramesh Gurjar', role: 'DRIVER', phone: '+1-555-0105', isActive: true },
  });
  const driverUser3 = await prisma.user.create({
    data: { email: 'driver3@example.com', password: defaultPassword, name: 'Suresh Kumar', role: 'DRIVER', phone: '+1-555-0106', isActive: true },
  });
  const driverUser4 = await prisma.user.create({
    data: { email: 'driver4@example.com', password: defaultPassword, name: 'Manoj Yadav', role: 'DRIVER', phone: '+1-555-0107', isActive: true },
  });
  const driverUser5 = await prisma.user.create({
    data: { email: 'driver5@example.com', password: defaultPassword, name: 'Amit Patel', role: 'DRIVER', phone: '+1-555-0108', isActive: true },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      password: defaultPassword,
      name: 'Sarah Viewer',
      role: 'VIEWER',
      phone: '+1-555-0104',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      isActive: true,
      status: 'ACTIVE',
    },
  });

  // Fleetops accounts for integration tests
  const fleetopsAdmin = await prisma.user.create({
    data: {
      email: 'admin@fleetops.io',
      password: adminPassword,
      name: 'Rajesh Sharma',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const fleetopsDispatcher = await prisma.user.create({
    data: {
      email: 'dispatcher@fleetops.io',
      password: dispatchPassword,
      name: 'Priya Nair',
      role: 'DISPATCHER',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const fleetopsOps = await prisma.user.create({
    data: {
      email: 'ops@fleetops.io',
      password: opsPassword,
      name: 'Anand Verma',
      role: 'DISPATCHER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const fleetopsDriver = await prisma.user.create({
    data: {
      email: 'driver@fleetops.io',
      password: driverPassword,
      name: 'Vikram Singh',
      role: 'DRIVER',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  console.log('👤 Created User accounts (including driver1-driver5@example.com).');

  const driverUser7 = await prisma.user.create({
    data: { email: 'pradeep.n@example.com', password: defaultPassword, name: 'Pradeep Nayak', role: 'DRIVER', phone: '+1-555-0110', isActive: true },
  });
  const driverUser8 = await prisma.user.create({
    data: { email: 'gurpreet.s@example.com', password: defaultPassword, name: 'Gurpreet Singh', role: 'DRIVER', phone: '+1-555-0111', isActive: true },
  });
  const driverUser9 = await prisma.user.create({
    data: { email: 'deepak.p@example.com', password: defaultPassword, name: 'Deepak Patil', role: 'DRIVER', phone: '+1-555-0112', isActive: true },
  });
  const driverUser10 = await prisma.user.create({
    data: { email: 'kavita.s@example.com', password: defaultPassword, name: 'Kavita Sharma', role: 'DRIVER', phone: '+1-555-0113', isActive: true },
  });

  const driverUser11 = await prisma.user.create({
    data: { email: 'driver11@example.com', password: defaultPassword, name: 'Sanjay Dutt', role: 'DRIVER', phone: '+1-555-0114', isActive: true },
  });
  const driverUser12 = await prisma.user.create({
    data: { email: 'driver12@example.com', password: defaultPassword, name: 'Tarun Mehta', role: 'DRIVER', phone: '+1-555-0115', isActive: true },
  });

  // 3. Create 12 Drivers with linked User accounts
  const driverData = [
    { userId: driverUser1.id, code: 'DRV-101', firstName: 'Vikram', lastName: 'Driver', email: 'driver1@example.com', phone: '+1-555-0103', licenseNumber: 'DL-MH-2022-0091234', licenseClass: 'CDL_A', licenseExpiry: new Date('2028-11-15'), status: 'ON_DELIVERY', currentLatitude: 19.1136, currentLongitude: 73.0112, rating: 4.95, totalDeliveries: 412 },
    { userId: driverUser2.id, code: 'DRV-102', firstName: 'Ramesh', lastName: 'Gurjar', email: 'driver2@example.com', phone: '+1-555-0105', licenseNumber: 'DL-GJ-2021-0033201', licenseClass: 'CDL_A', licenseExpiry: new Date('2027-08-20'), status: 'ON_DELIVERY', currentLatitude: 18.9712, currentLongitude: 73.0245, rating: 4.88, totalDeliveries: 320 },
    { userId: driverUser3.id, code: 'DRV-103', firstName: 'Suresh', lastName: 'Kumar', email: 'driver3@example.com', phone: '+1-555-0106', licenseNumber: 'DL-KA-2020-0088410', licenseClass: 'CDL_A', licenseExpiry: new Date('2029-01-10'), status: 'ON_DELIVERY', currentLatitude: 19.2183, currentLongitude: 72.9781, rating: 4.98, totalDeliveries: 540 },
    { userId: driverUser4.id, code: 'DRV-104', firstName: 'Manoj', lastName: 'Yadav', email: 'driver4@example.com', phone: '+1-555-0107', licenseNumber: 'DL-DL-2021-0010928', licenseClass: 'CDL_B', licenseExpiry: new Date('2027-04-12'), status: 'ON_DELIVERY', currentLatitude: 19.0350, currentLongitude: 73.0320, rating: 4.82, totalDeliveries: 280 },
    { userId: driverUser5.id, code: 'DRV-105', firstName: 'Amit', lastName: 'Patel', email: 'driver5@example.com', phone: '+1-555-0108', licenseNumber: 'DL-TN-2019-0067290', licenseClass: 'CDL_B', licenseExpiry: new Date('2028-09-30'), status: 'AVAILABLE', currentLatitude: 19.2967, currentLongitude: 73.0631, rating: 4.92, totalDeliveries: 195 },
    { userId: fleetopsDriver.id, code: 'DRV-106', firstName: 'Vikram', lastName: 'Singh', email: 'driver@fleetops.io', phone: '+91 98200 12345', licenseNumber: 'DL-MH-2022-0091235', licenseClass: 'CDL_A', licenseExpiry: new Date('2028-11-15'), status: 'AVAILABLE', currentLatitude: 18.9712, currentLongitude: 73.0245, rating: 4.88, totalDeliveries: 320 },
    { userId: driverUser7.id, code: 'DRV-107', firstName: 'Pradeep', lastName: 'Nayak', email: 'pradeep.n@example.com', phone: '+1-555-0110', licenseNumber: 'DL-KA-2022-0044810', licenseClass: 'CDL_A', licenseExpiry: new Date('2029-06-18'), status: 'AVAILABLE', rating: 4.96, totalDeliveries: 380 },
    { userId: driverUser8.id, code: 'DRV-108', firstName: 'Gurpreet', lastName: 'Singh', email: 'gurpreet.s@example.com', phone: '+1-555-0111', licenseNumber: 'DL-PB-2020-0077291', licenseClass: 'CDL_B', licenseExpiry: new Date('2028-03-22'), status: 'OFF_DUTY', rating: 4.85, totalDeliveries: 210 },
    { userId: driverUser9.id, code: 'DRV-109', firstName: 'Deepak', lastName: 'Patil', email: 'deepak.p@example.com', phone: '+1-555-0112', licenseNumber: 'DL-MH-2021-0088192', licenseClass: 'CDL_A', licenseExpiry: new Date('2027-10-14'), status: 'OFF_DUTY', rating: 4.74, totalDeliveries: 175 },
    { userId: driverUser10.id, code: 'DRV-110', firstName: 'Kavita', lastName: 'Sharma', email: 'kavita.s@example.com', phone: '+1-555-0113', licenseNumber: 'DL-DL-2022-0022019', licenseClass: 'STANDARD', licenseExpiry: new Date('2028-07-08'), status: 'AVAILABLE', rating: 4.90, totalDeliveries: 110 },
    { userId: driverUser11.id, code: 'DRV-111', firstName: 'Sanjay', lastName: 'Dutt', email: 'driver11@example.com', phone: '+1-555-0114', licenseNumber: 'DL-DL-2022-0022020', licenseClass: 'CDL_A', licenseExpiry: new Date('2028-08-08'), status: 'AVAILABLE', rating: 4.91, totalDeliveries: 112 },
    { userId: driverUser12.id, code: 'DRV-112', firstName: 'Tarun', lastName: 'Mehta', email: 'driver12@example.com', phone: '+1-555-0115', licenseNumber: 'DL-DL-2022-0022021', licenseClass: 'CDL_B', licenseExpiry: new Date('2028-09-08'), status: 'AVAILABLE', rating: 4.89, totalDeliveries: 115 },
  ];

  const createdDrivers: any[] = [];
  for (const d of driverData) {
    const dataToCreate: any = { ...d };
    if (!dataToCreate.userId) delete dataToCreate.userId;
    const driver = await prisma.driver.create({ data: dataToCreate });
    createdDrivers.push(driver);
  }
  console.log(`🚚 Created ${createdDrivers.length} Drivers.`);

  // 4. Create 12 Vehicles
  const vehicleData = [
    { code: 'VEH-401', vehicleNumber: 'TRK-401', vin: 'MAT49201948KL0192', make: 'Tata Motors', manufacturer: 'Tata Motors', model: 'Prima 5530.S Tractor Trailer', year: 2023, licensePlate: 'MH-04-AB-4920', type: 'SEMI_TRAILER', status: 'IN_TRANSIT', capacity: 38000, maxPayloadKg: 38000, maxVolumeM3: 98.5, fuelType: 'DIESEL', currentFuelPercent: 82.5, currentMileageKm: 142850, mileage: 142850, currentLatitude: 19.1136, currentLongitude: 73.0112, lastMaintenanceDate: new Date('2026-06-15'), assignedDriverId: createdDrivers[0].id },
    { code: 'VEH-402', vehicleNumber: 'TRK-402', vin: 'MAL88120391NJ3891', make: 'Ashok Leyland', manufacturer: 'Ashok Leyland', model: 'AVTR 4220 HG 6x2 Multi-Axle', year: 2024, licensePlate: 'MH-46-CL-8812', type: 'SEMI_TRAILER', status: 'IN_TRANSIT', capacity: 32000, maxPayloadKg: 32000, maxVolumeM3: 102.0, fuelType: 'DIESEL', currentFuelPercent: 68.0, currentMileageKm: 88400, mileage: 88400, currentLatitude: 18.9712, currentLongitude: 73.0245, lastMaintenanceDate: new Date('2026-07-10'), assignedDriverId: createdDrivers[1].id },
    { code: 'VEH-403', vehicleNumber: 'TRK-403', vin: 'MBB74190283PA8102', make: 'BharatBenz', manufacturer: 'BharatBenz', model: '3528R Heavy Duty Hauler', year: 2023, licensePlate: 'DL-1A-AA-7419', type: 'SEMI_TRAILER', status: 'IN_TRANSIT', capacity: 28500, maxPayloadKg: 28500, maxVolumeM3: 95.0, fuelType: 'DIESEL', currentFuelPercent: 74.0, currentMileageKm: 119200, mileage: 119200, currentLatitude: 19.2183, currentLongitude: 72.9781, lastMaintenanceDate: new Date('2026-05-20'), assignedDriverId: createdDrivers[2].id },
    { code: 'VEH-404', vehicleNumber: 'REE-404', vin: 'MTS61029384NY9014', make: 'Tata Motors', manufacturer: 'Tata Motors', model: 'Signa 4825.TK Coldliner Reefer', year: 2024, licensePlate: 'GJ-06-TR-6102', type: 'REEFER_TRUCK', status: 'IN_TRANSIT', capacity: 24000, maxPayloadKg: 24000, maxVolumeM3: 88.0, fuelType: 'DIESEL', currentFuelPercent: 61.5, currentMileageKm: 64100, mileage: 64100, currentLatitude: 19.0760, currentLongitude: 72.8777, lastMaintenanceDate: new Date('2026-08-01'), assignedDriverId: createdDrivers[3].id },
    { code: 'EV-401', vehicleNumber: 'EV-401', vin: 'MMZ30219485NN3192', make: 'Mahindra', manufacturer: 'Mahindra', model: 'Zor Grand EV Express', year: 2024, licensePlate: 'KA-01-EV-3021', type: 'EV_VAN', status: 'AVAILABLE', capacity: 2200, maxPayloadKg: 2200, maxVolumeM3: 18.7, fuelType: 'ELECTRIC', currentFuelPercent: 91.0, currentMileageKm: 28400, mileage: 28400, currentLatitude: 19.2967, currentLongitude: 73.0631, assignedDriverId: createdDrivers[4].id },
    { code: 'EV-402', vehicleNumber: 'EV-402', vin: 'MTA41092830PR8821', make: 'Tata Motors', manufacturer: 'Tata Motors', model: 'Ace EV Ultra Express', year: 2024, licensePlate: 'KA-05-EV-4109', type: 'EV_VAN', status: 'AVAILABLE', capacity: 1800, maxPayloadKg: 1800, maxVolumeM3: 15.0, fuelType: 'ELECTRIC', currentFuelPercent: 84.0, currentMileageKm: 31200, mileage: 31200, currentLatitude: 19.2282, currentLongitude: 73.0776, assignedDriverId: createdDrivers[5].id },
    { code: 'BX-201', vehicleNumber: 'BOX-201', vin: 'MEP78210394MDC781', make: 'Eicher', manufacturer: 'Eicher', model: 'Pro 6028 Medium Duty Box', year: 2023, licensePlate: 'MH-12-BX-7821', type: 'BOX_TRUCK', status: 'AVAILABLE', capacity: 16500, maxPayloadKg: 16500, maxVolumeM3: 45.0, fuelType: 'DIESEL', currentFuelPercent: 78.0, currentMileageKm: 76500, mileage: 76500, currentLatitude: 19.0484, currentLongitude: 72.8857, assignedDriverId: createdDrivers[6].id },
    { code: 'BX-202', vehicleNumber: 'BOX-202', vin: 'MAL55091823LCR991', make: 'Ashok Leyland', manufacturer: 'Ashok Leyland', model: 'Ecomet 1615 HE Container', year: 2022, licensePlate: 'TN-09-BX-5509', type: 'BOX_TRUCK', status: 'MAINTENANCE', capacity: 11200, maxPayloadKg: 11200, maxVolumeM3: 38.0, fuelType: 'DIESEL', currentFuelPercent: 45.0, currentMileageKm: 112000, mileage: 112000, currentLatitude: 19.2967, currentLongitude: 73.0631, nextMaintenanceDate: new Date(Date.now() - 1 * 24 * 3600 * 1000), assignedDriverId: createdDrivers[7].id },
    { code: 'VN-101', vehicleNumber: 'VAN-101', vin: 'MMB90810294MP0192', make: 'Mahindra', manufacturer: 'Mahindra', model: 'Bolero Maxi Truck Plus', year: 2023, licensePlate: 'MH-02-VN-9081', type: 'SPRINTER_VAN', status: 'AVAILABLE', capacity: 1750, maxPayloadKg: 1750, maxVolumeM3: 14.5, fuelType: 'DIESEL', currentFuelPercent: 94.0, currentMileageKm: 42100, mileage: 42100, currentLatitude: 19.1028, currentLongitude: 72.8870, assignedDriverId: createdDrivers[8].id },
    { code: 'VN-102', vehicleNumber: 'VAN-102', vin: 'MFU33190284NE6710', make: 'Force Motors', manufacturer: 'Force Motors', model: 'Urbania Express High Roof', year: 2022, licensePlate: 'HR-26-VN-3319', type: 'SPRINTER_VAN', status: 'AVAILABLE', capacity: 2200, maxPayloadKg: 2200, maxVolumeM3: 16.2, fuelType: 'GASOLINE', currentFuelPercent: 88.0, currentMileageKm: 59300, mileage: 59300, currentLatitude: 19.2967, currentLongitude: 73.0631, assignedDriverId: createdDrivers[9].id },
    { code: 'VEH-405', vehicleNumber: 'TRK-405', vin: 'MTU88901928PN5520', make: 'Tata Motors', manufacturer: 'Tata Motors', model: 'Ultra T.7 EV Heavy Hauler', year: 2024, licensePlate: 'DL-1A-EV-8890', type: 'SEMI_TRAILER', status: 'AVAILABLE', capacity: 26000, maxPayloadKg: 26000, maxVolumeM3: 94.0, fuelType: 'ELECTRIC', currentFuelPercent: 96.0, currentMileageKm: 18200, mileage: 18200, currentLatitude: 19.2967, currentLongitude: 73.0631, assignedDriverId: createdDrivers[10].id },
    { code: 'BX-203', vehicleNumber: 'BOX-203', vin: 'MEP22190182NH7781', make: 'Eicher', manufacturer: 'Eicher', model: 'Pro 3019 Heavy Freight Box', year: 2023, licensePlate: 'MH-04-BX-2219', type: 'BOX_TRUCK', status: 'AVAILABLE', capacity: 14500, maxPayloadKg: 14500, maxVolumeM3: 48.0, fuelType: 'DIESEL', currentFuelPercent: 72.0, currentMileageKm: 84000, mileage: 84000, currentLatitude: 19.2967, currentLongitude: 73.0631, assignedDriverId: createdDrivers[11].id },
  ];

  const createdVehicles: any[] = [];
  for (const v of vehicleData) {
    const dataToCreate: any = { ...v };
    if (!dataToCreate.assignedDriverId) delete dataToCreate.assignedDriverId;
    const vehicle = await prisma.vehicle.create({ data: dataToCreate });
    createdVehicles.push(vehicle);
  }
  console.log(`🚛 Created ${createdVehicles.length} Vehicles.`);

  // 5. Maintenance Logs
  const maintenanceLogs = [
    { vehicleId: createdVehicles[7].id, type: 'BRAKE_INSPECTION', serviceType: 'BRAKE_INSPECTION', description: 'Replaced front and rear air brake drums.', cost: 18500.00, odometerKm: 112000, maintenanceDate: new Date('2026-08-25'), nextDueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000), status: 'IN_PROGRESS' },
    { vehicleId: createdVehicles[0].id, type: 'OIL_CHANGE', serviceType: 'OIL_CHANGE', description: 'Synthetic engine oil change.', cost: 6200.00, odometerKm: 140000, maintenanceDate: new Date('2026-06-15'), status: 'COMPLETED' },
    { vehicleId: createdVehicles[1].id, type: 'TIRE_ROTATION', serviceType: 'TIRE_ROTATION', description: 'Radial steer tire alignment.', cost: 24000.00, odometerKm: 85000, maintenanceDate: new Date('2026-07-10'), status: 'COMPLETED' },
    { vehicleId: createdVehicles[3].id, type: 'ENGINE_REPAIR', serviceType: 'ENGINE_REPAIR', description: 'Refrigeration unit compressor calibration.', cost: 14500.00, odometerKm: 60000, maintenanceDate: new Date('2026-08-01'), status: 'COMPLETED' },
    { vehicleId: createdVehicles[4].id, type: 'BATTERY_CHECK', serviceType: 'BATTERY_CHECK', description: 'High-voltage battery telematics diagnostic.', cost: 4800.00, odometerKm: 25000, maintenanceDate: new Date('2026-07-28'), status: 'COMPLETED' },
  ];

  for (const m of maintenanceLogs) {
    await prisma.maintenanceLog.create({ data: m });
  }

  // 6. Orders & Deliveries
  const orderList = [
    { orderNumber: 'ORD-2026-9041', customerName: 'Reliance Retail Logistics Ltd', customerEmail: 'supplychain@relianceretail.com', customerPhone: '+1-555-0199', customerAddress: 'Reliance Park, Navi Mumbai', pickupAddress: 'JNPT Yard, Navi Mumbai', pickupLat: 18.9496, pickupLng: 72.9515, deliveryAddress: 'Bhiwandi Hub, Thane', deliveryLat: 19.2967, deliveryLng: 73.0631, weightKg: 24500, volumeM3: 72.0, cargoType: 'GENERAL_FREIGHT', priority: 'HIGH', status: 'IN_TRANSIT', deliveryFee: 18500.00 },
    { orderNumber: 'ORD-2026-9042', customerName: 'Sun Pharma Distribution', customerEmail: 'coldchain@sunpharma.com', customerPhone: '+1-555-0198', customerAddress: 'Goregaon, Mumbai', pickupAddress: 'Bhiwandi Cold Hub, Thane', pickupLat: 19.2967, pickupLng: 73.0631, deliveryAddress: 'Apollo Hospital, Navi Mumbai', deliveryLat: 19.0178, deliveryLng: 73.0410, weightKg: 4200, volumeM3: 16.5, cargoType: 'COLD_CHAIN', priority: 'URGENT', status: 'OUT_FOR_DELIVERY', deliveryFee: 24000.00 },
    { orderNumber: 'ORD-2026-8801', customerName: 'Pidilite Chemical Logistics', customerEmail: 'dispatch@pidilite.com', customerPhone: '+1-555-0197', customerAddress: 'Andheri East, Mumbai', pickupAddress: 'Taloja MIDC Chemical Bay', pickupLat: 19.0687, pickupLng: 73.1143, deliveryAddress: 'Chakan Zone, Pune', deliveryLat: 18.7606, deliveryLng: 73.8636, weightKg: 16000, volumeM3: 35.0, cargoType: 'HAZMAT', priority: 'HIGH', status: 'DELIVERED', deliveryFee: 28000.00 },
    { orderNumber: 'ORD-2026-9050', customerName: 'Adani Solar Technologies', customerEmail: 'solar@adani.com', customerPhone: '+1-555-0196', customerAddress: 'Ahmedabad, Gujarat', pickupAddress: 'Mundra Port Yard', pickupLat: 22.8392, pickupLng: 69.7145, deliveryAddress: 'Shirdi Substation', deliveryLat: 19.7681, deliveryLng: 74.4841, weightKg: 15200, volumeM3: 48.0, cargoType: 'FRAGILE', priority: 'HIGH', status: 'PENDING', deliveryFee: 32000.00 },
    { orderNumber: 'ORD-2026-9051', customerName: 'Blue Tokai Coffee Roasters', customerEmail: 'coffee@bluetokai.com', customerPhone: '+1-555-0195', customerAddress: 'Mahalaxmi, Mumbai', pickupAddress: 'Chikmagalur Estate', pickupLat: 13.3181, pickupLng: 75.7725, deliveryAddress: 'Roastery Depot', deliveryLat: 18.9833, deliveryLng: 72.8268, weightKg: 4950, volumeM3: 14.5, cargoType: 'GENERAL_FREIGHT', priority: 'STANDARD', status: 'PENDING', deliveryFee: 12500.00 },
    { orderNumber: 'ORD-2026-9052', customerName: 'Mahyco Agro Produce', customerEmail: 'sales@mahyco.com', customerPhone: '+1-555-0194', customerAddress: 'Jalna, Maharashtra', pickupAddress: 'Nashik Grape Hub', pickupLat: 19.9975, pickupLng: 73.7898, deliveryAddress: 'APMC Market, Navi Mumbai', deliveryLat: 19.0760, deliveryLng: 72.9980, weightKg: 14400, volumeM3: 45.0, cargoType: 'PERISHABLE', priority: 'HIGH', status: 'PENDING', deliveryFee: 18000.00 },
    { orderNumber: 'ORD-2026-9053', customerName: 'Tata Consultancy Infrastructure', customerEmail: 'dcops@tcs.com', customerPhone: '+1-555-0193', customerAddress: 'Thane, Maharashtra', pickupAddress: 'Vikhroli Tech Depot', pickupLat: 19.1112, pickupLng: 72.9281, deliveryAddress: 'Airoli Data Center', deliveryLat: 19.1554, deliveryLng: 72.9935, weightKg: 8900, volumeM3: 28.0, cargoType: 'HIGH_VALUE', priority: 'HIGH', status: 'IN_TRANSIT', deliveryFee: 21000.00 },
    { orderNumber: 'ORD-2026-9054', customerName: 'Amul Dairy Cooperative', customerEmail: 'logistics@amul.coop', customerPhone: '+1-555-0192', customerAddress: 'Anand, Gujarat', pickupAddress: 'Vasai Agro Center', pickupLat: 19.3820, pickupLng: 72.8410, deliveryAddress: 'Vashi Market', deliveryLat: 19.0760, deliveryLng: 72.9980, weightKg: 18200, volumeM3: 65.0, cargoType: 'PERISHABLE', priority: 'STANDARD', status: 'IN_TRANSIT', deliveryFee: 19500.00 },
    { orderNumber: 'ORD-2026-8802', customerName: 'Flipkart Supply Chain', customerEmail: 'inbound@flipkart.com', customerPhone: '+1-555-0191', customerAddress: 'Bhiwandi Center', pickupAddress: 'JNPT Berth 4', pickupLat: 18.9496, pickupLng: 72.9515, deliveryAddress: 'Flipkart Hub, Thane', deliveryLat: 19.2718, deliveryLng: 73.0452, weightKg: 12800, volumeM3: 42.0, cargoType: 'GENERAL_FREIGHT', priority: 'STANDARD', status: 'DELIVERED', deliveryFee: 16000.00 },
    { orderNumber: 'ORD-2026-8803', customerName: 'JSW Steel Goods', customerEmail: 'logistics@jsw.in', customerPhone: '+1-555-0190', customerAddress: 'BKC, Mumbai', pickupAddress: 'Dolvi Steel Plant', pickupLat: 18.7056, pickupLng: 73.0402, deliveryAddress: 'Sanand Hub, Gujarat', deliveryLat: 22.9871, deliveryLng: 72.3829, weightKg: 32500, volumeM3: 45.0, cargoType: 'GENERAL_FREIGHT', priority: 'STANDARD', status: 'DELIVERED', deliveryFee: 45000.00 },
  ];

  const createdOrders: any[] = [];
  for (const o of orderList) {
    const order = await prisma.order.create({ data: o });
    createdOrders.push(order);
  }

  // Delivery 1 (IN_TRANSIT)
  const del1 = await prisma.delivery.create({
    data: {
      trackingNumber: 'TRK-882910',
      orderId: createdOrders[0].id,
      customerName: createdOrders[0].customerName,
      customerPhone: createdOrders[0].customerPhone,
      pickupAddress: createdOrders[0].pickupAddress,
      pickupLatitude: createdOrders[0].pickupLat,
      pickupLongitude: createdOrders[0].pickupLng,
      deliveryAddress: createdOrders[0].deliveryAddress,
      deliveryLatitude: createdOrders[0].deliveryLat,
      deliveryLongitude: createdOrders[0].deliveryLng,
      packageDescription: 'Electronics & Pallets',
      packageWeight: 24500,
      driverId: createdDrivers[0].id,
      vehicleId: createdVehicles[0].id,
      status: 'IN_TRANSIT',
      priority: 'HIGH',
      pickupScheduledAt: new Date(Date.now() - 3 * 3600 * 1000),
      pickupActualAt: new Date(Date.now() - 2.5 * 3600 * 1000),
      deliveryEstimatedAt: new Date(Date.now() + 1.2 * 3600 * 1000),
      estimatedDeliveryTime: new Date(Date.now() + 1.2 * 3600 * 1000),
      currentLat: 19.1136,
      currentLng: 73.0112,
      progressPercent: 58.0,
      routeDistanceKm: 64.2,
      routeDurationMin: 110,
    },
  });

  await prisma.deliveryStatusHistory.createMany({
    data: [
      { deliveryId: del1.id, status: 'PENDING', note: 'Registered', updatedBy: 'System' },
      { deliveryId: del1.id, status: 'ASSIGNED', note: 'Assigned driver & vehicle', updatedBy: 'Dispatcher' },
      { deliveryId: del1.id, status: 'ACCEPTED', note: 'Driver accepted', updatedBy: 'Driver' },
      { deliveryId: del1.id, status: 'PICKED_UP', note: 'Cargo loaded', updatedBy: 'Driver' },
      { deliveryId: del1.id, status: 'IN_TRANSIT', note: 'En route', updatedBy: 'Driver' },
    ],
  });

  await prisma.deliveryTimelineEvent.createMany({
    data: [
      { deliveryId: del1.id, status: 'PENDING', title: 'Order Registered', description: 'Order registered', locationName: del1.pickupAddress, recordedBy: 'System' },
      { deliveryId: del1.id, status: 'IN_TRANSIT', title: 'In Transit', description: 'In transit', locationName: 'Express Corridor', recordedBy: 'Driver' },
    ],
  });

  // Delivery 2 (OUT_FOR_DELIVERY)
  const del2 = await prisma.delivery.create({
    data: {
      trackingNumber: 'TRK-904128',
      orderId: createdOrders[1].id,
      customerName: createdOrders[1].customerName,
      customerPhone: createdOrders[1].customerPhone,
      pickupAddress: createdOrders[1].pickupAddress,
      pickupLatitude: createdOrders[1].pickupLat,
      pickupLongitude: createdOrders[1].pickupLng,
      deliveryAddress: createdOrders[1].deliveryAddress,
      deliveryLatitude: createdOrders[1].deliveryLat,
      deliveryLongitude: createdOrders[1].deliveryLng,
      packageDescription: 'Pharma Cold Chain',
      packageWeight: 4200,
      driverId: createdDrivers[3].id,
      vehicleId: createdVehicles[3].id,
      status: 'OUT_FOR_DELIVERY',
      priority: 'URGENT',
      pickupScheduledAt: new Date(Date.now() - 2 * 3600 * 1000),
      pickupActualAt: new Date(Date.now() - 1.8 * 3600 * 1000),
      deliveryEstimatedAt: new Date(Date.now() + 25 * 60 * 1000),
      estimatedDeliveryTime: new Date(Date.now() + 25 * 60 * 1000),
      currentLat: 19.0350,
      currentLng: 73.0320,
      progressPercent: 88.0,
      routeDistanceKm: 42.5,
      routeDurationMin: 65,
    },
  });

  await prisma.deliveryStatusHistory.createMany({
    data: [
      { deliveryId: del2.id, status: 'PENDING', note: 'Created', updatedBy: 'System' },
      { deliveryId: del2.id, status: 'ASSIGNED', note: 'Assigned', updatedBy: 'Dispatcher' },
      { deliveryId: del2.id, status: 'ACCEPTED', note: 'Accepted', updatedBy: 'Driver' },
      { deliveryId: del2.id, status: 'PICKED_UP', note: 'Picked up', updatedBy: 'Driver' },
      { deliveryId: del2.id, status: 'IN_TRANSIT', note: 'In transit', updatedBy: 'Driver' },
      { deliveryId: del2.id, status: 'OUT_FOR_DELIVERY', note: 'Arriving at hospital bay', updatedBy: 'Driver' },
    ],
  });

  await prisma.deliveryTimelineEvent.createMany({
    data: [
      { deliveryId: del2.id, status: 'PENDING', title: 'Order Registered', description: 'Order registered', locationName: del2.pickupAddress, recordedBy: 'System' },
      { deliveryId: del2.id, status: 'OUT_FOR_DELIVERY', title: 'Out For Delivery', description: 'Arriving soon', locationName: 'Hospital Bay', recordedBy: 'Driver' },
    ],
  });

  // Delivery 3 (DELIVERED)
  const del3 = await prisma.delivery.create({
    data: {
      trackingNumber: 'TRK-771920',
      orderId: createdOrders[2].id,
      customerName: createdOrders[2].customerName,
      customerPhone: createdOrders[2].customerPhone,
      pickupAddress: createdOrders[2].pickupAddress,
      pickupLatitude: createdOrders[2].pickupLat,
      pickupLongitude: createdOrders[2].pickupLng,
      deliveryAddress: createdOrders[2].deliveryAddress,
      deliveryLatitude: createdOrders[2].deliveryLat,
      deliveryLongitude: createdOrders[2].deliveryLng,
      packageDescription: 'Polymers & Drums',
      packageWeight: 16000,
      driverId: createdDrivers[1].id,
      vehicleId: createdVehicles[1].id,
      status: 'DELIVERED',
      priority: 'HIGH',
      pickupScheduledAt: new Date(Date.now() - 28 * 3600 * 1000),
      pickupActualAt: new Date(Date.now() - 27.5 * 3600 * 1000),
      deliveryEstimatedAt: new Date(Date.now() - 24 * 3600 * 1000),
      estimatedDeliveryTime: new Date(Date.now() - 24 * 3600 * 1000),
      deliveryActualAt: new Date(Date.now() - 24.2 * 3600 * 1000),
      actualDeliveryTime: new Date(Date.now() - 24.2 * 3600 * 1000),
      currentLat: 18.7606,
      currentLng: 73.8636,
      progressPercent: 100.0,
      routeDistanceKm: 128.4,
      routeDurationMin: 180,
      recipientSignature: 'Signed by: Santosh Kadam',
    },
  });

  await prisma.deliveryStatusHistory.createMany({
    data: [
      { deliveryId: del3.id, status: 'PENDING', note: 'Created', updatedBy: 'System' },
      { deliveryId: del3.id, status: 'ASSIGNED', note: 'Assigned', updatedBy: 'Dispatcher' },
      { deliveryId: del3.id, status: 'ACCEPTED', note: 'Accepted', updatedBy: 'Driver' },
      { deliveryId: del3.id, status: 'PICKED_UP', note: 'Picked up', updatedBy: 'Driver' },
      { deliveryId: del3.id, status: 'IN_TRANSIT', note: 'In transit', updatedBy: 'Driver' },
      { deliveryId: del3.id, status: 'OUT_FOR_DELIVERY', note: 'Out for delivery', updatedBy: 'Driver' },
      { deliveryId: del3.id, status: 'DELIVERED', note: 'Offloaded successfully', updatedBy: 'Driver' },
    ],
  });

  await prisma.deliveryTimelineEvent.createMany({
    data: [
      { deliveryId: del3.id, status: 'PENDING', title: 'Order Registered', description: 'Order registered', locationName: del3.pickupAddress, recordedBy: 'System' },
      { deliveryId: del3.id, status: 'DELIVERED', title: 'Delivered', description: 'Signed and delivered', locationName: del3.deliveryAddress, recordedBy: 'Driver' },
    ],
  });

  // Delivery 4 (IN_TRANSIT - ORD-2026-9053)
  const del4 = await prisma.delivery.create({
    data: {
      trackingNumber: 'TRK-905301',
      orderId: createdOrders[6].id,
      customerName: createdOrders[6].customerName,
      customerPhone: createdOrders[6].customerPhone,
      pickupAddress: createdOrders[6].pickupAddress,
      pickupLatitude: createdOrders[6].pickupLat,
      pickupLongitude: createdOrders[6].pickupLng,
      deliveryAddress: createdOrders[6].deliveryAddress,
      deliveryLatitude: createdOrders[6].deliveryLat,
      deliveryLongitude: createdOrders[6].deliveryLng,
      packageDescription: 'GPU Server Racks',
      packageWeight: 8900,
      driverId: createdDrivers[2].id,
      vehicleId: createdVehicles[2].id,
      status: 'IN_TRANSIT',
      priority: 'HIGH',
      routeDistanceKm: 48.0,
      progressPercent: 45.0,
    },
  });

  await prisma.deliveryTimelineEvent.createMany({
    data: [
      { deliveryId: del4.id, status: 'PENDING', title: 'Order Registered', description: 'Order registered', locationName: del4.pickupAddress, recordedBy: 'System' },
      { deliveryId: del4.id, status: 'IN_TRANSIT', title: 'In Transit', description: 'In transit', locationName: 'Vikhroli Expressway', recordedBy: 'Driver' },
    ],
  });

  // 7. System Settings (12 parameters)
  const defaultSettings = [
    { key: 'company_name', value: 'Nexus Logistics One', category: 'COMPANY', description: 'Organization name' },
    { key: 'company_code', value: 'L1-IND-01', category: 'COMPANY', description: 'Central dispatch operations identifier' },
    { key: 'depot_address', value: 'Bhiwandi Central Logistics Hub, Sector 18, Thane, Maharashtra 421302', category: 'COMPANY', description: 'Primary hub depot address' },
    { key: 'depot_lat', value: '19.2967', category: 'COMPANY', description: 'Primary depot latitude coordinates' },
    { key: 'depot_lng', value: '73.0631', category: 'COMPANY', description: 'Primary depot longitude coordinates' },
    { key: 'auto_dispatch_enabled', value: 'true', category: 'DISPATCH', description: 'Enable auto dispatch' },
    { key: 'max_driver_hours_per_day', value: '10', category: 'DISPATCH', description: 'Driver hours limit' },
    { key: 'delay_threshold_minutes', value: '15', category: 'ALERTS', description: 'Delay warning threshold' },
    { key: 'speed_alert_kmh', value: '80', category: 'ALERTS', description: 'Speed limit threshold' },
    { key: 'low_fuel_alert_percent', value: '15', category: 'ALERTS', description: 'Low fuel alert' },
    { key: 'notify_email_dispatch', value: 'true', category: 'NOTIFICATIONS', description: 'Send email alerts' },
    { key: 'units_system', value: 'METRIC', category: 'GENERAL', description: 'Unit system' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.create({ data: s });
  }

  // 8. Audit Logs (5 entries)
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, user: adminUser.name, userName: adminUser.name, action: 'USER_LOGIN', entity: 'SYSTEM', entityType: 'USER', entityId: adminUser.id, details: 'System initialized.', ipAddress: '127.0.0.1' },
      { userId: dispatcherUser.id, user: dispatcherUser.name, userName: dispatcherUser.name, action: 'DELIVERY_CREATED', entity: 'DELIVERY', entityType: 'DELIVERY', entityId: del1.id, details: 'Dispatched TRK-882910', ipAddress: '192.168.1.45' },
      { userId: fleetopsAdmin.id, user: fleetopsAdmin.name, userName: fleetopsAdmin.name, action: 'VEHICLE_CREATED', entity: 'VEHICLE', entityType: 'VEHICLE', entityId: createdVehicles[0].id, details: 'Created vehicle VEH-401', ipAddress: '127.0.0.1' },
      { userId: fleetopsDispatcher.id, user: fleetopsDispatcher.name, userName: fleetopsDispatcher.name, action: 'DRIVER_ASSIGNED', entity: 'DRIVER', entityType: 'DRIVER', entityId: createdDrivers[0].id, details: 'Assigned driver', ipAddress: '192.168.1.46' },
      { userId: fleetopsDriver.id, user: fleetopsDriver.name, userName: fleetopsDriver.name, action: 'STATUS_CHANGED', entity: 'DELIVERY', entityType: 'DELIVERY', entityId: del1.id, details: 'Updated status to IN_TRANSIT', ipAddress: '192.168.1.50' },
    ],
  });

  // 9. Issues (2 entries)
  await prisma.issue.createMany({
    data: [
      { deliveryId: del1.id, driverId: createdDrivers[0].id, type: 'TRAFFIC', description: 'Traffic congestion on Airoli expressway toll plaza.', priority: 'LOW', status: 'OPEN' },
      { deliveryId: del2.id, driverId: createdDrivers[3].id, type: 'MECHANICAL', description: 'Reefer compressor temperature sensor recalibrated.', priority: 'MEDIUM', status: 'RESOLVED', resolvedAt: new Date() },
    ],
  });

  console.log('✅ Complete seed updated!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
