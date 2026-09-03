import app from './app';
import { config } from './config';

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 LOGISTICS MANAGEMENT API Server is RUNNING`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`🌐 Base URL: http://localhost:${config.port}/api`);
    console.log(`=========================================`);
  });
}

export default app;
