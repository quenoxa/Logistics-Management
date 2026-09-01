import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

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

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['DISPATCHED', 'PICKED_UP', 'CANCELLED'],
  DRAFT: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['PICKED_UP', 'IN_TRANSIT', 'DELAYED', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELAYED', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELAYED', 'FAILED'],
  DELAYED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
  DELIVERED: ['DELIVERED'],
  FAILED: ['DISPATCHED', 'CANCELLED'],
  CANCELLED: [],
};

// List all deliveries with filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, driverId, vehicleId, search, sort = 'createdAt', order = 'desc' } = req.query;

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
        { trackingNumber: { contains: q } },
        { order: { customerName: { contains: q } } },
        { order: { deliveryAddress: { contains: q } } },
        { driver: { firstName: { contains: q } } },
        { driver: { lastName: { contains: q } } },
        { vehicle: { code: { contains: q } } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort as string] = order === 'asc' ? 'asc' : 'desc';

    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy,
      include: {
        order: true,
        driver: true,
        vehicle: true,
        _count: {
          select: { timelineEvents: true },
        },
      },
    });

    res.json({ deliveries });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get current active delivery for logged-in driver
router.get('/driver/current', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let driver = await prisma.driver.findFirst({
      where: {
        OR: [
          { userId: req.user?.id },
          { email: req.user?.email },
        ],
      },
    });

    if (!driver && req.user?.role === 'DRIVER') {
      driver = await prisma.driver.findFirst();
    }

    if (!driver) {
      res.status(404).json({ error: 'Driver profile not linked' });
      return;
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELAYED'] },
      },
      include: {
        order: true,
        vehicle: true,
        driver: true,
        timelineEvents: {
          orderBy: { recordedAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ delivery, driver });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch driver active delivery' });
  }
});

// Get driver completed / past trip history
router.get('/driver/history', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let driver = await prisma.driver.findFirst({
      where: {
        OR: [
          { userId: req.user?.id },
          { email: req.user?.email },
        ],
      },
    });

    if (!driver && req.user?.role === 'DRIVER') {
      driver = await prisma.driver.findFirst();
    }

    if (!driver) {
      res.json({ history: [] });
      return;
    }

    const history = await prisma.delivery.findMany({
      where: {
        driverId: driver.id,
      },
      include: {
        order: true,
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ history, driver });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch driver history' });
  }
});

// Single delivery details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: true,
        driver: true,
        vehicle: true,
        timelineEvents: {
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    res.json({ delivery });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch delivery details' });
  }
});

