
const express = require('express');

class BaseRoute {
    constructor(path) {
        this.path = path;
        this.router = express.Router();
    }
}

module.exports = BaseRoute;
