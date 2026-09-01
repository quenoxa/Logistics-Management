import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// List drivers
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, licenseClass, search, sort = 'code', order = 'asc' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (licenseClass && licenseClass !== 'ALL') {
      where.licenseClass = licenseClass as string;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { code: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { licenseNumber: { contains: q } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort as string] = order === 'desc' ? 'desc' : 'asc';

    const drivers = await prisma.driver.findMany({
      where,
      orderBy,
      include: {
        currentVehicle: {
          select: {
            id: true,
            code: true,
            make: true,
            model: true,
            type: true,
            status: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    res.json({ drivers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Single driver details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        currentVehicle: true,
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            order: true,
            vehicle: true,
          },
        },
      },
    });

    if (!driver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    res.json({ driver });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch driver details' });
  }
});

// Create driver
router.post('/', authenticateToken, requireRole('ADMIN', 'FLEET_MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseClass = 'CDL_A',
      licenseExpiry,
      status = 'AVAILABLE',
      emergencyContact,
      currentVehicleId,
    } = req.body;

    if (!code || !firstName || !lastName || !email || !phone || !licenseNumber || !licenseExpiry) {
      res.status(400).json({ error: 'Missing required driver fields' });
      return;
    }

    const existing = await prisma.driver.findFirst({
      where: {
        OR: [
          { code },
          { email: email.toLowerCase() },
          { licenseNumber },
        ],
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Driver with this Code, Email, or License Number already exists' });
      return;
    }

    const driver = await prisma.driver.create({
      data: {
        code,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        licenseNumber,
        licenseClass,
        licenseExpiry: new Date(licenseExpiry),
        status,
        emergencyContact,
      },
    });

    // If currentVehicleId provided, link vehicle
    if (currentVehicleId) {
      await prisma.vehicle.update({
        where: { id: currentVehicleId },
        data: { assignedDriverId: driver.id },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'CREATE',
        entityType: 'DRIVER',
        entityId: driver.id,
        details: JSON.stringify({ code: driver.code, name: `${driver.firstName} ${driver.lastName}` }),
      },
    });

    res.status(201).json({ driver });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Update driver
router.put('/:id', authenticateToken, requireRole('ADMIN', 'FLEET_MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseClass,
      licenseExpiry,
      status,
      rating,
      emergencyContact,
      currentVehicleId,
    } = req.body;

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone && { phone }),
        ...(licenseNumber && { licenseNumber }),
        ...(licenseClass && { licenseClass }),
        ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
        ...(status && { status }),
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(emergencyContact !== undefined && { emergencyContact }),
      },
    });

    // Handle vehicle assignment update
    if (currentVehicleId !== undefined) {
      // Clear previous vehicle assignment
      await prisma.vehicle.updateMany({
        where: { assignedDriverId: id },
        data: { assignedDriverId: null },
      });

      if (currentVehicleId) {
        await prisma.vehicle.update({
          where: { id: currentVehicleId },
          data: { assignedDriverId: id },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'UPDATE',
        entityType: 'DRIVER',
        entityId: driver.id,
      },
    });

    res.json({ driver });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// Toggle driver status
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'ON_DELIVERY', 'OFF_DUTY', 'ON_LEAVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ error: 'Invalid driver status' });
      return;
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { status },
    });

    res.json({ driver });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle driver status' });
  }
});

// Delete driver
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'FLEET_MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        driverId: id,
        status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
    });

    if (activeDelivery) {
      res.status(400).json({ error: 'Cannot delete driver with active in-progress deliveries' });
      return;
    }

    // Unassign any vehicle
    await prisma.vehicle.updateMany({
      where: { assignedDriverId: id },
      data: { assignedDriverId: null },
    });

    await prisma.driver.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'DELETE',
        entityType: 'DRIVER',
        entityId: id,
      },
    });

    res.json({ message: 'Driver deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

export default router;
