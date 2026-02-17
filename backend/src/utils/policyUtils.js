/**
 * Utility functions for policy processing and formatting.
 */

/**
 * Formats a numeric value for display (e.g., 1234.56 -> 1.235).
 * Handles European formats and rounds to nearest integer.
 * @param {string|number} val - The value to format.
 * @returns {string} - The formatted string with dot thousands separator.
 */
const formatNumber = (val) => {
    if (val === undefined || val === null || val === '') return '0';

    // Remove all non-numeric characters except dots and commas
    let clean = val.toString().replace(/[^\d.,]/g, '');

    // Handle Ambiguity when only one type of separator is present
    if (clean.includes('.') && !clean.includes(',')) {
        const parts = clean.split('.');
        // If multiple dots (e.g. 1.234.567) or exactly 3 digits after dot (e.g. 1.000)
        // AND not a leading zero (e.g. 0.123), it's a thousands separator
        if (parts.length > 2 || (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '')) {
            clean = clean.replace(/\./g, '');
        }
    } else if (clean.includes(',') && !clean.includes('.')) {
        const parts = clean.split(',');
        // Same for commas if they are used as thousands separators (some systems do)
        // But usually in RO, comma is decimal. Let's be conservative.
        // If multiple commas, it's definitely thousands.
        if (parts.length > 2) {
            clean = clean.replace(/,/g, '');
        } else {
            // Single comma: in RO it's always decimal.
            clean = clean.replace(',', '.');
        }
    } else if (clean.includes('.') && clean.includes(',')) {
        // Both present: the last one is the decimal separator
        if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            clean = clean.replace(/,/g, '');
        }
    }

    const num = Math.round(parseFloat(clean) || 0);
    // Format with dot thousands separator for consistent European display
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Processes an array of offers: formats numbers and calculates Rate 4 (Rate 1 + 10%).
 * @param {Array} offers - The array of offer objects.
 * @returns {Array} - The processed array of offers.
 */
const processOffers = (offers) => {
    if (!Array.isArray(offers)) return [];

    return offers.map(offer => {
        // Format existing numeric fields
        offer.rate1 = formatNumber(offer.rate1);
        offer.sum = formatNumber(offer.sum);
        offer.franchisePartial = formatNumber(offer.franchisePartial);

        // Calculate Rate 4
        const rate1Num = parseInt(offer.rate1.replace(/\./g, '')) || 0;
        if (rate1Num > 0) {
            const rate4 = Math.round(rate1Num * 1.10);
            offer.rate4 = rate4.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        } else {
            offer.rate4 = offer.rate1;
        }

        // Clean franchiseTotal (strip non-numeric)
        if (offer.franchiseTotal) {
            offer.franchiseTotal = offer.franchiseTotal.toString().replace(/[^\d]/g, '') || '0';
        } else {
            offer.franchiseTotal = '0';
        }

        return offer;
    });
};

/**
 * Aggregates results from multiple analyzed documents.
 * @param {Array} validDocs - Array of documents with analyzed data.
 * @param {Function} deduplicateOffers - Function to deduplicate offers.
 * @returns {Object} - The aggregated policy data.
 */
const aggregatePolicyData = (validDocs, deduplicateOffers) => {
    const aggregatedData = {
        clientData: validDocs[0].data.clientData || {},
        offersWithoutFranchise: [],
        offersWithFranchise: [],
        risks: null,
        notes: null
    };

    validDocs.forEach(doc => {
        const result = doc.data;
        if (result.offersWithoutFranchise) aggregatedData.offersWithoutFranchise.push(...result.offersWithoutFranchise);
        if (result.offersWithFranchise) aggregatedData.offersWithFranchise.push(...result.offersWithFranchise);
    });

    // Deduplicate aggregated offers
    aggregatedData.offersWithoutFranchise = deduplicateOffers(aggregatedData.offersWithoutFranchise);
    aggregatedData.offersWithFranchise = deduplicateOffers(aggregatedData.offersWithFranchise);

    // Post-processing
    aggregatedData.offersWithoutFranchise = processOffers(aggregatedData.offersWithoutFranchise);
    aggregatedData.offersWithFranchise = processOffers(aggregatedData.offersWithFranchise);

    return aggregatedData;
};

module.exports = {
    formatNumber,
    processOffers,
    aggregatePolicyData
};
