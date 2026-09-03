import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Calculate distance between two coordinates using Haversine formula (in km)
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

// Strict state transition rules
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ASSIGNED', 'DISPATCHED', 'ACCEPTED', 'CANCELLED', 'FAILED'],
  ASSIGNED: ['ACCEPTED', 'PICKED_UP', 'CANCELLED', 'FAILED'],
  DISPATCHED: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'CANCELLED', 'FAILED'],
  ACCEPTED: ['PICKED_UP', 'IN_TRANSIT', 'CANCELLED', 'FAILED'],
  PICKED_UP: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CANCELLED', 'FAILED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED', 'CANCELLED'],
  DELIVERED: [],
  FAILED: ['PENDING', 'ASSIGNED', 'CANCELLED'],
  CANCELLED: [],
};

// List all deliveries with search, filter, sorting, pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, driverId, vehicleId, search, sort = 'createdAt', order = 'desc', page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority as string;
    }
    if (driverId && driverId !== 'ALL') {
      where.driverId = driverId as string;
    }
    if (vehicleId && vehicleId !== 'ALL') {
      where.vehicleId = vehicleId as string;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { trackingNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { pickupAddress: { contains: q, mode: 'insensitive' } },
        { deliveryAddress: { contains: q, mode: 'insensitive' } },
        { packageDescription: { contains: q, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['createdAt', 'updatedAt', 'status', 'priority', 'trackingNumber', 'customerName'];
    const sortField = validSortFields.includes(sort as string) ? (sort as string) : 'createdAt';
    const orderBy: any = {};
    orderBy[sortField] = order === 'asc' ? 'asc' : 'desc';

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          driver: true,
          vehicle: true,
          order: true,
          statusHistory: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          _count: {
            select: { timelineEvents: true, statusHistory: true },
          },
        },
      }),
      prisma.delivery.count({ where }),
    ]);

    res.json({
      success: true,
      deliveries,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('[GET /api/deliveries] Error:', error?.message || error);
    res.status(500).json({ success: false, message: 'Failed to fetch deliveries', detail: error?.message });
  }
});

// Helper to resolve driver for authenticated user
async function resolveDriverForUser(user: { id?: string; email?: string; role?: string; name?: string } | undefined) {
  if (!user) return null;

  let driver = await prisma.driver.findFirst({
    where: {
      OR: [
        ...(user.id ? [{ userId: user.id }] : []),
        ...(user.email ? [{ email: user.email.toLowerCase().trim() }] : []),
      ],
    },
  });

  if (driver) return driver;

  if (user.name) {
    const firstName = user.name.trim().split(' ')[0];
    if (firstName && firstName.length > 1) {
      driver = await prisma.driver.findFirst({
        where: {
          firstName: { contains: firstName },
        },
      });
      if (driver) return driver;
    }
  }

  return await prisma.driver.findFirst({
    orderBy: { code: 'asc' },
  });
}

// Get current active delivery for logged-in driver
router.get('/driver/current', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const driver = await resolveDriverForUser(req.user);

    if (!driver) {
      res.json({ success: true, delivery: null, driver: null });
      return;
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: {
        vehicle: true,
        driver: true,
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
        timelineEvents: {
          orderBy: { recordedAt: 'asc' },
        },
        issues: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, delivery, driver });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch driver active delivery' });
  }
});

// Get driver delivery history
router.get('/driver/history', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const driver = await resolveDriverForUser(req.user);

    if (!driver) {
      res.json({ success: true, history: [], driver: null });
      return;
    }

    const history = await prisma.delivery.findMany({
      where: {
        driverId: driver.id,
      },
      include: {
        vehicle: true,
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, history, driver });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch driver history' });
  }
});

// Single delivery details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
        order: true,
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
        timelineEvents: {
          orderBy: { recordedAt: 'asc' },
        },
        issues: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery not found' });
      return;
    }

    if (req.user?.role === 'DRIVER') {
      if (!delivery.driver || delivery.driver.userId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Drivers can only view their own assigned deliveries' });
        return;
      }
    }

    res.json({ success: true, delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery details' });
  }
});

// Delivery status history logs
router.get('/:id/history', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const history = await prisma.deliveryStatusHistory.findMany({
      where: { deliveryId: id },
      orderBy: { timestamp: 'desc' },
    });
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch status history' });
  }
});

