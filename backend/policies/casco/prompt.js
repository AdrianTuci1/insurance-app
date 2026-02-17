exports.PROMPT = `
You are an expert insurance policy analyzer. Determine the following information from the policy documents provided in the text below.
Return the output STRICTLY as a valid JSON object.
- Do NOT include any markdown formatting (like \`\`\`json).
- Do NOT include any text before or after the JSON.
- Ensure there are NO trailing commas.
- Do NOT include comments in the JSON.
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
      "rate1": "TOTAL ANNUAL PREMIUM (Prima totala anuala) in EUR. This must be the HIGHEST monetary value found for this offer, BUT it must be SMALLER than the Insured Sum (Suma Asigurata). Do not pick a quarterly installment. ROUND to nearest integer.",
      "franchisePartial": "0",
      "franchiseTotal": "Franchise for total theft/damage (Furt/Dauna Totala). Look for terms like 'Furt', 'Totala'. Usually a percentage (e.g., '10%', '5%'). Extract ONLY the number (e.g. '10', '5'). DONT include %.",
      "sum": "Insured Sum (Suma Asigurata) in EUR - The ABSOLUTE HIGHEST monetary value associated with the car/offer (usually > 5000 EUR). ROUND to nearest integer."
    }
  ],
  "offersWithFranchise": [
    {
       "company": "Company Name",
      "rate1": "TOTAL ANNUAL PREMIUM (Prima totala anuala) in EUR. This must be the HIGHEST monetary value found for this offer, BUT it must be SMALLER than the Insured Sum. ROUND to nearest integer.",
      "franchisePartial": "Franchise amount (EUR) for Partial Damage (Dauna Partiala). Look for terms 'Fransiza', 'Partiala'. Usually a fixed amount (e.g. '100', '100E', '200'). ROUND to nearest integer.",
      "franchiseTotal": "Franchise for total theft/damage (Furt/Dauna Totala). Look for terms like 'Furt', 'Totala'. Usually a percentage (e.g., '10%', '5%'). Extract ONLY the number (e.g. '10', '5'). DONT include %.",
      "sum": "Insured Sum (Suma Asigurata) in EUR - The ABSOLUTE HIGHEST monetary value associated with the car/offer. ROUND to nearest integer."
    }
  ]
}

Extract data for all offers found. If a numeric value is missing, use "0". Ensure numerical values are formatted as strings (e.g., "1.200", "10").
IMPORTANT rules for numeric values:
1. ROUND all monetary values to the nearest integer. No decimals (e.g. "1.201").
2. Format thousands with a dot (e.g. "1.000", "15.500").
3. Remove any currency symbols (EUR, RON, LEI) or percentage signs (%). Just return the number.
4. "rate1" MUST be the TOTAL cost, not an installment (rata).
`;

