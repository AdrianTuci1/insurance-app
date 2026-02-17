/**
 * Deduplicates an array of offers based on company name, rate1, and sum.
 * @param {Array} offers - The array of offer objects.
 * @returns {Array} - The deduplicated array of offers.
 */
const deduplicateOffers = (offers) => {
    if (!Array.isArray(offers)) return [];

    const seen = new Set();
    return offers.filter(offer => {
        // Create a unique key for each offer
        // Normalize strings to lower case and trim for robust comparison
        const company = (offer.company || offer.insurer || '').trim().toLowerCase();
        const rate1 = (offer.rate1 || '').toString().trim();
        const sum = (offer.sum || '').toString().trim();

        // Key composition: company|rate1|sum
        // If necessary, add more fields to the key
        const key = `${company}|${rate1}|${sum}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
};

module.exports = { deduplicateOffers };
