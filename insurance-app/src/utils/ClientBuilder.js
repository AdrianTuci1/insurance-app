/**
 * Builder for Client objects to ensure consistent structure and normalization
 * across the application.
 */
export class ClientBuilder {
    constructor(data = {}) {
        this.client = {
            id: data.id || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            type: data.type || '',
            vin: data.vin || '',
            status: data.status || 'Not Started',
            amount: data.amount || '0 €',
            offers: data.offers || [], // Flat list for internal selection if needed
            groupedOffers: data.groupedOffers || { withoutFranchise: [], withFranchise: [] },
            date: data.date || new Date().toLocaleDateString('ro-RO'),
            object: data.object || '',
            documents: data.documents || [],
            finalPolicy: data.finalPolicy || null,
            finalPolicyUrl: data.finalPolicyUrl || null,
            html: data.html || null,
            originalData: data.originalData || data
        };
    }

    static fromApiResponse(apiData) {
        const builder = new ClientBuilder();
        const extracted = apiData.extractedData || {};
        const clientData = extracted.clientData || apiData.clientData || apiData;

        builder.client.id = apiData.jobId || apiData.id;

        // Use "Pending..." for Name and Object if not present
        builder.client.name = clientData.name && clientData.name !== 'N/A' ? clientData.name : 'Pending...';
        builder.client.object = clientData.object && clientData.object !== 'N/A' ? clientData.object : 'Pending...';
        builder.client.vin = clientData.vin || '';

        builder.client.phone = clientData.phone || 'N/A';
        builder.client.email = clientData.email || 'N/A';
        builder.client.type = apiData.policyType || apiData.type || '';
        builder.client.date = apiData.createdAt ? new Date(apiData.createdAt).toLocaleDateString('ro-RO') : (apiData.date || new Date().toLocaleDateString('ro-RO'));

        // Handle complex offers structure
        const withoutFranchise = extracted.offersWithoutFranchise || [];
        const withFranchise = extracted.offersWithFranchise || [];

        const normalizeOffer = (o, hasFranchise) => ({
            company: o.company || o.insurer,
            rate1: builder.formatAmount(o.rate1),
            rate4: o.rate4 ? builder.formatAmount(o.rate4) : null,
            franchisePartial: o.franchisePartial,
            franchiseTotal: o.franchiseTotal,
            sum: builder.formatAmount(o.sum),
            hasFranchise
        });

        builder.client.groupedOffers = {
            withoutFranchise: withoutFranchise.map(o => normalizeOffer(o, false)),
            withFranchise: withFranchise.map(o => normalizeOffer(o, true))
        };

        // Flattened list for easier initial selection in components
        builder.client.offers = [
            ...builder.client.groupedOffers.withoutFranchise,
            ...builder.client.groupedOffers.withFranchise
        ];

        // Default amount (Rate 1 of first offer)
        const firstOffer = builder.client.offers[0];
        builder.client.amount = firstOffer ? firstOffer.rate1 : builder.formatAmount(apiData.amount);

        builder.client.status = builder.normalizeStatus(apiData.status);
        builder.client.originalData = apiData;

        if (builder.client.status === 'Complete') {
            builder.client.finalPolicy = apiData.finalPolicy || 'Policy_Generated.pdf';
            builder.client.finalPolicyUrl = apiData.finalPolicyUrl || '#';
        }

        builder.client.html = apiData.html || null;

        return builder;
    }

    formatAmount(amount) {
        if (amount === undefined || amount === null) return '0 €';
        const str = String(amount);
        if (str.includes('€')) return str;
        // Strip any other currencies/text
        const numeric = str.replace(/[^0-9.]/g, '');
        return numeric ? `${numeric} €` : '0 €';
    }

    normalizeStatus(status) {
        if (!status) return 'Not Started';
        const s = status.toLowerCase();
        if (s === 'complete' || s === 'finished') return 'Complete';
        if (s === 'failed' || s === 'incomplete') return 'Incomplete';
        if (s === 'in progress' || s === 'processing') return 'In Progress';
        return status;
    }

    withBasicInfo(info) {
        this.client = { ...this.client, ...info };
        return this;
    }

    withDocuments(docs) {
        this.client.documents = docs;
        return this;
    }

    build() {
        return { ...this.client };
    }
}
