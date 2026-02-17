
const http = require('http');

class Server {
    constructor(app, port) {
        this.app = app;
        this.port = port;
        this.server = null;
    }

    start() {
        this.server = http.createServer(this.app);

        this.server.listen(this.port, () => {
            console.log(`Server is running in SOLID OOP mode on port ${this.port}`);
            // Explicitly ref the server handle to ensure the event loop stays active
            // This is normally default behavior but helps in some environments where
            // the Express listener might be behaving unexpectedly.
            this.server.ref();
        });

        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }

            switch (error.code) {
                case 'EACCES':
                    console.error(`Port ${this.port} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`Port ${this.port} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = Server;
