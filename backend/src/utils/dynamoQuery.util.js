
// Helper to build DynamoDB FilterExpression
exports.buildFilterExpression = (filters) => {
    let filterExpression = [];
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};

    Object.keys(filters).forEach((key, index) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            const attrName = `#attr${index}`;
            const attrValue = `:val${index}`;

            filterExpression.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;

            // Handle booleans vs strings
            if (key === 'isPaid' && (filters[key] === 'true' || filters[key] === true)) {
                expressionAttributeValues[attrValue] = true;
            } else if (key === 'isPaid' && (filters[key] === 'false' || filters[key] === false)) {
                expressionAttributeValues[attrValue] = false;
            } else {
                expressionAttributeValues[attrValue] = filters[key];
            }
        }
    });

    if (filterExpression.length === 0) {
        return { filterExpression: null, expressionAttributeNames: null, expressionAttributeValues: null };
    }

    return {
        filterExpression: filterExpression.join(' AND '),
        expressionAttributeNames,
        expressionAttributeValues
    };
};
