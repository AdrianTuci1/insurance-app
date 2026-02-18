import { apiService } from '../api.service';
import { IDataStrategy } from './IDataStrategy';

export class ApiStrategy extends IDataStrategy {
    async getClients(search) {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const data = await apiService.get(`/policies${query}`);
        return data.map(job => ({
            ...job,
            id: job.jobId,
            type: job.policyType,
            date: new Date(job.createdAt).toLocaleDateString('ro-RO'),
        }));
    }

    async getClient(id) {
        // This might need adjustment based on how the store uses it vs direct API calls
        // For now, adhering to the pattern where we fetch full details
        const fullData = await apiService.get(`/policies/status/${id}`);

        // Fetch HTML separately if available (status complete or has data)
        let htmlContent = null;
        if (fullData.status === 'complete' || fullData.extractedData) {
            try {
                htmlContent = await apiService.get(`/policies/${id}/html`, { responseType: 'text' });
            } catch (error) {
                console.warn('Failed to fetch policy HTML:', error);
            }
        }

        return {
            ...fullData,
            id: fullData.jobId,
            name: fullData.extractedData?.clientData?.name || fullData.clientData?.name || 'N/A',
            phone: fullData.extractedData?.clientData?.phone || fullData.clientData?.phone || 'N/A',
            object: fullData.extractedData?.clientData?.object || 'N/A',
            status: fullData.status === 'complete' ? 'Complete' :
                fullData.status === 'failed' ? 'Incomplete' :
                    fullData.status === 'in progress' ? 'In Progress' : 'Not Started',
            amount: fullData.extractedData?.offersWithFranchise?.[0]?.rate1 || '0 €',
            html: htmlContent, // Use independently fetched HTML
            originalData: fullData // Keep original structure if needed
        };
    }

    async addClient(clientData) {
        // Implementation depends on backend endpoint for creation
        // For now, assuming standard POST
        return await apiService.post('/policies', clientData);
    }

    async updateClient(id, data) {
        // This logic was in ClientContext, moving it here or keeping it in Facade?
        // Strategies should handle raw data operations.
        // Complex business logic (like constructing the nested object) might belong in the Store or Facade.
        // For now, we'll pass the fully formed payload.
        return await apiService.put(`/policies/${id}`, data);
    }

    async deleteClient(id) {
        return await apiService.delete(`/policies/${id}`);
    }
}
