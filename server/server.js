const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/config');
const { connectDB, closeDB } = require('./config/db');
const { initSocketIO, broadcastSeatsReleased } = require('./sockets/seatSocket');
const SeatHold = require('./models/SeatHold');

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
initSocketIO(io);

// Background cleanup worker for expired seat holds
const startBackgroundHoldCleanup = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      const expiredHolds = await SeatHold.find({
        status: 'active',
        expiresAt: { $lte: now }
      });

      if (expiredHolds.length > 0) {
        for (const hold of expiredHolds) {
          hold.status = 'expired';
          await hold.save();
          // Broadcast released seats to listeners of this show
          broadcastSeatsReleased(hold.show, hold.seats);
        }
      }
    } catch (err) {
      console.error('Seat hold cleanup error:', err.message);
    }
  }, 30000); // Check every 30 seconds
};

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`🎬 =================================================`);
      console.log(`🎬 iMovies Backend running in ${config.nodeEnv} mode`);
      console.log(`🎬 Listening on http://localhost:${config.port}`);
      console.log(`🎬 Payment Mode: ${config.paymentMode.toUpperCase()}`);
      console.log(`🎬 =================================================`);

      startBackgroundHoldCleanup();
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🛑 Closed all HTTP and Socket.IO connections.');
    await closeDB();
    console.log('🛑 Database connection closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { server, app };
