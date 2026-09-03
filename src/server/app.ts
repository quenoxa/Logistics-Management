import express from 'express';
import cors from 'cors';
import { config } from './config';

import authRoutes from './routes/auth';
import vehiclesRoutes from './routes/vehicles';
import driversRoutes from './routes/drivers';
import ordersRoutes from './routes/orders';
import deliveriesRoutes from './routes/deliveries';
import trackingRoutes from './routes/tracking';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import adminRoutes from './routes/admin';
import dashboardRoutes from './routes/dashboard';
import maintenanceRoutes from './routes/maintenance';
import issuesRoutes from './routes/issues';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'LOGISTICS MANAGEMENT API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (support both /api/xxx and /xxx for Vercel serverless functions)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/vehicles', '/vehicles'], vehiclesRoutes);
app.use(['/api/drivers', '/drivers'], driversRoutes);
app.use(['/api/orders', '/orders'], ordersRoutes);
app.use(['/api/deliveries', '/deliveries'], deliveriesRoutes);
app.use(['/api/tracking', '/tracking'], trackingRoutes);
app.use(['/api/reports', '/reports'], reportsRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/maintenance', '/maintenance'], maintenanceRoutes);
app.use(['/api/issues', '/issues'], issuesRoutes);

// 404 handler
app.use(['/api/*', '/*'], (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

export default app;
