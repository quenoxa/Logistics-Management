import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/issues
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, deliveryId, driverId } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority as string;
    }
    if (deliveryId) {
      where.deliveryId = deliveryId as string;
    }
    if (driverId) {
      where.driverId = driverId as string;
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        delivery: true,
        driver: true,
      },
    });

    res.json({ success: true, issues });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch issues' });
  }
});

// POST /api/issues (Drivers or Dispatchers report issue)
router.post('/', authenticateToken, requireRole('ADMIN', 'DISPATCHER', 'DRIVER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { deliveryId, driverId, type, description, priority = 'MEDIUM' } = req.body;

    if (!type || !description) {
      res.status(400).json({ success: false, message: 'Issue type and description are required' });
      return;
    }

    let assignedDriverId = driverId;
    if (!assignedDriverId && req.user?.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: {
          OR: [
            { userId: req.user.id },
            { email: req.user.email.toLowerCase() },
          ],
        },
      });
      if (driver) assignedDriverId = driver.id;
    }

    const issue = await prisma.issue.create({
      data: {
        deliveryId: deliveryId || null,
        driverId: assignedDriverId || null,
        type,
        description,
        priority,
        status: 'OPEN',
      },
      include: {
        delivery: true,
        driver: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        user: req.user?.name || 'User',
        action: 'REPORT_ISSUE',
        entity: 'ISSUE',
        entityType: 'ISSUE',
        entityId: issue.id,
        details: JSON.stringify({ type, description }),
      },
    });

    res.status(201).json({ success: true, issue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create issue' });
  }
});

// PATCH /api/issues/:id (Update status / details)
router.patch('/:id', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority, description } = req.body;

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(description && { description }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: { delivery: true, driver: true },
    });

    res.json({ success: true, issue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update issue' });
  }
});

// PATCH /api/issues/:id/resolve
router.patch('/:id/resolve', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: { delivery: true, driver: true },
    });

    res.json({ success: true, issue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to resolve issue' });
  }
});

export default router;