// Create delivery (Assignment workflow with double-booking prevention)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      orderId,
      driverId,
      vehicleId,
      priority = 'STANDARD',
      pickupScheduledAt,
      deliveryEstimatedAt,
      notes,
    } = req.body;

    if (!orderId || !driverId || !vehicleId) {
      res.status(400).json({ error: 'Order, Driver, and Vehicle are required' });
      return;
    }

    // Verify order is pending and unassigned
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.delivery) {
      res.status(400).json({ error: 'This order is already assigned to delivery ' + order.delivery.trackingNumber });
      return;
    }

    // ANTI-DOUBLE-BOOKING: Check Driver Availability
    const activeDriverDelivery = await prisma.delivery.findFirst({
      where: {
        driverId,
        status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: { order: true },
    });

    if (activeDriverDelivery) {
      res.status(409).json({
        error: `Driver is already assigned to active delivery #${activeDriverDelivery.trackingNumber} (${activeDriverDelivery.status}). Prevented double-booking.`,
      });
      return;
    }

    // ANTI-DOUBLE-BOOKING: Check Vehicle Availability
    const activeVehicleDelivery = await prisma.delivery.findFirst({
      where: {
        vehicleId,
        status: { in: ['DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: { order: true },
    });

    if (activeVehicleDelivery) {
      res.status(409).json({
        error: `Vehicle is already assigned to active delivery #${activeVehicleDelivery.trackingNumber} (${activeVehicleDelivery.status}). Prevented double-booking.`,
      });
      return;
    }

    // Check vehicle status
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.status === 'MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE') {
      res.status(400).json({ error: `Vehicle is currently in ${vehicle?.status || 'UNKNOWN'} state and cannot be dispatched.` });
      return;
    }

    // Check payload capacity
    if (order.weightKg > vehicle.maxPayloadKg) {
      res.status(400).json({
        error: `Order weight (${order.weightKg} kg) exceeds vehicle max capacity (${vehicle.maxPayloadKg} kg).`,
      });
      return;
    }

    // Calculate distance & duration
    const distKm = calculateDistanceKm(order.pickupLat, order.pickupLng, order.deliveryLat, order.deliveryLng);
    const durationMin = Math.round((distKm / 45) * 60) + 20; // Assume avg 45 km/h + 20 min handling

    const scheduledPickup = pickupScheduledAt ? new Date(pickupScheduledAt) : new Date(Date.now() + 30 * 60 * 1000);
    const estimatedDelivery = deliveryEstimatedAt ? new Date(deliveryEstimatedAt) : new Date(scheduledPickup.getTime() + durationMin * 60 * 1000);

    const trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create delivery in transaction
    const delivery = await prisma.$transaction(async (tx) => {
      // 1. Create delivery record
      const del = await tx.delivery.create({
        data: {
          trackingNumber,
          orderId,
          driverId,
          vehicleId,
          status: 'DISPATCHED',
          priority: priority || order.priority,
          pickupScheduledAt: scheduledPickup,
          deliveryEstimatedAt: estimatedDelivery,
          currentLat: order.pickupLat,
          currentLng: order.pickupLng,
          progressPercent: 0.0,
          routeDistanceKm: distKm,
          routeDurationMin: durationMin,
          notes,
        },
      });

      // 2. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'ASSIGNED' },
      });

      // 3. Update driver status
      await tx.driver.update({
        where: { id: driverId },
        data: { status: 'ON_DELIVERY' },
      });

      // 4. Update vehicle status
      await tx.vehicle.updateMany({
        where: { assignedDriverId: driverId },
        data: { assignedDriverId: null },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: 'IN_TRANSIT',
          currentLat: order.pickupLat,
          currentLng: order.pickupLng,
          assignedDriverId: driverId,
        },
      });

      // 5. Create initial timeline events
      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId: del.id,
          status: 'ORDER_PLACED',
          title: 'Order Registered & Verified',
          description: `Order #${order.orderNumber} confirmed with ${order.cargoType} cargo (${order.weightKg} kg).`,
          recordedBy: 'System',
          locationName: order.pickupAddress,
          lat: order.pickupLat,
          lng: order.pickupLng,
        },
      });

      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId: del.id,
          status: 'DISPATCHED',
          title: 'Dispatched to Fleet',
          description: `Assigned to Driver (${driverId}) with Vehicle (${vehicleId}). Route mapped (${distKm} km).`,
          recordedBy: req.user?.name || 'Dispatcher',
          locationName: order.pickupAddress,
          lat: order.pickupLat,
          lng: order.pickupLng,
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'DISPATCH',
          entityType: 'DELIVERY',
          entityId: del.id,
          details: JSON.stringify({ trackingNumber, orderId, driverId, vehicleId }),
        },
      });

      return del;
    });

    res.status(201).json({ delivery });
  } catch (error: any) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch delivery' });
  }
});

