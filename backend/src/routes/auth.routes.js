
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

// Admin check middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

router.post('/register', auth, admin, authController.register); // Only admin can create new accounts
router.post('/login', authController.login);

router.get('/users', auth, admin, authController.getAllUsers);
router.patch('/users/:email', auth, authController.updateUser); // Both can update (self-protection in controller)
router.delete('/users/:email', auth, admin, authController.deleteUser);

router.get('/settings', auth, authController.getSettings);
router.patch('/settings', auth, admin, authController.updateSettings);

module.exports = router;
