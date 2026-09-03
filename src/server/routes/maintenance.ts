import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/maintenance
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, status, search } = req.query;

    const where: any = {};
    if (vehicleId && vehicleId !== 'ALL') {
      where.vehicleId = vehicleId as string;
    }
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { description: { contains: q } },
        { serviceType: { contains: q } },
        { type: { contains: q } },
        { vehicle: { code: { contains: q } } },
      ];
    }

    const records = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { maintenanceDate: 'desc' },
      include: {
        vehicle: true,
      },
    });

    res.json({ success: true, records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance records' });
  }
});

// POST /api/maintenance
router.post('/', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, type = 'PREVENTATIVE', serviceType = 'PREVENTATIVE', description, cost, maintenanceDate, nextDueDate, status = 'SCHEDULED' } = req.body;

    if (!vehicleId || !description || cost === undefined) {
      res.status(400).json({ success: false, message: 'Vehicle, description, and cost are required' });
      return;
    }

    const record = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.create({
        data: {
          vehicleId,
          type,
          serviceType,
          description,
          cost: Number(cost),
          maintenanceDate: maintenanceDate ? new Date(maintenanceDate) : new Date(),
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
          status,
        },
        include: { vehicle: true },
      });

      // Update vehicle status if in maintenance or scheduled
      if (['IN_PROGRESS', 'SCHEDULED'].includes(status)) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: {
            status: 'MAINTENANCE',
            lastMaintenanceDate: new Date(),
            ...(nextDueDate && { nextMaintenanceDate: new Date(nextDueDate) }),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          user: req.user?.name || 'System',
          action: 'CREATE',
          entity: 'MAINTENANCE',
          entityType: 'MAINTENANCE',
          entityId: log.id,
          details: JSON.stringify({ vehicleId, description, cost }),
        },
      });

      return log;
    });

    res.status(201).json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create maintenance record' });
  }
});

// PUT /api/maintenance/:id
router.put('/:id', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, cost, status, nextDueDate } = req.body;

    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: {
          ...(description && { description }),
          ...(cost !== undefined && { cost: Number(cost) }),
          ...(status && { status }),
          ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
        },
        include: { vehicle: true },
      });

      if (status === 'COMPLETED') {
        await tx.vehicle.update({
          where: { id: updated.vehicleId },
          data: {
            status: 'AVAILABLE',
            lastMaintenanceDate: new Date(),
          },
        });
      }

      return updated;
    });

    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update maintenance record' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.maintenanceLog.delete({ where: { id } });
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete maintenance record' });
  }
});

export default router;
