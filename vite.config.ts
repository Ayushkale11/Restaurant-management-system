import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

const ORDERS_FILE = path.resolve('orders.json');

function readOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return [];
}

function writeOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {}
}

const orderApiPlugin = () => ({
  name: 'order-api',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/orders')) {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          const orders = readOrders();
          res.end(JSON.stringify(orders));
          return;
        }

        if (req.method === 'PATCH' || req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', () => {
            try {
              const { id, status, paymentStatus } = JSON.parse(body);
              const orders = readOrders();
              const order = orders.find((o: any) => o.id === id);
              if (!order) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Order not found' }));
                return;
              }
              if (status !== undefined) order.status = status;
              if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
              
              writeOrders(orders);
              res.end(JSON.stringify(order));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid Request' }));
            }
          });
          return;
        }

        if (req.method === 'POST') {
          if (pathname.includes('/status') || pathname.includes('/update')) {
            let body = '';
            req.on('data', (chunk: any) => body += chunk);
            req.on('end', () => {
              try {
                const { id, status, paymentStatus } = JSON.parse(body);
                const orders = readOrders();
                const order = orders.find((o: any) => o.id === id);
                if (!order) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Order not found' }));
                  return;
                }
                if (status !== undefined) order.status = status;
                if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
                
                writeOrders(orders);
                res.end(JSON.stringify(order));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid Request' }));
              }
            });
            return;
          }

          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', () => {
            try {
              const orderData = JSON.parse(body);
              const orders = readOrders();
              
              const newOrder = {
                id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
                status: 'pending',
                timestamp: new Date().toISOString(),
                ...orderData
              };
              
              orders.push(newOrder);
              writeOrders(orders);
              
              res.statusCode = 201;
              res.end(JSON.stringify(newOrder));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), orderApiPlugin()],
  server: {
    host: true,
    port: 5174,
    cors: true, // Enable CORS so the dashboard on port 5175 can fetch order api data
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve('index.html')
      }
    }
  }
})
