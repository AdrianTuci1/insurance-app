
const express = require('express');
const router = express.Router();
const netopiaService = require('../services/netopia.service');
const Job = require('../models/job.model');
const auth = require('../middleware/auth.middleware');

// 1. Generate Payment Link
router.post('/link', auth, async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await Job.findById(jobId);

        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.userEmail !== req.user.email) return res.status(403).json({ error: 'Unauthorized' });

        // Hardcoded price for now
        const amount = 50.00;

        const paymentData = await netopiaService.generatePaymentLink(jobId, amount, req.user.email);
        res.json(paymentData);
    } catch (error) {
        console.error("Payment Link Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Webhook (IPN)
router.post('/webhook', async (req, res) => {
    try {
        const { env_key, data } = req.body;

        // Verify and Decrypt
        const result = netopiaService.verifySignature(env_key, data);

        if (result.status === 'confirmed' || result.status === 'paid') {
            await Job.markAsPaid(result.orderId, 'netopia_txn_id');
            console.log(`Job ${result.orderId} marked as paid via Webhook.`);
        }

        // Return XML response required by Netopia
        res.set('Content-Type', 'application/xml');
        res.send('<?xml version="1.0" encoding="utf-8"?><crc error_type="0" error_code="0">Success</crc>');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send('Error');
    }
});

module.exports = router;
