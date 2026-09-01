import { prisma } from './prisma';

const API_BASE = 'http://localhost:5000/api';

interface AuditResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: AuditResult[] = [];

function record(category: string, test: string, passed: boolean, details: string, isWarn = false) {
  const status: 'PASS' | 'FAIL' | 'WARN' = passed ? 'PASS' : (isWarn ? 'WARN' : 'FAIL');
  results.push({ category, test, status, details });
  const icon = passed ? '✅' : (isWarn ? '⚠️' : '❌');
  console.log(`${icon} [${category}] ${test}: ${details}`);
}

async function apiRequest(endpoint: string, method = 'GET', body?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { status: res.status, ok: res.ok, data };
}

async function runFullAudit() {
  console.log('================================================================');
  console.log('🔍 NEXUS FLEETOPS COMPLETE SYSTEM & FUNCTIONALITY AUDIT');
  console.log('================================================================\n');

  // ==========================================
  // SECTION 1: DATABASE VERIFICATION
  // ==========================================
  console.log('--- 1. DATABASE & SCHEMA AUDIT ---');
  try {
    const userCount = await prisma.user.count();
    const driverCount = await prisma.driver.count();
    const vehicleCount = await prisma.vehicle.count();
    const orderCount = await prisma.order.count();
    const deliveryCount = await prisma.delivery.count();
    const timelineCount = await prisma.deliveryTimelineEvent.count();
    const maintenanceCount = await prisma.maintenanceLog.count();
    const settingsCount = await prisma.systemSetting.count();
    const auditCount = await prisma.auditLog.count();

    record('DATABASE', 'Database Engine', true, `SQLite (dev.db via Prisma ORM v5.22.0)`);
    record('DATABASE', 'Users Table', userCount >= 4, `${userCount} users stored in DB`);
    record('DATABASE', 'Drivers Table', driverCount >= 4, `${driverCount} drivers stored in DB`);
    record('DATABASE', 'Vehicles Table', vehicleCount >= 4, `${vehicleCount} vehicles stored in DB`);
    record('DATABASE', 'Orders Table', orderCount >= 4, `${orderCount} orders stored in DB`);
    record('DATABASE', 'Deliveries Table', deliveryCount >= 3, `${deliveryCount} deliveries stored in DB`);
    record('DATABASE', 'Timeline Events Table', timelineCount >= 3, `${timelineCount} milestone events stored in DB`);
    record('DATABASE', 'Maintenance Logs Table', maintenanceCount >= 2, `${maintenanceCount} maintenance logs in DB`);
    record('DATABASE', 'System Settings Table', settingsCount >= 5, `${settingsCount} settings in DB`);
    record('DATABASE', 'Audit Logs Table', auditCount >= 2, `${auditCount} audit logs in DB`);
  } catch (err: any) {
    record('DATABASE', 'Connection', false, `Failed to query database: ${err.message}`);
  }

  // ==========================================
  // SECTION 2: AUTHENTICATION AUDIT
  // ==========================================
  console.log('\n--- 2. AUTHENTICATION AUDIT ---');
  let adminToken = '';
  let dispatcherToken = '';
  let opsToken = '';
  let driverToken = '';

  const accounts = [
    { email: 'admin@fleetops.io', pass: 'admin123', expectedRole: 'ADMIN' },
    { email: 'dispatcher@fleetops.io', pass: 'dispatch123', expectedRole: 'DISPATCHER' },
    { email: 'ops@fleetops.io', pass: 'ops123', expectedRole: 'FLEET_MANAGER' },
    { email: 'driver@fleetops.io', pass: 'driver123', expectedRole: 'DRIVER' },
  ];

  for (const acc of accounts) {
    try {
      const res = await apiRequest('/auth/login', 'POST', {
        email: acc.email,
        password: acc.pass,
      });
      const data = res.data;
      const valid = res.ok && data.token && data.user && data.user.role === acc.expectedRole;
      if (acc.expectedRole === 'ADMIN') adminToken = data.token;
      if (acc.expectedRole === 'DISPATCHER') dispatcherToken = data.token;
      if (acc.expectedRole === 'FLEET_MANAGER') opsToken = data.token;
      if (acc.expectedRole === 'DRIVER') driverToken = data.token;

      record('AUTH', `Login: ${acc.expectedRole}`, valid, `JWT token received, role=${data.user?.role}`);
    } catch (err: any) {
      record('AUTH', `Login: ${acc.expectedRole}`, false, err.message);
    }
  }

  // Test invalid login
  try {
    const res = await apiRequest('/auth/login', 'POST', {
      email: 'admin@fleetops.io',
      password: 'wrongpassword',
    });
    record('AUTH', 'Reject Bad Password', res.status === 401, `Correctly rejected with 401: ${res.data?.error}`);
  } catch (err: any) {
    record('AUTH', 'Reject Bad Password', false, err.message);
  }

  try {
    const res = await apiRequest('/auth/login', 'POST', {
      email: 'nonexistent@fleetops.io',
      password: 'somepassword',
    });
    record('AUTH', 'Reject Nonexistent User', res.status === 401, `Correctly rejected with 401: ${res.data?.error}`);
  } catch (err: any) {
    record('AUTH', 'Reject Nonexistent User', false, err.message);
  }

  // Verify Session Token via /auth/me
  try {
    const res = await apiRequest('/auth/me', 'GET', undefined, adminToken);
    record('AUTH', 'Session Validation (/auth/me)', res.data?.user?.email === 'admin@fleetops.io', `Validated current user: ${res.data?.user?.name}`);
  } catch (err: any) {
    record('AUTH', 'Session Validation (/auth/me)', false, err.message);
  }

  // ==========================================
  // SECTION 3: BACKEND ROLE AUTHORIZATION AUDIT
  // ==========================================
  console.log('\n--- 3. BACKEND ROLE AUTHORIZATION AUDIT ---');

  // Test 3.1: Driver attempting to access Admin Users endpoint
  try {
    const res = await apiRequest('/admin/users', 'GET', undefined, driverToken);
    record('RBAC', 'Driver blocked from /admin/users', res.status === 403, `Received HTTP ${res.status} (${res.data?.error})`);
  } catch (err: any) {
    record('RBAC', 'Driver blocked from /admin/users', false, err.message);
  }

  // Test 3.2: Dispatcher attempting to access /admin/users
  try {
    const res = await apiRequest('/admin/users', 'GET', undefined, dispatcherToken);
    record('RBAC', 'Dispatcher blocked from /admin/users', res.status === 403, `Received HTTP ${res.status} (${res.data?.error})`);
  } catch (err: any) {
    record('RBAC', 'Dispatcher blocked from /admin/users', false, err.message);
  }

  // ==========================================
  // SECTION 4: VEHICLE CRUD AUDIT
  // ==========================================
  console.log('\n--- 4. VEHICLE CRUD AUDIT ---');
  let testVehicleId = '';
  const testVehicleCode = `TEST-VEH-${Date.now().toString().slice(-4)}`;
  const testPlate = `MH-01-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // CREATE
    const createRes = await apiRequest(
      '/vehicles',
      'POST',
      {
        code: testVehicleCode,
        vin: `VIN-${Date.now()}`,
        make: 'Tata Motors',
        model: 'Signa 2823',
        year: 2024,
        licensePlate: testPlate,
        type: 'BOX_TRUCK',
        maxPayloadKg: 18000,
        maxVolumeM3: 45.0,
        fuelType: 'DIESEL',
      },
      opsToken
    );
    testVehicleId = createRes.data?.vehicle?.id;
    record('VEHICLE_CRUD', 'Create Vehicle', !!testVehicleId, `Created vehicle ${testVehicleCode} (ID: ${testVehicleId})`);

    // READ (from DB directly)
    const readDb = await prisma.vehicle.findUnique({ where: { id: testVehicleId } });
    record('VEHICLE_CRUD', 'Read & DB Persistence', readDb?.code === testVehicleCode, `Found in SQLite DB: ${readDb?.code}`);

    // EDIT
    await apiRequest(
      `/vehicles/${testVehicleId}`,
      'PUT',
      { model: 'Signa 2823 Turbo Updated', status: 'MAINTENANCE' },
      opsToken
    );
    const updatedDb = await prisma.vehicle.findUnique({ where: { id: testVehicleId } });
    record('VEHICLE_CRUD', 'Edit Vehicle & Status', updatedDb?.status === 'MAINTENANCE' && (updatedDb?.model.includes('Updated') || false), `Updated model in DB: ${updatedDb?.model}`);

    // DELETE
    await apiRequest(`/vehicles/${testVehicleId}`, 'DELETE', undefined, opsToken);
    const deletedDb = await prisma.vehicle.findUnique({ where: { id: testVehicleId } });
    record('VEHICLE_CRUD', 'Delete Vehicle', deletedDb === null, `Deleted from SQLite DB: ${deletedDb === null}`);
  } catch (err: any) {
    record('VEHICLE_CRUD', 'Vehicle CRUD Workflow', false, err.message);
  }

  // ==========================================
  // SECTION 5: DRIVER CRUD AUDIT
  // ==========================================
  console.log('\n--- 5. DRIVER CRUD AUDIT ---');
  let testDriverId = '';
  const testDriverCode = `DRV-TEST-${Date.now().toString().slice(-4)}`;
  const testLicense = `DL-TEST-${Date.now()}`;

  try {
    // CREATE
    const createRes = await apiRequest(
      '/drivers',
      'POST',
      {
        code: testDriverCode,
        firstName: 'AuditTest',
        lastName: 'Driver',
        email: `audittest.${Date.now()}@fleetops.io`,
        phone: '+91 99999 88888',
        licenseNumber: testLicense,
        licenseClass: 'HMV_HEAVY',
        licenseExpiry: '2028-12-31',
        status: 'AVAILABLE',
      },
      opsToken
    );
    testDriverId = createRes.data?.driver?.id;
    record('DRIVER_CRUD', 'Create Driver', !!testDriverId, `Created driver ${testDriverCode} (ID: ${testDriverId})`);

    // READ & DB PERSISTENCE
    const readDb = await prisma.driver.findUnique({ where: { id: testDriverId } });
    record('DRIVER_CRUD', 'Read & DB Persistence', readDb?.code === testDriverCode, `Found in DB: ${readDb?.firstName} ${readDb?.lastName}`);

    // AVAILABILITY TOGGLE
    await apiRequest(
      `/drivers/${testDriverId}/status`,
      'PATCH',
      { status: 'OFF_DUTY' },
      opsToken
    );
    const updatedDb = await prisma.driver.findUnique({ where: { id: testDriverId } });
    record('DRIVER_CRUD', 'Update Availability', updatedDb?.status === 'OFF_DUTY', `Status updated in DB: ${updatedDb?.status}`);

    // DELETE
    await apiRequest(`/drivers/${testDriverId}`, 'DELETE', undefined, opsToken);
    const deletedDb = await prisma.driver.findUnique({ where: { id: testDriverId } });
    record('DRIVER_CRUD', 'Delete Driver', deletedDb === null, `Deleted from DB: ${deletedDb === null}`);
  } catch (err: any) {
    record('DRIVER_CRUD', 'Driver CRUD Workflow', false, err.message);
  }

  // ==========================================
  // SECTION 6 & 7: ORDER & DELIVERY WORKFLOW
  // ==========================================
  console.log('\n--- 6 & 7. ORDER & COMPLETE DELIVERY WORKFLOW AUDIT ---');
  try {
    // 1. Create Order
    const orderRes = await apiRequest(
      '/orders',
      'POST',
      {
        customerName: 'Audit Test Corporation Ltd',
        customerEmail: 'audit@testcorp.in',
        customerPhone: '+91 98765 43210',
        customerAddress: 'Bandra Kurla Complex, Mumbai 400051',
        pickupAddress: 'Bhiwandi Central Logistics Hub, Thane 421302',
        deliveryAddress: 'Chakan Industrial Zone, Pune 410501',
        weightKg: 1200,
        volumeM3: 5.0,
        cargoType: 'GENERAL_FREIGHT',
        priority: 'HIGH',
        deliveryFee: 22000,
      },
      dispatcherToken
    );
    const orderId = orderRes.data?.order?.id;
    const orderNumber = orderRes.data?.order?.orderNumber;
    record('ORDER_CRUD', 'Create Order', !!orderId, `Order #${orderNumber} created (ID: ${orderId})`);

    // Verify DB
    const orderDb = await prisma.order.findUnique({ where: { id: orderId } });
    record('ORDER_CRUD', 'Order DB Persistence', orderDb?.status === 'PENDING', `Order status in DB: ${orderDb?.status}`);

    // 2. Find available driver & vehicle
    const availableDriver = await prisma.driver.findFirst({
      where: {
        status: 'AVAILABLE',
        deliveries: { none: { status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } },
      },
    });
    const availableVehicle = await prisma.vehicle.findFirst({
      where: {
        status: 'ACTIVE',
        deliveries: { none: { status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } },
      },
    });

    if (!availableDriver || !availableVehicle) {
      throw new Error('No available driver or vehicle found for test dispatch');
    }

    // 3. Dispatch Delivery
    const dispatchRes = await apiRequest(
      '/deliveries',
      'POST',
      {
        orderId,
        driverId: availableDriver.id,
        vehicleId: availableVehicle.id,
        priority: 'HIGH',
        notes: 'End-to-End Audit Workflow Test',
      },
      dispatcherToken
    );
    const deliveryId = dispatchRes.data?.delivery?.id;
    const trackingNumber = dispatchRes.data?.delivery?.trackingNumber;
    record('DELIVERY_WORKFLOW', 'Dispatch Delivery', !!deliveryId, `Dispatched TRK #${trackingNumber}`);

    if (deliveryId) {
      // Check DB state after dispatch
      const delDb1 = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true, driver: true, vehicle: true, timelineEvents: true },
      });
      record('DELIVERY_WORKFLOW', 'Status: DISPATCHED', delDb1?.status === 'DISPATCHED' && delDb1?.order.status === 'ASSIGNED', `Delivery=${delDb1?.status}, Order=${delDb1?.order.status}, TimelineCount=${delDb1?.timelineEvents.length}`);

      // 4. Milestone 1: PICKED_UP (via state machine transition)
      await apiRequest(
        `/deliveries/${deliveryId}/transition`,
        'POST',
        { nextStatus: 'PICKED_UP', notes: 'Cargo loaded at Bhiwandi Depot' },
        dispatcherToken
      );
      const delDb2 = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { timelineEvents: true },
      });
      record('DELIVERY_WORKFLOW', 'Status: PICKED_UP', delDb2?.status === 'PICKED_UP', `DB Status: ${delDb2?.status}, Timeline count: ${delDb2?.timelineEvents.length}`);

      // 5. Milestone 2: IN_TRANSIT
      await apiRequest(
        `/deliveries/${deliveryId}/transition`,
        'POST',
        { nextStatus: 'IN_TRANSIT', notes: 'En route via Expressway' },
        dispatcherToken
      );
      const delDb3 = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { timelineEvents: true },
      });
      record('DELIVERY_WORKFLOW', 'Status: IN_TRANSIT', delDb3?.status === 'IN_TRANSIT', `DB Status: ${delDb3?.status}, Timeline count: ${delDb3?.timelineEvents.length}`);

      // 6. Milestone 3: OUT_FOR_DELIVERY
      await apiRequest(
        `/deliveries/${deliveryId}/transition`,
        'POST',
        { nextStatus: 'OUT_FOR_DELIVERY', notes: 'Entering Chakan MIDC Industrial Area' },
        dispatcherToken
      );
      const delDb4 = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { timelineEvents: true },
      });
      record('DELIVERY_WORKFLOW', 'Status: OUT_FOR_DELIVERY', delDb4?.status === 'OUT_FOR_DELIVERY', `DB Status: ${delDb4?.status}, Timeline count: ${delDb4?.timelineEvents.length}`);

      // 7. Milestone 4: DELIVERED (with POD signature)
      await apiRequest(
        `/deliveries/${deliveryId}/transition`,
        'POST',
        { nextStatus: 'DELIVERED', recipientSignature: 'Signed by: S. Deshmukh (Audit Plant Mgr)' },
        dispatcherToken
      );
      const delDb5 = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true, driver: true, vehicle: true, timelineEvents: true },
      });
      const completedOk = delDb5?.status === 'DELIVERED' && delDb5?.order.status === 'DELIVERED' && delDb5?.progressPercent === 100 && !!delDb5?.recipientSignature;
      record('DELIVERY_WORKFLOW', 'Status: DELIVERED & POD Signed', completedOk, `DB Status=${delDb5?.status}, Progress=${delDb5?.progressPercent}%, Sig=${delDb5?.recipientSignature}`);

      // Verify all 5 timeline events exist in DB
      const timelineEvents = await prisma.deliveryTimelineEvent.findMany({
        where: { deliveryId },
        orderBy: { recordedAt: 'asc' },
      });
      record('DELIVERY_WORKFLOW', 'Timeline Event Stream', timelineEvents.length >= 5, `Found ${timelineEvents.length} chronological audit events in DB`);
    }
  } catch (err: any) {
    record('DELIVERY_WORKFLOW', 'Workflow Execution', false, err.message);
  }

  // ==========================================
  // SECTION 8: ASSIGNMENT BUSINESS LOGIC AUDIT
  // ==========================================
  console.log('\n--- 8. ASSIGNMENT & ANTI-COLLISION BUSINESS LOGIC ---');
  try {
    const activeDel = await prisma.delivery.findFirst({
      where: { status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
    });

    if (activeDel) {
      const newOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-COLLISION-${Date.now()}`,
          customerName: 'Collision Test Corp',
          customerEmail: 'col@test.com',
          customerPhone: '+91 99999 11111',
          customerAddress: 'Mumbai',
          pickupAddress: 'Bhiwandi Hub',
          pickupLat: 19.2967,
          pickupLng: 73.0631,
          deliveryAddress: 'Pune',
          deliveryLat: 18.5204,
          deliveryLng: 73.8567,
          weightKg: 5000,
          volumeM3: 15,
          cargoType: 'GENERAL_FREIGHT',
          status: 'PENDING',
        },
      });

      const freeVeh = await prisma.vehicle.findFirst({
        where: {
          status: 'ACTIVE',
          deliveries: { none: { status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } },
        },
      });

      if (freeVeh) {
        const doubleBookRes = await apiRequest(
          '/deliveries',
          'POST',
          {
            orderId: newOrder.id,
            driverId: activeDel.driverId,
            vehicleId: freeVeh.id,
          },
          dispatcherToken
        );
        record('BUSINESS_LOGIC', 'Prevent Driver Double-Booking', doubleBookRes.status === 409, `Correctly blocked with 409: ${doubleBookRes.data?.error}`);
      }

      await prisma.order.delete({ where: { id: newOrder.id } });
    }
  } catch (err: any) {
    record('BUSINESS_LOGIC', 'Anti-Double-Booking Test', false, err.message);
  }

  // ==========================================
  // SECTION 9: DASHBOARD & REPORTS AGGREGATION AUDIT
  // ==========================================
  console.log('\n--- 9. DASHBOARD & REPORTS AGGREGATION AUDIT ---');
  try {
    const kpiRes = await apiRequest('/reports/kpis', 'GET', undefined, adminToken);
    const kpis = kpiRes.data?.kpis;
    const realDbTotal = await prisma.delivery.count();
    const realDbActive = await prisma.delivery.count({
      where: { status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
    });
    const realDbDelivered = await prisma.delivery.count({ where: { status: 'DELIVERED' } });

    record('DASHBOARD', 'Active Deliveries KPI', kpis.activeDeliveries === realDbActive, `API=${kpis.activeDeliveries}, DB=${realDbActive}`);
    record('DASHBOARD', 'Completed Deliveries KPI', kpis.completedDeliveries === realDbDelivered, `API=${kpis.completedDeliveries}, DB=${realDbDelivered}`);
    record('DASHBOARD', 'Total Deliveries KPI', kpis.totalDeliveries === realDbTotal, `API=${kpis.totalDeliveries}, DB=${realDbTotal}`);
    record('DASHBOARD', 'Revenue Calculation', typeof kpis.totalRevenueUsd === 'number' && kpis.totalRevenueUsd > 0, `Total Revenue: ₹${kpis.totalRevenueUsd}`);
  } catch (err: any) {
    record('DASHBOARD', 'KPI Calculation', false, err.message);
  }

  // ==========================================
  // SECTION 10: DRIVER CONSOLE ENDPOINTS
  // ==========================================
  console.log('\n--- 10. DRIVER CONSOLE ENDPOINTS AUDIT ---');
  try {
    const driverActiveRes = await apiRequest('/deliveries/driver/current', 'GET', undefined, driverToken);
    record('DRIVER_CONSOLE', 'Driver /driver/current Endpoint', driverActiveRes.status === 200, `Returned driver profile: ${driverActiveRes.data?.driver?.firstName} ${driverActiveRes.data?.driver?.lastName}`);

    const driverHistRes = await apiRequest('/deliveries/driver/history', 'GET', undefined, driverToken);
    record('DRIVER_CONSOLE', 'Driver /driver/history Endpoint', Array.isArray(driverHistRes.data?.history), `Returned ${driverHistRes.data?.history?.length} past trips`);
  } catch (err: any) {
    record('DRIVER_CONSOLE', 'Driver Console Endpoints', false, err.message);
  }

  // ==========================================
  // AUDIT SUMMARY
  // ==========================================
  console.log('\n================================================================');
  console.log('📊 AUDIT RESULTS SUMMARY');
  console.log('================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;

  console.log(`Total Invocations Tested: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);
  console.log(`Warnings: ${warned}`);
}

runFullAudit()
  .catch((e) => console.error('Fatal audit error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
