
const BaseRoute = require('./base.route');
const policyController = require('../controllers/policy.controller');
const upload = require('../middleware/upload.middleware');
const auth = require('../middleware/auth.middleware');

class PolicyRoute extends BaseRoute {
    constructor() {
        super('/api/policies');
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Protect processing route with Auth
        this.router.post('/process', auth, upload.array('documents', 100), policyController.startProcessing);

        // SSE Endpoint
        this.router.get('/events/:id', policyController.streamJobUpdates);

        // Fallback status
        this.router.get('/status/:id', policyController.getJobStatus);

        // List all user policies
        this.router.get('/', auth, policyController.getUserPolicies);

        // Update policy data
        this.router.put('/:id', auth, policyController.updatePolicyData);

        // Get policy HTML
        this.router.get('/:id/html', auth, policyController.getPolicyHtml);
    }
}

module.exports = PolicyRoute;
