let io = null;

const initSocketIO = (socketServer) => {
  io = socketServer;

  io.on('connection', (socket) => {
    // User joins a specific show room to receive real-time updates for its seat layout
    socket.on('join:show', (showId) => {
      if (showId) {
        socket.join(`show:${showId}`);
      }
    });

    socket.on('leave:show', (showId) => {
      if (showId) {
        socket.leave(`show:${showId}`);
      }
    });

    socket.on('disconnect', () => {
      // Handled automatically by socket.io
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Broadcast seat held event to clients looking at this show
const broadcastSeatsHeld = (showId, seats, userId, expiresAt) => {
  if (io) {
    io.to(`show:${showId}`).emit('seats:held', {
      showId,
      seats,
      userId,
      expiresAt
    });
  }
};

// Broadcast seat released event
const broadcastSeatsReleased = (showId, seats) => {
  if (io) {
    io.to(`show:${showId}`).emit('seats:released', {
      showId,
      seats
    });
  }
};

// Broadcast seat booked event
const broadcastSeatsBooked = (showId, seats) => {
  if (io) {
    io.to(`show:${showId}`).emit('seats:booked', {
      showId,
      seats
    });
  }
};

module.exports = {
  initSocketIO,
  getIO,
  broadcastSeatsHeld,
  broadcastSeatsReleased,
  broadcastSeatsBooked
};
