const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load environment variables
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const documentRoutes = require('./routes/documents');
const taskRoutes = require('./routes/tasks');
const invoiceRoutes = require('./routes/invoices');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Enhanced CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Allowed headers
  exposedHeaders: ['Content-Range', 'X-Content-Range'] // Expose these headers
}));
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

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