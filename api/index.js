let app;
try {
  app = require('../server/server.js');
} catch (err) {
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      error: 'Module Load Failed',
      message: err.message,
      stack: err.stack
    });
  });
}
module.exports = app;
