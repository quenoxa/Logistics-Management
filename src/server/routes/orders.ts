import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to generate coordinates within Metro NY / NJ / PA area if not provided
const getRandomMetroCoords = () => {
  const baseLat = 40.7128;
  const baseLng = -74.0060;
  const offsetLat = (Math.random() - 0.5) * 0.35;
  const offsetLng = (Math.random() - 0.5) * 0.45;
  return {
    lat: parseFloat((baseLat + offsetLat).toFixed(6)),
    lng: parseFloat((baseLng + offsetLng).toFixed(6)),
  };
};

// List orders
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, cargoType, search, sort = 'createdAt', order = 'desc' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority as string;
    }
    if (cargoType && cargoType !== 'ALL') {
      where.cargoType = cargoType as string;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerEmail: { contains: q } },
        { customerAddress: { contains: q } },
        { pickupAddress: { contains: q } },
        { deliveryAddress: { contains: q } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort as string] = order === 'asc' ? 'asc' : 'desc';

    const orders = await prisma.order.findMany({
      where,
      orderBy,
      include: {
        delivery: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
            driverId: true,
            vehicleId: true,
            driver: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                code: true,
                licensePlate: true,
              },
            },
          },
        },
      },
    });

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Unassigned orders (ready to create delivery)
router.get('/unassigned', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        delivery: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch unassigned orders' });
  }
});

// Single order details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        delivery: {
          include: {
            driver: true,
            vehicle: true,
            timelineEvents: {
              orderBy: { recordedAt: 'asc' },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create Order
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      weightKg,
      volumeM3,
      cargoType = 'GENERAL_FREIGHT',
      priority = 'STANDARD',
      deliveryFee = 0,
      notes,
    } = req.body;

    if (!customerName || !pickupAddress || !deliveryAddress || !weightKg) {
      res.status(400).json({ error: 'Missing required order fields: customerName, pickupAddress, deliveryAddress, and weightKg are required' });
      return;
    }

    const finalCustomerAddress = customerAddress || deliveryAddress || 'Customer Primary Address';
    const autoPickupCoords = (!pickupLat || !pickupLng) ? getRandomMetroCoords() : { lat: pickupLat, lng: pickupLng };
    const autoDeliveryCoords = (!deliveryLat || !deliveryLng) ? getRandomMetroCoords() : { lat: deliveryLat, lng: deliveryLng };

    // Auto-generate order number if omitted
    const generatedOrderNumber = orderNumber || `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber: generatedOrderNumber,
        customerName,
        customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
        customerPhone: customerPhone || '+91-98765-43210',
        customerAddress: finalCustomerAddress,
        pickupAddress,
        pickupLat: Number(autoPickupCoords.lat),
        pickupLng: Number(autoPickupCoords.lng),
        deliveryAddress,
        deliveryLat: Number(autoDeliveryCoords.lat),
        deliveryLng: Number(autoDeliveryCoords.lng),
        weightKg: Number(weightKg),
        volumeM3: Number(volumeM3 || (Number(weightKg) * 0.005).toFixed(2)),
        cargoType,
        priority,
        status: 'PENDING',
        deliveryFee: Number(deliveryFee),
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'CREATE',
        entityType: 'ORDER',
        entityId: order.id,
        details: JSON.stringify({ orderNumber: order.orderNumber, customer: order.customerName, weightKg: order.weightKg }),
      },
    });

    res.status(201).json({ order });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update Order
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.weightKg) updateData.weightKg = Number(updateData.weightKg);
    if (updateData.volumeM3) updateData.volumeM3 = Number(updateData.volumeM3);
    if (updateData.deliveryFee !== undefined) updateData.deliveryFee = Number(updateData.deliveryFee);

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'UPDATE',
        entityType: 'ORDER',
        entityId: order.id,
      },
    });

    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete Order
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { delivery: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.delivery && ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.delivery.status)) {
      res.status(400).json({ error: 'Cannot delete order with an active or completed delivery' });
      return;
    }

    await prisma.order.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name || 'System',
        action: 'DELETE',
        entityType: 'ORDER',
        entityId: id,
      },
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
