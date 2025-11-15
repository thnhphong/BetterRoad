// server/test-routes.js
import express from 'express';
import authRoutes from './src/routes/auth.js';

const app = express();
app.use(express.json());

// Mount trực tiếp
app.use('/auth', authRoutes);

app.listen(3001, () => {
  console.log('Test server on http://localhost:3001');
  console.log('Try: curl http://localhost:3001/auth/register');
});