const { deduplicateOffers } = require('./src/utils/deduplicateData');

const testOffers = [
    { company: 'Allianz', rate1: '100', sum: '10000' },
    { company: 'Allianz', rate1: '100', sum: '10000' }, // Duplicate
    { company: 'Groupama', rate1: '120', sum: '12000' },
    { company: 'Allianz', rate1: '105', sum: '10000' }, // Different rate
    { company: 'Allianz', rate1: '100', sum: '15000' }, // Different sum
    { insurer: 'Generali', rate1: '200', sum: '20000' },
    { company: 'Generali', rate1: '200', sum: '20000' } // Duplicate with mixed keys (insurer vs company)
];

const deduped = deduplicateOffers(testOffers);

console.log('Original length:', testOffers.length);
console.log('Deduped length:', deduped.length);
console.log('Deduped offers:', deduped);

if (deduped.length === 5) {
    console.log('TEST PASSED');
} else {
    console.error('TEST FAILED');
}
