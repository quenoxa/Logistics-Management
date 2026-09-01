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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'LOGISTICS ONE API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
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

// Start Server
app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 LOGISTICS ONE API Server is RUNNING`);
  console.log(`📡 Port: ${config.port}`);
  console.log(`🌐 Base URL: http://localhost:${config.port}/api`);
  console.log(`=========================================`);
});

export default app;
