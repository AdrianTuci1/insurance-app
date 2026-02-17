
const dotenv = require('dotenv');
dotenv.config();

const App = require('./src/app');
const Server = require('./src/server.class');
const AuthRoute = require('./src/routes/auth.routes');
const PolicyRoute = require('./src/routes/policy.routes');
const PaymentRoute = require('./src/routes/payment.routes');
const env = require('./src/config/env.config');

// 1. Initialize Routes
const routes = [
    new AuthRoute(),
    new PolicyRoute(),
    new PaymentRoute()
];

// 2. Initialize App with Routes
const appInstance = new App(routes);
const expressApp = appInstance.getExpressApp();

// 3. Initialize and Start Server
const PORT = env.PORT || 3000;
const server = new Server(expressApp, PORT);

server.start();
