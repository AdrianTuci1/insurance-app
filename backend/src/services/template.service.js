
const ejs = require('ejs');
const path = require('path');

exports.renderTemplate = async (policyType, data) => {
    const templatePath = path.join(__dirname, `../policies/${policyType}/template.ejs`);
    try {
        return await ejs.renderFile(templatePath, data);
    } catch (error) {
        console.error("Template Rendering Error:", error);
        throw error;
    }
};
