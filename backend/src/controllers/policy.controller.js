const policyService = require('../services/policy.service');
const asyncHandler = require('../utils/asyncHandler');

class PolicyController {
    startProcessing = asyncHandler(async (req, res) => {
        const { type } = req.body;
        const userEmail = req.user ? req.user.email : 'anonymous';
        const result = await policyService.startPolicyProcessing(req.files, type, userEmail);
        res.status(202).json(result);
    });

    streamJobUpdates = (req, res) => {
        const { id } = req.params;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        policyService.addSSEClient(id, res);

        req.on('close', () => {
            policyService.removeSSEClient(id, res);
        });
    };

    getJobStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const job = await policyService.getJobStatus(id);
        res.json(job);
    });

    getPolicyHtml = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const html = await policyService.getPolicyHtml(id);
        res.send(html);
    });

    updatePolicyData = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { extractedData } = req.body;
        const result = await policyService.updatePolicyData(id, extractedData);
        res.json(result);
    });

    getUserPolicies = asyncHandler(async (req, res) => {
        const summary = await policyService.getUserPolicies();
        res.json(summary);
    });
}

module.exports = new PolicyController();
