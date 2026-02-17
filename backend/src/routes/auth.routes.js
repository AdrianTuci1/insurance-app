
const BaseRoute = require('./base.route');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

class AuthRoute extends BaseRoute {
    constructor() {
        super('/api/auth');
        this.initializeRoutes();
    }

    // Admin check middleware
    admin(req, res, next) {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied. Admin role required.' });
        }
    }

    initializeRoutes() {
        this.router.post('/register', auth, this.admin, authController.register); // Only admin can create new accounts
        this.router.post('/signup', authController.signup); // Public but requires secret key in body
        this.router.post('/login', authController.login);

        this.router.get('/users', auth, this.admin, authController.getAllUsers);
        this.router.patch('/users/:email', auth, authController.updateUser); // Both can update
        this.router.delete('/users/:email', auth, this.admin, authController.deleteUser);

        this.router.get('/settings', auth, authController.getSettings);
        this.router.patch('/settings', auth, this.admin, authController.updateSettings);
    }
}

module.exports = AuthRoute;
