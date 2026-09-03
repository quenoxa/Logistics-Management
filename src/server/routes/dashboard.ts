import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalDeliveries,
      pendingDeliveries,
      activeDeliveries,
      deliveredToday,
      failedDeliveries,
      availableDrivers,
      driversOnDelivery,
      availableVehicles,
      vehiclesInMaintenance,
    ] = await Promise.all([
      prisma.delivery.count(),
      prisma.delivery.count({ where: { status: 'PENDING' } }),
      prisma.delivery.count({
        where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
      }),
      prisma.delivery.count({
        where: {
          status: 'DELIVERED',
          actualDeliveryTime: { gte: todayStart },
        },
      }),
      prisma.delivery.count({ where: { status: 'FAILED' } }),
      prisma.driver.count({ where: { status: 'AVAILABLE' } }),
      prisma.driver.count({ where: { status: 'ON_DELIVERY' } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalDeliveries,
        pendingDeliveries,
        activeDeliveries,
        deliveredToday,
        failedDeliveries,
        availableDrivers,
        driversOnDelivery,
        availableVehicles,
        vehiclesInMaintenance,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/delivery-trends
router.get('/delivery-trends', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deliveries = await prisma.delivery.findMany({
      select: {
        status: true,
        createdAt: true,
      },
    });

    const statusCounts: Record<string, number> = {};
    deliveries.forEach((d) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });

    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    res.json({
      success: true,
      deliveryTrends: {
        byStatus,
        total: deliveries.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery trends' });
  }
});

// GET /api/dashboard/driver-performance
router.get('/driver-performance', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        totalDeliveries: true,
        rating: true,
        onTimeRatePercent: true,
      },
      orderBy: { totalDeliveries: 'desc' },
      take: 10,
    });

    res.json({ success: true, driverPerformance: drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch driver performance' });
  }
});

// GET /api/dashboard/vehicle-utilization
router.get('/vehicle-utilization', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        mileage: true,
      },
    });

    const statusCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
    });

    res.json({
      success: true,
      vehicleUtilization: {
        summaryByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        totalVehicles: vehicles.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle utilization' });
  }
});

export default router;
