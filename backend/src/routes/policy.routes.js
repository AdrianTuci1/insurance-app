
const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policy.controller');
const upload = require('../middleware/upload.middleware');
const auth = require('../middleware/auth.middleware');

// Protect processing route with Auth
router.post('/process', auth, upload.array('documents', 10), policyController.startProcessing);

// SSE Endpoint (No Auth for simplicity of browser EventSource, or pass token via query param if needed)
// For now, let's keep it open or require query param token validation
router.get('/events/:id', policyController.streamJobUpdates);

// Fallback status
router.get('/status/:id', policyController.getJobStatus);

// List all user policies
router.get('/', auth, policyController.getUserPolicies);

// Update policy data
router.put('/:id', auth, policyController.updatePolicyData);

module.exports = router;
