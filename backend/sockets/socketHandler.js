const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Sets up Socket.IO auth + room joining.
 * - Patients join a room `patient:<userId>` to receive updates about their own request.
 * - Hospital staff join a room `hospital:<hospitalId>` to receive new requests for their hospital.
 * Clients authenticate by sending their JWT in the connection handshake auth payload.
 */
function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`[Socket.IO] Connected: ${user.name} (${user.role})`);

    if (user.role === 'patient') {
      socket.join(`patient:${user._id}`);
    } else if (user.role === 'hospital_staff' && user.hospitalId) {
      socket.join(`hospital:${user.hospitalId}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: ${user.name}`);
    });

    // Allows a hospital dashboard to simulate ambulance GPS movement for the demo
    socket.on('ambulance:mock_location_update', ({ requestId, lat, lng, patientId, hospitalId }) => {
      if (user.role !== 'hospital_staff') return;
      io.to(`patient:${patientId}`).emit('ambulance:location', { requestId, lat, lng });
      io.to(`hospital:${hospitalId}`).emit('ambulance:location', { requestId, lat, lng });
    });
  });
}

module.exports = initSocket;
