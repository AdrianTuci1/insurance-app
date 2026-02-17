
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

class App {
    constructor(routes = []) {
        this.app = express();
        this.setupMiddleware();
        this.setupViewEngine();
        this.setupRoutes(routes);
        this.setupHealthCheck();
    }

    setupMiddleware() {
        // Security
        this.app.use(helmet());
        this.app.use(cors());

        // Parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupViewEngine() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../policies'));
    }

    setupRoutes(routes) {
        routes.forEach(route => {
            this.app.use(route.path, route.router);
        });

        // Global Error Handler - Must be after all routes
        const errorMiddleware = require('./middleware/error.middleware');
        this.app.use(errorMiddleware);
    }

    setupHealthCheck() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'UP' });
        });
    }

    getExpressApp() {
        return this.app;
    }
}

module.exports = App;
