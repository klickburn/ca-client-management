const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const documentRoutes = require('./routes/documents');
const taskRoutes = require('./routes/tasks');
const invoiceRoutes = require('./routes/invoices');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const complianceRoutes = require('./routes/compliance');
const dscRoutes = require('./routes/dsc');
const filingRoutes = require('./routes/filings');
const docRequestRoutes = require('./routes/docRequests');
const messageRoutes = require('./routes/messages');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS — restrict to known origins (set CORS_ORIGINS env var for production)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(helmet());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(mongoSanitize()); // Prevent NoSQL injection via $gt, $ne etc in req.body/query

// Rate limit auth endpoints (5 attempts per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// Connect to MongoDB
connectDB();

// Enums endpoint — no auth needed, serves config to frontend
const enums = require('./config/enums');
app.get('/api/enums', (req, res) => res.json(enums));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/clients', documentRoutes); // Document routes nested under clients
app.use('/api/tasks', taskRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/dsc', dscRoutes);
app.use('/api/filings', filingRoutes);
app.use('/api/doc-requests', docRequestRoutes);
app.use('/api/messages', messageRoutes);

// Global error handler — don't leak internals in production
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' && status === 500
        ? 'An internal error occurred'
        : err.message;
    res.status(status).json({ message });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../frontend-v2/build')));

    // Any route that is not an API route will be served the React app
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend-v2/build', 'index.html'));
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});