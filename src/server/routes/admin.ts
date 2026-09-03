import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect all admin routes for ADMIN only
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// List users
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'DISPATCHER', status = 'ACTIVE' } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const ALLOWED_ROLES = ['ADMIN', 'DISPATCHER', 'DRIVER', 'VIEWER'];
    if (role && !ALLOWED_ROLES.includes(role)) {
      res.status(400).json({ error: `Invalid role: '${role}'. Allowed roles are: ADMIN, DISPATCHER, DRIVER, VIEWER` });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role,
        status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'Admin',
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    res.status(201).json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (role, status, name, password)
router.put('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, status, password } = req.body;

    const ALLOWED_ROLES = ['ADMIN', 'DISPATCHER', 'DRIVER', 'VIEWER'];
    if (role && !ALLOWED_ROLES.includes(role)) {
      res.status(400).json({ error: `Invalid role: '${role}'. Allowed roles are: ADMIN, DISPATCHER, DRIVER, VIEWER` });
      return;
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (role) dataToUpdate.role = role;
    if (status) dataToUpdate.status = status;
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'Admin',
        action: 'UPDATE',
        entityType: 'USER',
        entityId: id,
        details: JSON.stringify({ role, status, nameUpdated: !!name }),
      },
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      res.status(400).json({ error: 'Cannot delete your own active administrator account' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'Admin',
        action: 'DELETE',
        entityType: 'USER',
        entityId: id,
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Audit Logs list with filters
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { action, entityType, search, limit = 50 } = req.query;

    const where: any = {};
    if (action && action !== 'ALL') {
      where.action = action as string;
    }
    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType as string;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { userName: { contains: q } },
        { action: { contains: q } },
        { details: { contains: q } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        userRef: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.json({ auditLogs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// System Diagnostics & Database Health
router.get('/system-health', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      usersCount,
      vehiclesCount,
      driversCount,
      ordersCount,
      deliveriesCount,
      logsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.driver.count(),
      prisma.order.count(),
      prisma.delivery.count(),
      prisma.auditLog.count(),
    ]);

    const memoryUsage = process.memoryUsage();

    res.json({
      health: {
        status: 'OPTIMAL',
        uptimeSeconds: Math.floor(process.uptime()),
        databaseEngine: 'SQLite / Prisma ORM v5',
        timestamp: new Date().toISOString(),
        memory: {
          heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
          rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        },
        entities: {
          users: usersCount,
          vehicles: vehiclesCount,
          drivers: driversCount,
          orders: ordersCount,
          deliveries: deliveriesCount,
          auditLogs: logsCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve system health' });
  }
});

export default router;
