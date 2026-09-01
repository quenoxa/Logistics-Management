import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Default initial settings
const DEFAULT_SETTINGS = [
  { key: 'company_name', value: 'LogisticsOne India Pvt Ltd', category: 'COMPANY', description: 'Organization name displayed across documents and dispatch manifest' },
  { key: 'company_code', value: 'L1-IND-01', category: 'COMPANY', description: 'Central dispatch operations identifier' },
  { key: 'depot_address', value: 'Bhiwandi Central Logistics Hub, Sector 18, Thane, Maharashtra 421302', category: 'COMPANY', description: 'Primary hub depot address' },
  { key: 'depot_lat', value: '19.2967', category: 'COMPANY', description: 'Primary depot latitude coordinates' },
  { key: 'depot_lng', value: '73.0631', category: 'COMPANY', description: 'Primary depot longitude coordinates' },
  { key: 'auto_dispatch_enabled', value: 'true', category: 'DISPATCH', description: 'Enable intelligent algorithm auto-matching for incoming orders' },
  { key: 'max_driver_hours_per_day', value: '11', category: 'DISPATCH', description: 'DOT compliance limit for active driver hours per 24h cycle' },
  { key: 'delay_threshold_minutes', value: '15', category: 'ALERTS', description: 'Trigger priority warning if ETA exceeds scheduled time by minutes' },
  { key: 'speed_alert_kmh', value: '110', category: 'ALERTS', description: 'Telematics speed limit trigger for fleet vehicles' },
  { key: 'low_fuel_alert_percent', value: '15', category: 'ALERTS', description: 'Trigger refueling dispatch notice when tank drops below threshold' },
  { key: 'notify_email_dispatch', value: 'true', category: 'NOTIFICATIONS', description: 'Send real-time alerts on urgent order assignment' },
  { key: 'notify_sms_customer', value: 'true', category: 'NOTIFICATIONS', description: 'Send automated SMS tracking link to customers upon dispatch' },
  { key: 'units_system', value: 'METRIC', category: 'GENERAL', description: 'Default measurement unit system (METRIC / IMPERIAL)' },
];

// Get all settings
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });

    if (settings.length === 0) {
      for (const s of DEFAULT_SETTINGS) {
        await prisma.systemSetting.create({ data: s });
      }
      settings = await prisma.systemSetting.findMany({
        orderBy: { category: 'asc' },
      });
    }

    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update single setting
router.put('/:key', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        category: 'GENERAL',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'UPDATE',
        entityType: 'SETTING',
        entityId: key,
        details: JSON.stringify({ key, value }),
      },
    });

    res.json({ setting });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Bulk update settings
router.post('/bulk', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { settings } = req.body; // array of { key, value }

    if (!Array.isArray(settings)) {
      res.status(400).json({ error: 'Settings must be an array' });
      return;
    }

    for (const item of settings) {
      if (item.key && item.value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: {
            key: item.key,
            value: String(item.value),
            category: item.category || 'GENERAL',
            description: item.description,
          },
        });
      }
    }

    res.json({ message: 'Settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to bulk update settings' });
  }
});

export default router;
