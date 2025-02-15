const socketIo = require('socket.io');
let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'],
    });
    io.on('connection', (socket) => {
      // console.log('New connection: ' + socket.id);

      // Join a room based on the user's email
      socket.on('join', (email) => {
        socket.join(email);
        // console.log(`Socket ${socket.id} joined room ${email}`);
      });

      socket.on('disconnect', () => {
        // console.log('Disconnected: ' + socket.id);
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};