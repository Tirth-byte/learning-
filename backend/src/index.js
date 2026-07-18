const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { PORT } = require('./config/env');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const productRouter = require('./routes/product');
const pricelistRouter = require('./routes/pricelist');
const orderRouter = require('./routes/order');
const invoiceRouter = require('./routes/invoice');
const dashboardRouter = require('./routes/dashboard');
const settingsRouter = require('./routes/settings');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/pricelists', pricelistRouter);
app.use('/api/orders', orderRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // For testing
