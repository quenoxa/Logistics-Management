import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// List all vehicles with optional filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, type, search, sort = 'code', order = 'asc' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (type && type !== 'ALL') {
      where.type = type as string;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { code: { contains: q } },
        { make: { contains: q } },
        { model: { contains: q } },
        { licensePlate: { contains: q } },
        { vin: { contains: q } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort as string] = order === 'desc' ? 'desc' : 'asc';

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy,
      include: {
        assignedDriver: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
        _count: {
          select: {
            maintenanceLogs: true,
            deliveries: true,
          },
        },
      },
    });

    res.json({ vehicles });
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get single vehicle details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        assignedDriver: true,
        maintenanceLogs: {
          orderBy: { serviceDate: 'desc' },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            order: true,
            driver: true,
          },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json({ vehicle });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch vehicle details' });
  }
});

// Create vehicle
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      vin,
      make,
      model,
      year,
      licensePlate,
      type,
      status = 'ACTIVE',
      maxPayloadKg,
      maxVolumeM3,
      fuelType,
      currentFuelPercent = 100,
      currentMileageKm = 0,
      currentLat,
      currentLng,
      assignedDriverId,
      notes,
    } = req.body;

    if (!code || !vin || !make || !model || !year || !licensePlate || !type || !maxPayloadKg || !fuelType) {
      res.status(400).json({ error: 'Missing required vehicle fields' });
      return;
    }

    // Check code/plate/vin uniqueness
    const existing = await prisma.vehicle.findFirst({
      where: {
        OR: [
          { code },
          { vin },
          { licensePlate },
        ],
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Vehicle with this Code, VIN, or License Plate already exists' });
      return;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        code,
        vin,
        make,
        model,
        year: Number(year),
        licensePlate,
        type,
        status,
        maxPayloadKg: Number(maxPayloadKg),
        maxVolumeM3: Number(maxVolumeM3 || 0),
        fuelType,
        currentFuelPercent: Number(currentFuelPercent),
        currentMileageKm: Number(currentMileageKm),
        currentLat: currentLat ? Number(currentLat) : 40.7128,
        currentLng: currentLng ? Number(currentLng) : -74.0060,
        assignedDriverId: assignedDriverId || null,
        notes,
      },
      include: {
        assignedDriver: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'CREATE',
        entityType: 'VEHICLE',
        entityId: vehicle.id,
        details: JSON.stringify({ code: vehicle.code, make: vehicle.make, model: vehicle.model }),
      },
    });

    res.status(201).json({ vehicle });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.year) updateData.year = Number(updateData.year);
    if (updateData.maxPayloadKg) updateData.maxPayloadKg = Number(updateData.maxPayloadKg);
    if (updateData.maxVolumeM3) updateData.maxVolumeM3 = Number(updateData.maxVolumeM3);
    if (updateData.currentFuelPercent !== undefined) updateData.currentFuelPercent = Number(updateData.currentFuelPercent);
    if (updateData.currentMileageKm !== undefined) updateData.currentMileageKm = Number(updateData.currentMileageKm);
    if (updateData.currentLat !== undefined) updateData.currentLat = Number(updateData.currentLat);
    if (updateData.currentLng !== undefined) updateData.currentLng = Number(updateData.currentLng);

    // Prevent assignedDriverId collision
    if (updateData.assignedDriverId === '') {
      updateData.assignedDriverId = null;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        assignedDriver: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'UPDATE',
        entityType: 'VEHICLE',
        entityId: vehicle.id,
        details: JSON.stringify(updateData),
      },
    });

    res.json({ vehicle });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if vehicle is assigned to active delivery
    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        vehicleId: id,
        status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
    });

    if (activeDelivery) {
      res.status(400).json({ error: 'Cannot delete vehicle while assigned to an active delivery' });
      return;
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'DELETE',
        entityType: 'VEHICLE',
        entityId: id,
      },
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Add Maintenance Log
router.post('/:id/maintenance', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { serviceType, description, cost, odometerKm, serviceDate, performedBy, status = 'COMPLETED' } = req.body;

    if (!serviceType || !description || cost === undefined || odometerKm === undefined) {
      res.status(400).json({ error: 'Missing required maintenance log fields' });
      return;
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        vehicleId: id,
        serviceType,
        description,
        cost: Number(cost),
        odometerKm: Number(odometerKm),
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        performedBy: performedBy || req.user?.name || 'In-house Service Depot',
        status,
      },
    });

    // Update vehicle mileage / status if in maintenance
    if (status === 'IN_PROGRESS') {
      await prisma.vehicle.update({
        where: { id },
        data: { status: 'MAINTENANCE' },
      });
    } else if (status === 'COMPLETED') {
      await prisma.vehicle.update({
        where: { id },
        data: {
          lastServiceDate: new Date(),
          currentMileageKm: Math.max(Number(odometerKm), 0),
        },
      });
    }

    res.status(201).json({ log });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

// Update Maintenance Log
router.put('/maintenance/:logId', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { logId } = req.params;
    const { status, cost, description, performedBy } = req.body;

    const log = await prisma.maintenanceLog.update({
      where: { id: logId },
      data: {
        ...(status && { status }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(description && { description }),
        ...(performedBy && { performedBy }),
      },
    });

    res.json({ log });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update maintenance log' });
  }
});

export default router;
