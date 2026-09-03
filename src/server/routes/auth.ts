import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const DEMO_FALLBACK_USERS: Record<string, { id: string; email: string; pass: string; name: string; role: string; avatar: string }> = {
  'admin@fleetops.io': { id: 'demo-admin-id', email: 'admin@fleetops.io', pass: 'admin123', name: 'Rajesh Sharma', role: 'ADMIN', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  'dispatcher@fleetops.io': { id: 'demo-dispatch-id', email: 'dispatcher@fleetops.io', pass: 'dispatch123', name: 'Priya Nair', role: 'DISPATCHER', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  'ops@fleetops.io': { id: 'demo-ops-id', email: 'ops@fleetops.io', pass: 'ops123', name: 'Anand Verma', role: 'DISPATCHER', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  'driver@fleetops.io': { id: 'demo-driver-id', email: 'driver@fleetops.io', pass: 'driver123', name: 'Vikram Singh', role: 'DRIVER', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  'viewer@example.com': { id: 'demo-viewer-id', email: 'viewer@example.com', pass: 'password123', name: 'Viewer Account', role: 'VIEWER', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
};

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } catch (dbErr) {
      console.warn('Prisma DB lookup error, checking fallback demo accounts:', dbErr);
    }

    // Fallback for Vercel serverless demo environment if DB is uninitialized or user missing
    if (!user && DEMO_FALLBACK_USERS[cleanEmail]) {
      const fb = DEMO_FALLBACK_USERS[cleanEmail];
      if (password === fb.pass || password === 'admin123' || password === 'dispatch123' || password === 'driver123' || password === 'password123') {
        const token = jwt.sign(
          { id: fb.id, email: fb.email, role: fb.role, name: fb.name },
          config.jwtSecret,
          { expiresIn: '7d' }
        );
        res.json({
          token,
          user: {
            id: fb.id,
            email: fb.email,
            name: fb.name,
            role: fb.role,
            avatar: fb.avatar,
            status: 'ACTIVE',
          },
        });
        return;
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: `Account is ${user.status.toLowerCase()}` });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      // Check fallback password match for demo users
      if (DEMO_FALLBACK_USERS[cleanEmail] && password === DEMO_FALLBACK_USERS[cleanEmail].pass) {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
          config.jwtSecret,
          { expiresIn: '7d' }
        );
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            status: user.status,
          },
        });
        return;
      }

      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Audit log (fail-safe)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'LOGIN',
          entityType: 'USER',
          entityId: user.id,
          details: JSON.stringify({ email: user.email, role: user.role }),
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch {}

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Demo Login (quick switcher for Admin, Dispatcher, Driver, Viewer)
router.post('/demo-login', async (req, res): Promise<void> => {
  try {
    const { role } = req.body; // 'ADMIN', 'DISPATCHER', 'DRIVER', 'VIEWER'
    const targetRole = role ? role.toUpperCase() : 'ADMIN';

    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: { role: targetRole },
      });
    } catch {}

    if (!user) {
      const fb = Object.values(DEMO_FALLBACK_USERS).find((u) => u.role === targetRole) || DEMO_FALLBACK_USERS['admin@fleetops.io'];
      const token = jwt.sign(
        { id: fb.id, email: fb.email, role: fb.role, name: fb.name },
        config.jwtSecret,
        { expiresIn: '7d' }
      );
      res.json({
        token,
        user: {
          id: fb.id,
          email: fb.email,
          name: fb.name,
          role: fb.role,
          avatar: fb.avatar,
          status: 'ACTIVE',
        },
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to authenticate demo account' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role: role || 'DISPATCHER',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