// Create delivery (supports both / and /dispatch)
router.post(['/', '/dispatch'], authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let {
      orderId,
      customerName,
      customerPhone,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      packageDescription,
      packageWeight,
      priority = 'STANDARD',
      driverId,
      vehicleId,
      estimatedDeliveryTime,
      notes,
    } = req.body;

    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        customerName = customerName || order.customerName;
        customerPhone = customerPhone || order.customerPhone;
        pickupAddress = pickupAddress || order.pickupAddress;
        pickupLatitude = pickupLatitude ?? order.pickupLat;
        pickupLongitude = pickupLongitude ?? order.pickupLng;
        deliveryAddress = deliveryAddress || order.deliveryAddress;
        deliveryLatitude = deliveryLatitude ?? order.deliveryLat;
        deliveryLongitude = deliveryLongitude ?? order.deliveryLng;
        packageDescription = packageDescription || order.cargoType || 'General Freight';
        packageWeight = packageWeight ?? order.weightKg;
        priority = priority || order.priority;
      }
    }

    if (!customerName || !pickupAddress || !deliveryAddress) {
      res.status(400).json({ success: false, message: 'Missing required delivery fields (customerName, pickupAddress, deliveryAddress)' });
      return;
    }

    // Eligibility check if driver provided
    if (driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (!driver || driver.status === 'SUSPENDED' || driver.status === 'OFF_DUTY') {
        res.status(400).json({ success: false, message: `Driver is currently ${driver?.status || 'unavailable'} and cannot be assigned.` });
        return;
      }

      const activeDriverDel = await prisma.delivery.findFirst({
        where: {
          driverId,
          status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        },
      });

      if (activeDriverDel) {
        res.status(409).json({ success: false, message: `Driver is already assigned to active delivery #${activeDriverDel.trackingNumber}` });
        return;
      }
    }

    // Eligibility check if vehicle provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle || vehicle.status === 'MAINTENANCE' || vehicle.status === 'INACTIVE') {
        res.status(400).json({ success: false, message: `Vehicle is currently in ${vehicle?.status || 'maintenance'} status and cannot be assigned.` });
        return;
      }

      const activeVehicleDel = await prisma.delivery.findFirst({
        where: {
          vehicleId,
          status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        },
      });

      if (activeVehicleDel) {
        res.status(409).json({ success: false, message: `Vehicle is already assigned to active delivery #${activeVehicleDel.trackingNumber}` });
        return;
      }
    }

    const pLat = Number(pickupLatitude || 40.7128);
    const pLng = Number(pickupLongitude || -74.0060);
    const dLat = Number(deliveryLatitude || 40.7306);
    const dLng = Number(deliveryLongitude || -73.9352);

    const distKm = calculateDistanceKm(pLat, pLng, dLat, dLng);
    const durationMin = Math.round((distKm / 45) * 60) + 20;

    const trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const initialStatus = (driverId && vehicleId) ? 'ASSIGNED' : 'PENDING';

    const delivery = await prisma.$transaction(async (tx) => {
      const del = await tx.delivery.create({
        data: {
          trackingNumber,
          orderId: orderId || null,
          customerName,
          customerPhone: customerPhone || '+1-555-0199',
          pickupAddress,
          pickupLatitude: pLat,
          pickupLongitude: pLng,
          deliveryAddress,
          deliveryLatitude: dLat,
          deliveryLongitude: dLng,
          packageDescription,
          packageWeight: Number(packageWeight || 10),
          priority,
          status: driverId && vehicleId ? 'DISPATCHED' : initialStatus,
          driverId: driverId || null,
          vehicleId: vehicleId || null,
          estimatedDeliveryTime: estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : new Date(Date.now() + durationMin * 60 * 1000),
          deliveryEstimatedAt: estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : new Date(Date.now() + durationMin * 60 * 1000),
          currentLat: pLat,
          currentLng: pLng,
          routeDistanceKm: distKm,
          routeDurationMin: durationMin,
          notes,
        },
        include: { driver: true, vehicle: true },
      });

      if (orderId) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'ASSIGNED' },
        });
      }

      if (driverId) {
        await tx.driver.update({
          where: { id: driverId },
          data: { status: 'ON_DELIVERY' },
        });
      }

      if (vehicleId) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: 'ASSIGNED', currentLat: pLat, currentLng: pLng },
        });
      }

      // Record initial status history
      const createdStatus = driverId && vehicleId ? 'DISPATCHED' : initialStatus;
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: del.id,
          status: createdStatus,
          note: `Delivery created (${createdStatus})`,
          latitude: pLat,
          longitude: pLng,
          updatedBy: req.user?.name || 'Dispatcher',
        },
      });

      // Record initial timeline event
      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId: del.id,
          status: createdStatus,
          title: `Delivery ${createdStatus}`,
          description: `Delivery dispatched to driver & vehicle`,
          locationName: pickupAddress,
          lat: pLat,
          lng: pLng,
          recordedBy: req.user?.name || 'Dispatcher',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          user: req.user?.name || 'System',
          action: 'CREATE',
          entity: 'DELIVERY',
          entityType: 'DELIVERY',
          entityId: del.id,
          details: JSON.stringify({ trackingNumber, initialStatus }),
        },
      });

      return del;
    });

    res.status(201).json({ success: true, delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create delivery' });
  }
});

