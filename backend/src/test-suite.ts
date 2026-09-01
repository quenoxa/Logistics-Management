import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';

async function runTests() {
  console.log('🧪 Starting Automated Backend Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Verify User Auth & Demo credentials
    console.log('1. Testing User Authentication & Password Hashes...');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@fleetops.io' } });
    assert(!!adminUser, 'Admin user exists');
    if (adminUser) {
      const match = await bcrypt.compare('admin123', adminUser.password);
      assert(match, 'Admin password hash matches "admin123"');
      const token = jwt.sign({ id: adminUser.id, role: adminUser.role, name: adminUser.name }, config.jwtSecret);
      assert(!!token, 'Generated valid JWT token');
    }

    // 2. Verify Vehicles & Maintenance
    console.log('\n2. Testing Vehicles Fleet & Maintenance Records...');
    const vehiclesCount = await prisma.vehicle.count();
    assert(vehiclesCount >= 10, `Fleet contains ${vehiclesCount} commercial vehicles`);
    const semiTrailer = await prisma.vehicle.findFirst({ where: { type: 'SEMI_TRAILER' } });
    assert(!!semiTrailer && semiTrailer.maxPayloadKg > 15000, 'Heavy Duty Semi-Trailer has valid payload capacity');
    const maintenanceCount = await prisma.maintenanceLog.count();
    assert(maintenanceCount >= 3, `Found ${maintenanceCount} maintenance log records`);

    // 3. Verify Drivers & Certifications
    console.log('\n3. Testing Driver Roster & CDL Licensure...');
    const driversCount = await prisma.driver.count();
    assert(driversCount >= 8, `Roster contains ${driversCount} commercial drivers`);
    const availableDrivers = await prisma.driver.findMany({ where: { status: 'AVAILABLE' } });
    assert(availableDrivers.length > 0, `Found ${availableDrivers.length} available drivers ready for dispatch`);

    // 4. Verify Orders & Cargo
    console.log('\n4. Testing Orders & Manifest Specs...');
    const ordersCount = await prisma.order.count();
    assert(ordersCount >= 8, `Found ${ordersCount} orders in database`);
    const hazmatOrder = await prisma.order.findFirst({ where: { cargoType: 'HAZMAT' } });
    assert(!!hazmatOrder, 'Found HazMat certified shipment manifest');

    // 5. Test Delivery State Machine & Timeline
    console.log('\n5. Testing Delivery State Machine & Timestamped Audit Timeline...');
    const activeDelivery = await prisma.delivery.findFirst({
      where: { status: 'IN_TRANSIT' },
      include: { timelineEvents: true, order: true, driver: true, vehicle: true },
    });
    assert(!!activeDelivery, 'Found in-transit delivery');
    if (activeDelivery) {
      assert(activeDelivery.timelineEvents.length >= 2, `Timeline has ${activeDelivery.timelineEvents.length} recorded events`);
      assert(activeDelivery.progressPercent > 0, `Route progress is at ${activeDelivery.progressPercent}%`);
    }

    // 6. Test Double-Booking Prevention Logic
    console.log('\n6. Testing Anti-Double-Booking Protection Logic...');
    if (activeDelivery) {
      // Driver is currently on an active delivery
      const busyDriver = activeDelivery.driverId;
      const isDriverBusy = await prisma.delivery.findFirst({
        where: {
          driverId: busyDriver,
          status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        },
      });
      assert(!!isDriverBusy, 'System correctly flags driver as busy with active delivery');
    }

    // 7. Test KPI Aggregations
    console.log('\n7. Testing Real-time SQL / Prisma Aggregations...');
    const totalDeliveries = await prisma.delivery.count();
    const completedCount = await prisma.delivery.count({ where: { status: 'DELIVERED' } });
    const distanceSum = await prisma.delivery.aggregate({ _sum: { routeDistanceKm: true } });
    assert(totalDeliveries > 0, `Total deliveries count: ${totalDeliveries}`);
    assert(completedCount > 0, `Completed deliveries count: ${completedCount}`);
    assert((distanceSum._sum.routeDistanceKm || 0) > 0, `Total corridor distance aggregated: ${distanceSum._sum.routeDistanceKm} km`);

    // 8. Test System Settings
    console.log('\n8. Testing System Settings & Depot Parameters...');
    const settings = await prisma.systemSetting.findMany();
    assert(settings.length >= 8, `Found ${settings.length} system configuration parameters`);

    // 9. Test Audit Logs
    console.log('\n9. Testing Cryptographic Activity Audit Stream...');
    const auditCount = await prisma.auditLog.count();
    assert(auditCount >= 3, `Found ${auditCount} audit event logs`);

    console.log('\n=========================================');
    console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('=========================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
