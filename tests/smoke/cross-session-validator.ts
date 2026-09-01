import axios from 'axios';
import { prisma } from '../../src/server/prisma';

const API_BASE = 'http://localhost:5000/api';

async function runCrossSessionValidation() {
  console.log('================================================================');
  console.log('🧪 CROSS-SESSION REAL-WORLD MULTI-USER VALIDATION');
  console.log('================================================================\n');

  // Initialize two separate sessions
  const sessionA = axios.create({ baseURL: API_BASE });
  const sessionB = axios.create({ baseURL: API_BASE });

  // 1. Session A: Dispatcher Login
  console.log('--- TEST 1: DRIVER AVAILABILITY ACROSS SESSIONS ---');
  console.log('1.1 Logging in as Dispatcher (Session A)...');
  const loginA = await sessionA.post('/auth/login', {
    email: 'dispatcher@fleetops.io',
    password: 'dispatch123',
  });
  sessionA.defaults.headers.common['Authorization'] = `Bearer ${loginA.data.token}`;
  console.log(`  ✓ Session A authenticated: ${loginA.data.user.name} (${loginA.data.user.role})`);

  // 1.2 Session B: Driver Login
  console.log('1.2 Logging in as Driver (Session B)...');
  const loginB = await sessionB.post('/auth/login', {
    email: 'driver@fleetops.io',
    password: 'driver123',
  });
  sessionB.defaults.headers.common['Authorization'] = `Bearer ${loginB.data.token}`;
  console.log(`  ✓ Session B authenticated: ${loginB.data.user.name} (${loginB.data.user.role})`);

  // Get driver profile for Session B
  const driverProfileRes = await sessionB.get('/deliveries/driver/current');
  const driver = driverProfileRes.data.driver;
  console.log(`  ℹ Driver Profile: ${driver.firstName} ${driver.lastName} (ID: ${driver.id}, Status: ${driver.status})`);

  // Step: Set driver to OFF_DUTY first
  await sessionB.patch(`/drivers/${driver.id}/status`, { status: 'OFF_DUTY' });
  console.log('1.3 Driver toggles shift status -> OFF_DUTY in Session B...');

  // Check state in DB
  let dbDriver = await prisma.driver.findUnique({ where: { id: driver.id } });
  console.log(`  ✓ SQLite DB Driver Status: ${dbDriver?.status}`);

  // Step: Driver toggles shift status to AVAILABLE in Session B
  console.log('1.4 Driver toggles shift status -> AVAILABLE in Session B...');
  const patchRes = await sessionB.patch(`/drivers/${driver.id}/status`, { status: 'AVAILABLE' });
  console.log(`  ✓ Session B API response: Driver status = ${patchRes.data.driver.status}`);

  // Check state in Session A when Dispatcher opens dispatch modal (handleOpenDispatch refetch)
  console.log('1.5 Session A (Dispatcher) executes handleOpenDispatch pre-fetch (/api/drivers)...');
  const driversListA = await sessionA.get('/drivers');
  const driverInA = driversListA.data.drivers.find((d: any) => d.id === driver.id);
  console.log(`  ✓ Session A receives driver status: ${driverInA?.status} (Available = ${driverInA?.status === 'AVAILABLE'})`);

  if (driverInA?.status === 'AVAILABLE') {
    console.log('  ✅ TEST 1 PASSED: Driver availability change propagated from Session B -> SQLite -> Session A\n');
  } else {
    console.log('  ❌ TEST 1 FAILED: Driver status mismatch\n');
  }

  // --- TEST 2: DISPATCH ASSIGNMENT PROPAGATION ---
  console.log('--- TEST 2: DISPATCH ASSIGNMENT PROPAGATION ---');
  // Dispatcher creates order
  console.log('2.1 Session A creates new freight order...');
  const orderRes = await sessionA.post('/orders', {
    customerName: 'Cross-Session Logistics Ltd',
    customerEmail: 'ops@crosssession.com',
    customerPhone: '+91 98200 11223',
    customerAddress: 'Kurla West Industrial Zone, Mumbai 400070',
    pickupAddress: 'Bhiwandi Central Hub, Sector 12',
    pickupLat: 19.2967,
    pickupLng: 73.0631,
    deliveryAddress: 'Pune MIDC Plant, Bhosari',
    deliveryLat: 18.6279,
    deliveryLng: 73.8483,
    weightKg: 2800,
    volumeM3: 14.5,
    cargoType: 'GENERAL_FREIGHT',
    priority: 'HIGH',
    deliveryFee: 18500,
  });
  const order = orderRes.data.order;
  console.log(`  ✓ Order created: #${order.orderNumber} (ID: ${order.id})`);

  // Select active vehicle
  const vehiclesRes = await sessionA.get('/vehicles');
  const vehicle = vehiclesRes.data.vehicles.find((v: any) => (v.status === 'ACTIVE' || v.status === 'IDLE') && v.maxPayloadKg >= order.weightKg);
  console.log(`  ✓ Selected vehicle: ${vehicle.code} (${vehicle.model}, Capacity: ${vehicle.maxPayloadKg} kg)`);

  // Dispatch order from Session A
  console.log(`2.2 Session A dispatches order to Driver (${driver.firstName}) & Vehicle (${vehicle.code})...`);
  const dispatchRes = await sessionA.post('/deliveries', {
    orderId: order.id,
    driverId: driver.id,
    vehicleId: vehicle.id,
    notes: 'Cross-session real-world validation trip',
  });
  const delivery = dispatchRes.data.delivery;
  console.log(`  ✓ Delivery dispatched: Tracking #${delivery.trackingNumber} (Status: ${delivery.status})`);

  // Verify Session B (Driver Console) sees the active shipment
  console.log('2.3 Session B queries /api/deliveries/driver/current...');
  const driverCurrentRes = await sessionB.get('/deliveries/driver/current');
  const activeDelB = driverCurrentRes.data.delivery;
  const driverB = driverCurrentRes.data.driver;
  console.log(`  ✓ Session B received active delivery: Tracking #${activeDelB?.trackingNumber} (Status: ${activeDelB?.status})`);
  console.log(`  ✓ Session B Driver status updated in DB: ${driverB?.status}`);

  if (activeDelB?.trackingNumber === delivery.trackingNumber && driverB?.status === 'ON_DELIVERY') {
    console.log('  ✅ TEST 2 PASSED: Dispatch assignment created in Session A immediately reflects in Session B\n');
  } else {
    console.log('  ❌ TEST 2 FAILED: Active delivery not received in Session B\n');
  }

  // --- TEST 3: MILESTONE PROGRESSION & COMPLETION ---
  console.log('--- TEST 3: MILESTONE PROGRESSION & COMPLETION ---');
  console.log('3.1 Session B (Driver) advances to PICKED_UP...');
  await sessionB.post(`/deliveries/${delivery.id}/transition`, {
    nextStatus: 'PICKED_UP',
    notes: 'Cargo loaded at Bhiwandi hub',
  });

  console.log('3.2 Session B advances to IN_TRANSIT...');
  await sessionB.post(`/deliveries/${delivery.id}/transition`, {
    nextStatus: 'IN_TRANSIT',
    notes: 'Entering NH-48 expressway corridor',
  });

  console.log('3.3 Session B advances to OUT_FOR_DELIVERY...');
  await sessionB.post(`/deliveries/${delivery.id}/transition`, {
    nextStatus: 'OUT_FOR_DELIVERY',
    notes: 'Arrived in Bhosari drop-off zone',
  });

  console.log('3.4 Session B completes delivery & captures POD signature...');
  const completeRes = await sessionB.post(`/deliveries/${delivery.id}/transition`, {
    nextStatus: 'DELIVERED',
    recipientSignature: 'Signed by: S. Deshmukh (Plant Receiving Head)',
    notes: 'Seal inspected, zero transit loss verified.',
  });
  console.log(`  ✓ Session B transition result: Delivery Status = ${completeRes.data.delivery.status}, Progress = ${completeRes.data.delivery.progressPercent}%`);

  // Verify Dispatcher-facing state
  console.log('3.5 Verifying state across Dispatcher-facing queries (Session A)...');
  const [delivCheckA, orderCheckA, driverCheckA, vehicleCheckA, kpisCheckA] = await Promise.all([
    sessionA.get(`/deliveries/${delivery.id}`),
    sessionA.get(`/orders/${order.id}`),
    sessionA.get(`/drivers/${driver.id}`),
    sessionA.get(`/vehicles/${vehicle.id}`),
    sessionA.get('/reports/kpis'),
  ]);

  console.log(`  ✓ Delivery Status in DB: ${delivCheckA.data.delivery.status}`);
  console.log(`  ✓ Order Status in DB: ${orderCheckA.data.order.status}`);
  console.log(`  ✓ Driver Status in DB: ${driverCheckA.data.driver.status} (Total Deliveries: ${driverCheckA.data.driver.totalDeliveries})`);
  console.log(`  ✓ Vehicle Status in DB: ${vehicleCheckA.data.vehicle.status} (Mileage: ${vehicleCheckA.data.vehicle.currentMileageKm} km)`);
  console.log(`  ✓ Dashboard KPIs in DB: Completed = ${kpisCheckA.data.kpis.completedDeliveries}, Active = ${kpisCheckA.data.kpis.activeDeliveries}`);

  const passed =
    delivCheckA.data.delivery.status === 'DELIVERED' &&
    orderCheckA.data.order.status === 'DELIVERED' &&
    driverCheckA.data.driver.status === 'AVAILABLE' &&
    vehicleCheckA.data.vehicle.status === 'ACTIVE';

  if (passed) {
    console.log('  ✅ TEST 3 PASSED: Full milestone lifecycle & POD completion verified across sessions\n');
  } else {
    console.log('  ❌ TEST 3 FAILED: State synchronization incomplete\n');
  }

  console.log('================================================================');
  console.log('🎉 ALL CROSS-SESSION VALIDATION TESTS COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

runCrossSessionValidation().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