// Edit Delivery
router.put('/:id', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, pickupAddress, deliveryAddress, packageDescription, packageWeight, priority, notes } = req.body;

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
        ...(pickupAddress && { pickupAddress }),
        ...(deliveryAddress && { deliveryAddress }),
        ...(packageDescription && { packageDescription }),
        ...(packageWeight !== undefined && { packageWeight: Number(packageWeight) }),
        ...(priority && { priority }),
        ...(notes !== undefined && { notes }),
      },
      include: { driver: true, vehicle: true },
    });

    res.json({ success: true, delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update delivery' });
  }
});

// Delete Delivery
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const del = await prisma.delivery.findUnique({ where: { id } });
    if (!del) {
      res.status(404).json({ success: false, message: 'Delivery not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Free driver and vehicle if active
      if (del.driverId) {
        await tx.driver.update({ where: { id: del.driverId }, data: { status: 'AVAILABLE' } });
      }
      if (del.vehicleId) {
        await tx.vehicle.update({ where: { id: del.vehicleId }, data: { status: 'AVAILABLE' } });
      }

      await tx.delivery.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Delivery deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete delivery' });
  }
});

// Assign Driver
router.post('/:id/assign-driver', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      res.status(400).json({ success: false, message: 'Driver ID is required' });
      return;
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.status === 'SUSPENDED' || driver.status === 'OFF_DUTY') {
      res.status(400).json({ success: false, message: `Driver is currently ${driver?.status || 'unavailable'} and cannot be assigned.` });
      return;
    }

    const activeDel = await prisma.delivery.findFirst({
      where: {
        driverId,
        id: { not: id },
        status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
    });

    if (activeDel) {
      res.status(409).json({ success: false, message: `Driver is already assigned to active delivery #${activeDel.trackingNumber}` });
      return;
    }

    const delivery = await prisma.$transaction(async (tx) => {
      const del = await tx.delivery.update({
        where: { id },
        data: {
          driverId,
          status: 'ASSIGNED',
        },
        include: { driver: true, vehicle: true },
      });

      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'ON_DELIVERY' },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          status: 'ASSIGNED',
          note: `Assigned driver ${driver.firstName} ${driver.lastName}`,
          updatedBy: req.user?.name || 'Dispatcher',
        },
      });

      return del;
    });

    res.json({ success: true, delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to assign driver' });
  }
});

// Assign Vehicle
router.post('/:id/assign-vehicle', authenticateToken, requireRole('ADMIN', 'DISPATCHER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { vehicleId } = req.body;

    if (!vehicleId) {
      res.status(400).json({ success: false, message: 'Vehicle ID is required' });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.status === 'MAINTENANCE' || vehicle.status === 'INACTIVE') {
      res.status(400).json({ success: false, message: `Vehicle is in ${vehicle?.status || 'maintenance'} status and cannot be assigned.` });
      return;
    }

    const activeDel = await prisma.delivery.findFirst({
      where: {
        vehicleId,
        id: { not: id },
        status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
    });

    if (activeDel) {
      res.status(409).json({ success: false, message: `Vehicle is already assigned to active delivery #${activeDel.trackingNumber}` });
      return;
    }

    const delivery = await prisma.$transaction(async (tx) => {
      const del = await tx.delivery.update({
        where: { id },
        data: {
          vehicleId,
        },
        include: { driver: true, vehicle: true },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'ASSIGNED' },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          status: del.status,
          note: `Assigned vehicle ${vehicle.code}`,
          updatedBy: req.user?.name || 'Dispatcher',
        },
      });

      return del;
    });

    res.json({ success: true, delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to assign vehicle' });
  }
});

