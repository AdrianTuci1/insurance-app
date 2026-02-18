
// Helper to build DynamoDB FilterExpression
exports.buildFilterExpression = (filters) => {
    let filterExpressions = [];
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};
    let attrCounter = 0;

    const getPartTag = (part) => {
        const tag = `#pk_${part.replace(/[^a-zA-Z0-9]/g, '_')}`;
        expressionAttributeNames[tag] = part;
        return tag;
    };

    Object.keys(filters).forEach((key) => {
        const val = filters[key];
        if (val === undefined || val === null || val === '') return;

        if (key === 'search') {
            const searchVal = val.toString();
            // Case-insensitive search isn't directly supported by 'contains' in DynamoDB (it is case-sensitive)
            // But we'll implement it as is, or suggest lowercasing data in the future.
            const searchValTag = `:searchVal`;
            expressionAttributeValues[searchValTag] = searchVal;

            const fields = [
                ['jobId'],
                ['extractedData', 'clientData', 'name'],
                ['extractedData', 'clientData', 'phone'],
                ['extractedData', 'clientData', 'object']
            ];

            const orConditions = fields.map(pathParts => {
                const pathPartsTags = pathParts.map(part => getPartTag(part));
                const fullPath = pathPartsTags.join('.');
                return `contains(${fullPath}, ${searchValTag})`;
            });

            filterExpressions.push(`(${orConditions.join(' OR ')})`);
        } else {
            const attrTag = `#attr${attrCounter}`;
            const valTag = `:val${attrCounter}`;
            attrCounter++;

            filterExpressions.push(`${attrTag} = ${valTag}`);
            expressionAttributeNames[attrTag] = key;

            // Handle booleans vs strings
            if (key === 'isPaid') {
                expressionAttributeValues[valTag] = (val === 'true' || val === true);
            } else {
                expressionAttributeValues[valTag] = val;
            }
        }
    });

    if (filterExpressions.length === 0) {
        return { filterExpression: null, expressionAttributeNames: null, expressionAttributeValues: null };
    }

    return {
        filterExpression: filterExpressions.join(' AND '),
        expressionAttributeNames,
        expressionAttributeValues
    };
};
