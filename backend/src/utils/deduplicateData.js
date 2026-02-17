/**
 * Deduplicates an array of offers based on company name, rate1, and sum.
 * @param {Array} offers - The array of offer objects.
 * @returns {Array} - The deduplicated array of offers.
 */
const deduplicateOffers = (offers) => {
    if (!Array.isArray(offers)) return [];

    const seen = new Set();
    return offers.filter(offer => {
        // Create a unique key for each offer based ONLY on company name
        // Normalize strings to lower case and trim for robust comparison
        const company = (offer.company || offer.insurer || '').trim().toLowerCase();

        // Skip empty company names
        if (!company) return false;

        if (seen.has(company)) {
            return false;
        }

        seen.add(company);
        return true;
    });
};

module.exports = { deduplicateOffers };
