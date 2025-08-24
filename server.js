// ===== STANDALONE SERVER =====
// This file loads the module.js and starts a standalone server
// All application logic is in module.js - this just adds app.listen()

// Set standalone mode (no embedded flag)
process.env.EMBEDDED_MODE = 'false';

const APP_ID = 'cmeptomdb01s06lfem89ruzgl';
const createAppModule = require('./module.js');

// Create the app instance by passing APP_ID to the module factory
const app = createAppModule(APP_ID);

const PORT = process.env.PORT || 3001;

// Start standalone server
const server = app.listen(PORT, () => {
  console.log(`🚀 تطبيق وفيق أورثو يعمل على http://localhost:${PORT}`);
});

// Conditionally attach Socket.IO for standalone mode (only if socket.io is installed)
try {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  // Create a namespace for this app
  const namespace = io.of(`/socket/${APP_ID}`);

  // Pass the namespace to the app module for socket logic
  if (app.attachSocketNamespace) {
    app.attachSocketNamespace(namespace);
    console.log(`🔌 Socket.IO enabled for app ${APP_ID}`);
  }
} catch (error) {
  console.log(`ℹ️ Socket.IO not available for app ${APP_ID} (not installed or not needed)`);
}

module.exports = app;