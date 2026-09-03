import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to interpolate waypoints between origin and destination with slight realistic jitter
const generateRouteWaypoints = (startLat: number, startLng: number, endLat: number, endLng: number, count: number = 8) => {
  const points: [number, number][] = [];
  for (let i = 0; i <= count; i++) {
    const ratio = i / count;
    const jitter = Math.sin(ratio * Math.PI) * 0.015;
    const lat = startLat + (endLat - startLat) * ratio + jitter;
    const lng = startLng + (endLng - startLng) * ratio - jitter * 0.5;
    points.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }
  return points;
};

// Get all actively tracked deliveries
router.get('/active', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: { in: ['ASSIGNED', 'ACCEPTED', 'DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELAYED'] },
      },
      include: {
        order: true,
        driver: true,
        vehicle: true,
      },
    });

    const enriched = deliveries.map((d) => {
      const startLat = d.pickupLatitude ?? d.order?.pickupLat ?? 40.7128;
      const startLng = d.pickupLongitude ?? d.order?.pickupLng ?? -74.0060;
      const endLat = d.deliveryLatitude ?? d.order?.deliveryLat ?? 40.7306;
      const endLng = d.deliveryLongitude ?? d.order?.deliveryLng ?? -73.9352;
      const progress = (d.progressPercent || 0) / 100;

      const currentLat = d.currentLat || parseFloat((startLat + (endLat - startLat) * progress).toFixed(6));
      const currentLng = d.currentLng || parseFloat((startLng + (endLng - startLng) * progress).toFixed(6));

      const y = Math.sin((endLng - startLng) * Math.PI / 180) * Math.cos(endLat * Math.PI / 180);
      const x = Math.cos(startLat * Math.PI / 180) * Math.sin(endLat * Math.PI / 180) -
                Math.sin(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * Math.cos((endLng - startLng) * Math.PI / 180);
      const heading = Math.round(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360);

      const speedKmH = d.status === 'IN_TRANSIT' ? 62 : d.status === 'OUT_FOR_DELIVERY' ? 38 : 0;
      const fuelPercent = d.vehicle?.currentFuelPercent ?? 85;
      const cargoType = d.order?.cargoType ?? 'GENERAL_FREIGHT';

      return {
        ...d,
        currentLat,
        currentLng,
        telemetry: {
          speedKmH,
          headingDeg: heading,
          engineTempC: 89.4,
          batteryOrFuelPercent: fuelPercent,
          cargoTempC: cargoType === 'COLD_CHAIN' ? -18.2 : 21.0,
          signalStrength: '98%',
          etaMinutesRemaining: Math.max(0, Math.round((d.routeDurationMin || 60) * (1 - progress))),
        },
      };
    });

    res.json({ activeDeliveries: enriched });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch active tracking data' });
  }
});

