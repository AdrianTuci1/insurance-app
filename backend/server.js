
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const policyRoutes = require('./src/routes/policy.routes');
const authRoutes = require('./src/routes/auth.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const db = require('./src/services/db.service'); // Keeping for initTables, eventually move to config/db
const env = require('./src/config/env.config');

const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'policies'));

// Routes
app.use('/api/policies', policyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

// Initialize DB Tables (Legacy helper, move to separate script in future)
db.initTables();

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
