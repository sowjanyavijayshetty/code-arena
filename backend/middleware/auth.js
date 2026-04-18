
const store = require('../data/store');

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== store.config.adminPassword) {
    return res.status(401).json({ error: 'Unauthorized. Invalid admin token.' });
  }
  next();
}

module.exports = { adminAuth };