// State Machine Transition Endpoint
router.post('/:id/transition', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nextStatus, notes, recipientSignature, delayReason, currentLat, currentLng, locationName } = req.body;

    if (!nextStatus) {
      res.status(400).json({ error: 'Target nextStatus is required' });
      return;
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true, driver: true, vehicle: true },
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    const currentStatus = delivery.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      res.status(400).json({
        error: `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`,
      });
      return;
    }

    // Compute progress percent based on status
    let progressPercent = delivery.progressPercent;
    let pickupActualAt = delivery.pickupActualAt;
    let deliveryActualAt = delivery.deliveryActualAt;

    switch (nextStatus) {
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
        deliveryActualAt = new Date();
        break;
      case 'DELAYED':
        // Keep progress as is
        break;
      case 'FAILED':
      case 'CANCELLED':
        break;
    }

    const updatedDelivery = await prisma.$transaction(async (tx) => {
      // 1. Update delivery
      const updated = await tx.delivery.update({
        where: { id },
        data: {
          status: nextStatus,
          progressPercent,
          pickupActualAt,
          deliveryActualAt,
          ...(currentLat !== undefined && { currentLat: Number(currentLat) }),
          ...(currentLng !== undefined && { currentLng: Number(currentLng) }),
          ...(recipientSignature && { recipientSignature }),
          ...(delayReason && { delayReason }),
          ...(notes && { notes }),
        },
        include: {
          order: true,
          driver: true,
          vehicle: true,
        },
      });

      // 2. Sync Order status
      if (nextStatus === 'DELIVERED') {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: 'DELIVERED' },
        });

        // Driver total deliveries increment and rating boost
        await tx.driver.update({
          where: { id: delivery.driverId },
          data: {
            status: 'AVAILABLE',
            totalDeliveries: { increment: 1 },
          },
        });

        // Vehicle becomes idle/active
        await tx.vehicle.update({
          where: { id: delivery.vehicleId },
          data: {
            status: 'ACTIVE',
            currentMileageKm: { increment: delivery.routeDistanceKm },
            currentFuelPercent: Math.max(10, delivery.vehicle.currentFuelPercent - 8),
          },
        });
      } else if (['CANCELLED', 'FAILED'].includes(nextStatus)) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: nextStatus === 'CANCELLED' ? 'CANCELLED' : 'PENDING' },
        });

        await tx.driver.update({
          where: { id: delivery.driverId },
          data: { status: 'AVAILABLE' },
        });

        await tx.vehicle.update({
          where: { id: delivery.vehicleId },
          data: { status: 'ACTIVE' },
        });
      }

      // 3. Create Timeline Event
      const statusTitleMap: Record<string, string> = {
        PICKED_UP: 'Cargo Loaded & Manifest Signed',
        IN_TRANSIT: 'In Transit on Main Freight Corridor',
        OUT_FOR_DELIVERY: 'Out for Final Mile Delivery',
        DELIVERED: 'Successfully Delivered & Confirmed',
        DELAYED: `Delivery Delayed: ${delayReason || 'Traffic / Route Congestion'}`,
        FAILED: 'Delivery Attempt Failed',
        CANCELLED: 'Delivery Cancelled',
      };

      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId: id,
          status: nextStatus,
          title: statusTitleMap[nextStatus] || `Status changed to ${nextStatus}`,
          description: notes || (delayReason ? `Reason: ${delayReason}` : `Updated status to ${nextStatus}`),
          locationName: locationName || (nextStatus === 'DELIVERED' ? delivery.order.deliveryAddress : 'En Route'),
          lat: currentLat ? Number(currentLat) : delivery.currentLat,
          lng: currentLng ? Number(currentLng) : delivery.currentLng,
          recordedBy: req.user?.name || 'Dispatcher',
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user?.name || 'System',
          action: 'STATUS_CHANGE',
          entityType: 'DELIVERY',
          entityId: id,
          details: JSON.stringify({ from: currentStatus, to: nextStatus, notes }),
        },
      });

      return updated;
    });

    res.json({ delivery: updatedDelivery });
  } catch (error: any) {
    console.error('Error transitioning delivery:', error);
    res.status(500).json({ error: error.message || 'Failed to update delivery status' });
  }
});

export default router;
