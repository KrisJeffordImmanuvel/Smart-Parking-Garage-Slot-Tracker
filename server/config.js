// config.js
// -----------------------------------------------------------------------------
// All fixed settings of the project live here, so they can be changed in one
// place. CAPACITY is the total number of parking slots in the garage.
// -----------------------------------------------------------------------------

const path = require('path');

module.exports = {
  // Total number of slots in the garage (the "20" in the problem statement).
  CAPACITY: 20,

  // Port on which the Express server listens. The React dev server forwards
  // every /api request to this port (see client/vite.config.js).
  PORT: process.env.PORT || 4000,

  // Location of the SQLite database file. It is created automatically.
  DB_FILE: process.env.DB_FILE || path.join(__dirname, 'data', 'parking.db'),
};
