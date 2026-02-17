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

    connectToSSE() {
        if (this.isDemoMode) return;

        // Close existing connection if any (to avoid duplicates)
        if (this.eventSource) {
            this.eventSource.close();
        }

        // We use a general events endpoint if available, or listen to specific job updates
        // Since the requirement is to update the dashboard when a background job completes,
        // we might need a global event stream or just rely on manual refresh/polling for now
        // if the backend doesn't support a global stream.
        // CHECK: The backend routes showed `router.get('/events/:id', ...)` but no global stream.
        // If we don't have a global stream, we can't easily listen for *any* completion without polling.
        // However, for the specific user flow (Upload -> Redirect -> ClientDetail), the ClientDetail
        // page will connect to the specific job SSE.
        // For the Dashboard, we can implement a simple poll or just rely on the user refreshing/navigating.

        // REVISION: The plan mentioned "Global SSE". If the backend doesn't support it, 
        // I will implement a polling mechanism for the dashboard or just leave it for now 
        // and focus on the specific ClientDetail SSE which is critical for the "Processing" state.

        // Let's implement a safe poller for the dashboard for now to ensure list is up to date.
        this.startPolling();
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    startPolling() {
        this.stopPolling();
        this.pollInterval = setInterval(() => {
            if (!this.loading) {
                this.fetchClients(); // Silent fetch could be better to avoid flickering
            }
        }, 10000); // Poll every 10 seconds
    }
}

export const clientStore = new ClientStore();
