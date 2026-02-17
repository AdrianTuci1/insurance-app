import { makeAutoObservable, runInAction } from 'mobx';
import { dataFacade } from '../services/DataFacade';
import { ClientBuilder } from '../utils/ClientBuilder';

class ClientStore {
    clients = [];
    loading = false;
    searchTerm = '';
    activeFilter = 'Show All';
    isDemoMode = false;

    constructor() {
        makeAutoObservable(this);
    }

    async fetchClients() {
        this.loading = true;
        try {
            const data = await dataFacade.getClients();
            runInAction(() => {
                this.clients = data.map(item => ClientBuilder.fromApiResponse(item).build());
                this.loading = false;
            });
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async getClient(id) {
        try {
            const rawData = await dataFacade.getClient(id);
            return ClientBuilder.fromApiResponse(rawData).build();
        } catch (error) {
            console.error('Failed to get client:', error);
            throw error;
        }
    }

    async addClient(clientData) {
        try {
            const response = await dataFacade.addClient(clientData);
            const newClient = ClientBuilder.fromApiResponse(response).build();
            this.handleLocalUpdate(newClient);
        } catch (error) {
            console.error('Failed to add client:', error);
        }
    }

    async updateClient(id, updatedData) {
        try {
            const response = await dataFacade.updateClient(id, updatedData);
            const client = ClientBuilder.fromApiResponse(response).build();
            this.handleLocalUpdate(client);
            return client;
        } catch (error) {
            console.error('Failed to update client:', error);
            throw error;
        }
    }

    async deleteClient(id) {
        try {
            await dataFacade.deleteClient(id);
            this.handleLocalDeletion(id);
        } catch (error) {
            console.error('Failed to delete client:', error);
            throw error;
        }
    }

    // --- Private/Helper Actions ---

    handleLocalUpdate(client) {
        runInAction(() => {
            if (this.isDemoMode) {
                const index = this.clients.findIndex(c => c.id === client.id);
                if (index !== -1) {
                    this.clients[index] = client;
                } else {
                    this.clients.push(client);
                }
            } else {
                this.fetchClients();
            }
        });
    }

    handleLocalDeletion(id) {
        runInAction(() => {
            if (this.isDemoMode) {
                this.clients = this.clients.filter(c => c.id !== id);
            } else {
                this.fetchClients();
            }
        });
    }

    setSearchTerm(term) {
        this.searchTerm = term;
    }

    setActiveFilter(filter) {
        this.activeFilter = filter;
    }

    toggleDataSource() {
        this.isDemoMode = !this.isDemoMode;
        if (this.isDemoMode) {
            dataFacade.useDemo();
        } else {
            dataFacade.useApi();
        }
        this.fetchClients();
    }
}

export const clientStore = new ClientStore();