// Status Transition / Patch endpoint
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status: nextStatus, note, recipientSignature, delayReason, latitude, longitude } = req.body;

    if (!nextStatus) {
      res.status(400).json({ success: false, message: 'Target status is required' });
      return;
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { driver: true, vehicle: true },
    });

    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery not found' });
      return;
    }

    if (req.user?.role === 'VIEWER') {
      res.status(403).json({ success: false, message: 'Forbidden: Viewer cannot mutate delivery status' });
      return;
    }

    if (req.user?.role === 'DRIVER') {
      if (!delivery.driver || delivery.driver.userId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: Drivers can only transition their own assigned deliveries' });
        return;
      }
    }

    const currentStatus = delivery.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: ${allowed.join(', ') || 'None'}`,
      });
      return;
    }

    let progressPercent = delivery.progressPercent;
    let actualDeliveryTime = delivery.actualDeliveryTime;
    let pickupActualAt = delivery.pickupActualAt;

    switch (nextStatus) {
      case 'ACCEPTED':
        progressPercent = 10.0;
        break;
      case 'PICKED_UP':
        progressPercent = 25.0;
        pickupActualAt = pickupActualAt || new Date();
        break;
      case 'IN_TRANSIT':
        progressPercent = 50.0;
        break;
      case 'OUT_FOR_DELIVERY':
        progressPercent = 80.0;
        break;
      case 'DELIVERED':
        progressPercent = 100.0;
        actualDeliveryTime = new Date();
        break;
    }

    const updatedDelivery = await prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({
        where: { id },
        data: {
          status: nextStatus,
          progressPercent,
          pickupActualAt,
          actualDeliveryTime,
          deliveryActualAt: actualDeliveryTime,
          ...(latitude !== undefined && { currentLat: Number(latitude) }),
          ...(longitude !== undefined && { currentLng: Number(longitude) }),
          ...(recipientSignature && { recipientSignature }),
          ...(delayReason && { delayReason }),
          ...(note && { notes: note }),
        },
        include: { driver: true, vehicle: true, statusHistory: true },
      });

      // Update driver and vehicle statuses on terminal state
      if (nextStatus === 'DELIVERED') {
        if (delivery.orderId) {
          await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: 'DELIVERED' },
          });
        }
        if (delivery.driverId) {
          await tx.driver.update({
            where: { id: delivery.driverId },
            data: { status: 'AVAILABLE', totalDeliveries: { increment: 1 } },
          });
        }
        if (delivery.vehicleId) {
          await tx.vehicle.update({
            where: { id: delivery.vehicleId },
            data: { status: 'AVAILABLE', currentMileageKm: { increment: delivery.routeDistanceKm } },
          });
        }
      } else if (['CANCELLED', 'FAILED'].includes(nextStatus)) {
        if (delivery.orderId) {
          await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: nextStatus },
          });
        }
        if (delivery.driverId) {
          await tx.driver.update({ where: { id: delivery.driverId }, data: { status: 'AVAILABLE' } });
        }
        if (delivery.vehicleId) {
          await tx.vehicle.update({ where: { id: delivery.vehicleId }, data: { status: 'AVAILABLE' } });
        }
      } else if (nextStatus === 'IN_TRANSIT' && delivery.vehicleId) {
        await tx.vehicle.update({ where: { id: delivery.vehicleId }, data: { status: 'IN_TRANSIT' } });
      }

      // Record DeliveryStatusHistory
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          status: nextStatus,
          note: note || delayReason || `Status changed to ${nextStatus}`,
          latitude: latitude ? Number(latitude) : delivery.currentLat,
          longitude: longitude ? Number(longitude) : delivery.currentLng,
          updatedBy: req.user?.name || 'User',
        },
      });

      // Record DeliveryTimelineEvent
      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId: id,
          status: nextStatus,
          title: `Status: ${nextStatus}`,
          description: note || delayReason || `Delivery updated to ${nextStatus}`,
          locationName: delivery.deliveryAddress,
          lat: latitude ? Number(latitude) : delivery.currentLat,
          lng: longitude ? Number(longitude) : delivery.currentLng,
          recordedBy: req.user?.name || 'User',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          user: req.user?.name || 'System',
          action: 'STATUS_CHANGE',
          entity: 'DELIVERY',
          entityType: 'DELIVERY',
          entityId: id,
          details: JSON.stringify({ from: currentStatus, to: nextStatus, note }),
        },
      });

      return updated;
    });

    res.json({ success: true, delivery: updatedDelivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
});

// Legacy POST transition endpoint alias
router.post('/:id/transition', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // ── Role gate: must come FIRST before any body/DB work ──
  if (req.user?.role === 'VIEWER') {
    res.status(403).json({ error: 'Forbidden: Viewer cannot mutate delivery status' });
    return;
  }

  const { nextStatus, notes, recipientSignature, delayReason, currentLat, currentLng } = req.body;
  req.body = {
    status: nextStatus,
    note: notes,
    recipientSignature,
    delayReason,
    latitude: currentLat,
    longitude: currentLng,
  };
  const { id } = req.params;
  const statusToSet = req.body.status;

  if (!statusToSet) {
    res.status(400).json({ error: 'Target nextStatus is required' });
    return;
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { driver: true, vehicle: true },
  });

  if (!delivery) {
    res.status(404).json({ error: 'Delivery not found' });
    return;
  }

  if (req.user?.role === 'DRIVER') {
    if (!delivery.driver || delivery.driver.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: Drivers can only transition their own assigned deliveries' });
      return;
    }
  }

  const currentStatus = delivery.status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(statusToSet)) {
    res.status(400).json({
      error: `Invalid status transition from '${currentStatus}' to '${statusToSet}'. Allowed transitions: ${allowed.join(', ') || 'None'}`,
    });
    return;
  }

  let progressPercent = delivery.progressPercent;
  let actualDeliveryTime = delivery.actualDeliveryTime;
  let pickupActualAt = delivery.pickupActualAt;

  switch (statusToSet) {
    case 'ACCEPTED':
      progressPercent = 10.0;
      break;
    case 'PICKED_UP':
      progressPercent = 25.0;
      pickupActualAt = pickupActualAt || new Date();
      break;
    case 'IN_TRANSIT':
      progressPercent = 50.0;
      break;
    case 'OUT_FOR_DELIVERY':
      progressPercent = 80.0;
      break;
    case 'DELIVERED':
      progressPercent = 100.0;
      actualDeliveryTime = new Date();
      break;
  }

  const updatedDelivery = await prisma.$transaction(async (tx) => {
    const updated = await tx.delivery.update({
      where: { id },
      data: {
        status: statusToSet,
        progressPercent,
        pickupActualAt,
        actualDeliveryTime,
        deliveryActualAt: actualDeliveryTime,
        ...(currentLat !== undefined && { currentLat: Number(currentLat) }),
        ...(currentLng !== undefined && { currentLng: Number(currentLng) }),
        ...(recipientSignature && { recipientSignature }),
        ...(delayReason && { delayReason }),
        ...(notes && { notes }),
      },
      include: { driver: true, vehicle: true, statusHistory: true, timelineEvents: true },
    });

    if (statusToSet === 'DELIVERED') {
      if (delivery.orderId) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: 'DELIVERED' },
        });
      }
      if (delivery.driverId) {
        await tx.driver.update({
          where: { id: delivery.driverId },
          data: { status: 'AVAILABLE', totalDeliveries: { increment: 1 } },
        });
      }
      if (delivery.vehicleId) {
        await tx.vehicle.update({
          where: { id: delivery.vehicleId },
          data: { status: 'AVAILABLE', currentMileageKm: { increment: delivery.routeDistanceKm } },
        });
      }
    } else if (['CANCELLED', 'FAILED'].includes(statusToSet)) {
      if (delivery.orderId) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: statusToSet },
        });
      }
      if (delivery.driverId) {
        await tx.driver.update({ where: { id: delivery.driverId }, data: { status: 'AVAILABLE' } });
      }
      if (delivery.vehicleId) {
        await tx.vehicle.update({ where: { id: delivery.vehicleId }, data: { status: 'AVAILABLE' } });
      }
    }

    await tx.deliveryStatusHistory.create({
      data: {
        deliveryId: id,
        status: statusToSet,
        note: notes || delayReason || `Status changed to ${statusToSet}`,
        latitude: currentLat ? Number(currentLat) : delivery.currentLat,
        longitude: currentLng ? Number(currentLng) : delivery.currentLng,
        updatedBy: req.user?.name || 'User',
      },
    });

    await tx.deliveryTimelineEvent.create({
      data: {
        deliveryId: id,
        status: statusToSet,
        title: `Status: ${statusToSet}`,
        description: notes || delayReason || `Delivery updated to ${statusToSet}`,
        locationName: delivery.deliveryAddress,
        lat: currentLat ? Number(currentLat) : delivery.currentLat,
        lng: currentLng ? Number(currentLng) : delivery.currentLng,
        recordedBy: req.user?.name || 'User',
      },
    });

    return updated;
  });

  res.json({ delivery: updatedDelivery });
});

export default router;

