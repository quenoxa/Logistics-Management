import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

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
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Audit log
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

// Demo Login (quick switcher for Admin, Dispatcher, Fleet Manager, Driver)
router.post('/demo-login', async (req, res): Promise<void> => {
  try {
    const { role } = req.body; // 'ADMIN', 'DISPATCHER', 'FLEET_MANAGER', 'DRIVER'
    const targetRole = role ? role.toUpperCase() : 'ADMIN';

    const user = await prisma.user.findFirst({
      where: { role: targetRole },
    });

    if (!user) {
      res.status(404).json({ error: `No demo user found for role: ${targetRole}` });
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
