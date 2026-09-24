require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const initSocket = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const hospitalDashboardRoutes = require('./routes/hospitalDashboardRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true }
});
initSocket(io);
app.set('io', io); // makes io accessible in controllers via req.app.get('io')

// --- Core middleware ---
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use('/api', generalLimiter);

// Static file serving for uploaded accident images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/hospital-dashboard', hospitalDashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MediCore API is running', demoMode: process.env.DEMO_MODE === 'true' });
});

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[MediCore API] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(`[MediCore API] DEMO_MODE=${process.env.DEMO_MODE}`);
  });
});

module.exports = { app, server, io };