// Get route for a specific delivery
router.get('/:id/route', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const pickupLat = delivery.pickupLatitude ?? delivery.order?.pickupLat ?? 40.7128;
    const pickupLng = delivery.pickupLongitude ?? delivery.order?.pickupLng ?? -74.0060;
    const deliveryLat = delivery.deliveryLatitude ?? delivery.order?.deliveryLat ?? 40.7306;
    const deliveryLng = delivery.deliveryLongitude ?? delivery.order?.deliveryLng ?? -73.9352;

    const waypoints = generateRouteWaypoints(pickupLat, pickupLng, deliveryLat, deliveryLng, 12);
    const progressRatio = (delivery.progressPercent || 0) / 100;
    const curLat = delivery.currentLat || (pickupLat + (deliveryLat - pickupLat) * progressRatio);
    const curLng = delivery.currentLng || (pickupLng + (deliveryLng - pickupLng) * progressRatio);

    res.json({
      delivery,
      route: {
        origin: {
          lat: pickupLat,
          lng: pickupLng,
          address: delivery.pickupAddress || delivery.order?.pickupAddress || 'Origin Depot',
        },
        destination: {
          lat: deliveryLat,
          lng: deliveryLng,
          address: delivery.deliveryAddress || delivery.order?.deliveryAddress || 'Destination',
        },
        currentPosition: {
          lat: curLat,
          lng: curLng,
        },
        waypoints,
        distanceKm: delivery.routeDistanceKm,
        durationMin: delivery.routeDurationMin,
        etaMinutesRemaining: Math.max(0, Math.round((delivery.routeDurationMin || 60) * (1 - progressRatio))),
      },
      telemetry: {
        speedKmH: delivery.status === 'IN_TRANSIT' ? 64 : delivery.status === 'OUT_FOR_DELIVERY' ? 35 : 0,
        headingDeg: 78,
        engineTempC: 88.5,
        batteryOrFuelPercent: delivery.vehicle?.currentFuelPercent ?? 85,
        cargoTempC: delivery.order?.cargoType === 'COLD_CHAIN' ? -18.0 : 20.5,
        networkSignal: '5G - 96%',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch delivery route' });
  }
});

// Advance delivery simulation step
router.post('/:id/simulate-step', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stepDeltaPercent = 5 } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true, vehicle: true, driver: true },
    });

    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (['DELIVERED', 'FAILED', 'CANCELLED'].includes(delivery.status)) {
      res.status(400).json({ error: `Delivery is in terminal state (${delivery.status})` });
      return;
    }

    let nextProgress = Math.min(100, (delivery.progressPercent || 0) + stepDeltaPercent);
    let nextStatus = delivery.status;

    if (nextProgress >= 100) {
      nextStatus = 'DELIVERED';
      nextProgress = 100;
    } else if (nextProgress >= 80) {
      nextStatus = 'OUT_FOR_DELIVERY';
    } else if (nextProgress >= 25) {
      nextStatus = 'IN_TRANSIT';
    }

    const pickupLat = delivery.pickupLatitude ?? delivery.order?.pickupLat ?? 40.7128;
    const pickupLng = delivery.pickupLongitude ?? delivery.order?.pickupLng ?? -74.0060;
    const deliveryLat = delivery.deliveryLatitude ?? delivery.order?.deliveryLat ?? 40.7306;
    const deliveryLng = delivery.deliveryLongitude ?? delivery.order?.deliveryLng ?? -73.9352;

    const ratio = nextProgress / 100;
    const jitter = Math.sin(ratio * Math.PI) * 0.01;
    const newLat = parseFloat((pickupLat + (deliveryLat - pickupLat) * ratio + jitter).toFixed(6));
    const newLng = parseFloat((pickupLng + (deliveryLng - pickupLng) * ratio - jitter * 0.5).toFixed(6));

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        progressPercent: nextProgress,
        status: nextStatus,
        currentLat: newLat,
        currentLng: newLng,
        ...(nextStatus === 'DELIVERED' && { deliveryActualAt: new Date(), actualDeliveryTime: new Date() }),
      },
      include: { order: true, vehicle: true, driver: true },
    });

    if (delivery.vehicleId) {
      await prisma.vehicle.update({
        where: { id: delivery.vehicleId },
        data: {
          currentLat: newLat,
          currentLng: newLng,
          status: nextStatus === 'DELIVERED' ? 'AVAILABLE' : 'IN_TRANSIT',
        },
      });
    }

    if (nextStatus === 'DELIVERED') {
      if (delivery.orderId) {
        await prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: 'DELIVERED' },
        });
      }
      if (delivery.driverId) {
        await prisma.driver.update({
          where: { id: delivery.driverId },
          data: { status: 'AVAILABLE', totalDeliveries: { increment: 1 } },
        });
      }
    }

    res.json({ delivery: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to simulate step' });
  }
});

// Step all active deliveries forward
router.post('/simulate-all', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const active = await prisma.delivery.findMany({
      where: {
        status: { in: ['ASSIGNED', 'ACCEPTED', 'DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: { order: true, vehicle: true, driver: true },
    });

    const updatedDeliveries = [];

    for (const d of active) {
      const nextProgress = Math.min(100, (d.progressPercent || 0) + 4);
      let nextStatus = d.status;

      if (nextProgress >= 100) nextStatus = 'DELIVERED';
      else if (nextProgress >= 80) nextStatus = 'OUT_FOR_DELIVERY';
      else if (nextProgress >= 20) nextStatus = 'IN_TRANSIT';

      const pickupLat = d.pickupLatitude ?? d.order?.pickupLat ?? 40.7128;
      const pickupLng = d.pickupLongitude ?? d.order?.pickupLng ?? -74.0060;
      const deliveryLat = d.deliveryLatitude ?? d.order?.deliveryLat ?? 40.7306;
      const deliveryLng = d.deliveryLongitude ?? d.order?.deliveryLng ?? -73.9352;

      const ratio = nextProgress / 100;
      const newLat = parseFloat((pickupLat + (deliveryLat - pickupLat) * ratio).toFixed(6));
      const newLng = parseFloat((pickupLng + (deliveryLng - pickupLng) * ratio).toFixed(6));

      const updated = await prisma.delivery.update({
        where: { id: d.id },
        data: {
          progressPercent: nextProgress,
          status: nextStatus,
          currentLat: newLat,
          currentLng: newLng,
          ...(nextStatus === 'DELIVERED' && { deliveryActualAt: new Date(), actualDeliveryTime: new Date() }),
        },
      });

      if (d.vehicleId) {
        await prisma.vehicle.update({
          where: { id: d.vehicleId },
          data: {
            currentLat: newLat,
            currentLng: newLng,
            status: nextStatus === 'DELIVERED' ? 'AVAILABLE' : 'IN_TRANSIT',
          },
        });
      }

      if (nextStatus === 'DELIVERED') {
        if (d.orderId) {
          await prisma.order.update({
            where: { id: d.orderId },
            data: { status: 'DELIVERED' },
          });
        }
        if (d.driverId) {
          await prisma.driver.update({
            where: { id: d.driverId },
            data: { status: 'AVAILABLE', totalDeliveries: { increment: 1 } },
          });
        }
      }

      updatedDeliveries.push(updated);
    }

    res.json({ updatedCount: updatedDeliveries.length, deliveries: updatedDeliveries });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to step simulation' });
  }
});

export default router;
