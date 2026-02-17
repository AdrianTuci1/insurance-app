
exports.PROMPT = `
You are an expert insurance policy analyzer. extract the following information from the policy documents provided in the text below.
Return the output STRICTLY as a valid JSON object.
- Do NOT include any markdown formatting (like \`\`\`json).
- Do NOT include any text before or after the JSON.
- Ensure there are NO trailing commas.
- Ensure all keys and string values are enclosed in double quotes.

Structure:
{
  "clientData": {
    "name": "Name of the insured/policyholder",
    "object": "Object of insurance (e.g., car make model)",
    "vin": "Vehicle Identification Number (VIN/Serie sasiu)",
    "type": "CASCO"
  },
  "offersWithoutFranchise": [
    {
      "company": "Company Name",
      "rate1": "Premium for 1 installment (EUR)",
      "rate4": "Premium for 4 installments (EUR)",
      "franchisePartial": "0",
      "franchiseTotal": "Franchise for total theft/damage %",
      "sum": "Insured Sum (EUR)"
    }
  ],
  "offersWithFranchise": [
    {
       "company": "Company Name",
      "rate1": "Premium for 1 installment (EUR)",
      "rate4": "Premium for 4 installments (EUR)",
      "franchisePartial": "Franchise amount (EUR)",
      "franchiseTotal": "Franchise for total theft/damage %",
      "sum": "Insured Sum (EUR)"
    }
  ],
  "risks": "List of included risks",
  "notes": "Any special notes or conditions (e.g., age restrictions)"
}

Extract data for all offers found. If a value is missing, use null or an empty string. Ensure numerical values are formatted as strings (e.g., "1.200").
`;
