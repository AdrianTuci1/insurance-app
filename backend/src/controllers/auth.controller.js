
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/db.service');

exports.register = async (req, res) => {
    try {
        const { email, password, role, name } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const existingUser = await db.getUserByEmail(email);
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.createUser({
            email,
            password: hashedPassword,
            role: role || 'user',
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.getUserByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await db.listUsers();
        // Remove passwords before sending
        const sanitizedUsers = users.map(({ password, ...rest }) => rest);
        res.json(sanitizedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { email } = req.params;
        const { password, ...data } = req.body;

        // Protective check: regular users can only update themselves
        if (req.user.role !== 'admin' && req.user.email !== email) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = { ...data };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await db.updateUser(email, updateData);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { email } = req.params;
        if (req.user.email === email) return res.status(400).json({ error: 'Cannot delete yourself' });

        await db.deleteUser(email);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await db.getSettings();
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        await db.updateSettings(req.body);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
