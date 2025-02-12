const socketIo = require('socket.io');
let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'], // Enable both polling and websocket
    });
    io.on('connection', (socket) => {
      // console.log('New connection: ' + socket.id);
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
