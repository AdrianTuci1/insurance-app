/**
 * Interface for Data Strategies
 * All strategies must implement these methods.
 */
export class IDataStrategy {
    async getClients() { throw new Error('Method not implemented'); }
    async getClient(id) { throw new Error('Method not implemented'); }
    async addClient(clientData) { throw new Error('Method not implemented'); }
    async updateClient(id, data) { throw new Error('Method not implemented'); }
    async deleteClient(id) { throw new Error('Method not implemented'); }
}
