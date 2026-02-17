const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/db.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

class AuthController {
    register = asyncHandler(async (req, res) => {
        const { email, password, role, name } = req.body;
        if (!email || !password) throw new ApiError(400, 'Email and password are required');

        const existingUser = await db.getUserByEmail(email);
        if (existingUser) throw new ApiError(400, 'User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.createUser({
            email,
            password: hashedPassword,
            role: role || 'user',
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'User registered successfully' });
    });

    signup = asyncHandler(async (req, res) => {
        const { email, password, name, secretKey } = req.body;

        if (!email || !password || !secretKey) {
            throw new ApiError(400, 'Email, password and secret key are required');
        }

        const serverSecret = process.env.ADMIN_SIGNUP_SECRET;
        if (!serverSecret) {
            throw new ApiError(500, 'Server registration is currently disabled (Secret not configured)');
        }

        if (secretKey !== serverSecret) {
            throw new ApiError(401, 'Invalid secret key');
        }

        const existingUser = await db.getUserByEmail(email);
        if (existingUser) throw new ApiError(400, 'User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.createUser({
            email,
            password: hashedPassword,
            role: 'admin',
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'Admin account created successfully' });
    });

    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const user = await db.getUserByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const token = jwt.sign(
            { email: user.email, role: user.role || 'user' },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                email: user.email,
                role: user.role || 'user',
                name: user.name || user.email.split('@')[0],
                avatar: user.avatar
            }
        });
    });

    getAllUsers = asyncHandler(async (req, res) => {
        const users = await db.listUsers();
        const sanitizedUsers = users.map(({ password, ...rest }) => rest);
        res.json(sanitizedUsers);
    });

    updateUser = asyncHandler(async (req, res) => {
        const { email } = req.params;
        const { password, ...data } = req.body;

        if (req.user.role !== 'admin' && req.user.email !== email) {
            throw new ApiError(403, 'Access denied');
        }

        const updateData = { ...data };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await db.updateUser(email, updateData);
        res.json({ message: 'User updated successfully' });
    });

    deleteUser = asyncHandler(async (req, res) => {
        const { email } = req.params;
        if (req.user.email === email) throw new ApiError(400, 'Cannot delete yourself');

        await db.deleteUser(email);
        res.json({ message: 'User deleted successfully' });
    });

    getSettings = asyncHandler(async (req, res) => {
        const settings = await db.getSettings();
        res.json(settings);
    });

    updateSettings = asyncHandler(async (req, res) => {
        await db.updateSettings(req.body);
        res.json({ message: 'Settings updated successfully' });
    });
}

module.exports = new AuthController();
