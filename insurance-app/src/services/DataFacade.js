import { ApiStrategy } from './strategies/ApiStrategy';
import { DemoStrategy } from './strategies/DemoStrategy';

class DataFacade {
    constructor() {
        this.apiStrategy = new ApiStrategy();
        this.demoStrategy = new DemoStrategy();
        this.currentStrategy = this.apiStrategy; // Default to API
        this.isDemoMode = false;
    }

    useApi() {
        this.currentStrategy = this.apiStrategy;
        this.isDemoMode = false;
    }

    useDemo() {
        this.currentStrategy = this.demoStrategy;
        this.isDemoMode = true;
    }

    toggleMode() {
        if (this.isDemoMode) {
            this.useApi();
        } else {
            this.useDemo();
        }
        return this.isDemoMode;
    }

    async getClients() {
        return await this.currentStrategy.getClients();
    }

    async getClient(id) {
        return await this.currentStrategy.getClient(id);
    }

    async addClient(clientData) {
        return await this.currentStrategy.addClient(clientData);
    }

    async updateClient(id, data) {
        return await this.currentStrategy.updateClient(id, data);
    }

    async deleteClient(id) {
        return await this.currentStrategy.deleteClient(id);
    }
}

export const dataFacade = new DataFacade();
