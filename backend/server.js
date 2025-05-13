const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load environment variables
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const documentRoutes = require('./routes/documents');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Make uploads directory accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/clients', documentRoutes); // Document routes nested under clients

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Any route that is not an API route will be served the React app
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});