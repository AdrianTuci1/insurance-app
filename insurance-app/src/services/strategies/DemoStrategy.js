import { IDataStrategy } from './IDataStrategy';

const MOCK_CLIENTS = [
    {
        id: '1001',
        status: 'Complete',
        createdAt: '2025-02-15T10:00:00Z',
        policyType: 'CASCO',
        extractedData: {
            clientData: {
                name: 'Popescu Ion',
                object: 'Volkswagen Golf 8',
                vin: 'WVWZZZCDZLW000123',
                phone: '0722123456',
                email: 'ion.popescu@example.com'
            },
            offersWithoutFranchise: [
                { company: 'Allianz', rate1: '1200', rate4: '315', sum: '25000', franchisePartial: '0', franchiseTotal: '0%' },
                { company: 'Omniasig', rate1: '1150', rate4: '300', sum: '24500', franchisePartial: '0', franchiseTotal: '0%' }
            ],
            offersWithFranchise: [
                { company: 'Groupama', rate1: '950', rate4: '250', sum: '25000', franchisePartial: '150 €', franchiseTotal: '10%' },
                { company: 'Grawe', rate1: '890', rate4: '235', sum: '25000', franchisePartial: '200 €', franchiseTotal: '10%' }
            ]
        }
    },
    {
        id: '1002',
        status: 'In Progress',
        createdAt: '2025-02-16T14:30:00Z',
        policyType: 'Locuinta',
        extractedData: {
            clientData: {
                name: 'Maria Ionescu',
                object: 'Ap. 2, Et. 4, Brasov',
                phone: '0744987654'
            },
            offersWithFranchise: [
                { company: 'Generali', rate1: '450', sum: '85000', franchisePartial: '100 €' }
            ]
        }
    },
    {
        id: '1003',
        status: 'Incomplete',
        createdAt: '2025-02-17T09:15:00Z',
        policyType: 'CASCO',
        extractedData: {
            clientData: {
                name: 'Pending...',
                object: 'Pending...',
                vin: ''
            }
        }
    }
];

export class DemoStrategy extends IDataStrategy {
    async getClients() {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        return [...MOCK_CLIENTS];
    }

    async getClient(id) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const client = MOCK_CLIENTS.find(c => c.id === id);
        if (!client) throw new Error('Client not found');
        return {
            ...client,
            // Mocking the structure expected by ClientDetail
            originalData: {
                extractedData: {
                    clientData: {
                        name: client.name,
                        phone: client.phone,
                        object: client.object
                    },
                    offersWithFranchise: [
                        { insurer: 'Allianz', rate1: '1200 RON', rate2: '1100 RON' },
                        { insurer: 'Groupama', rate1: '1250 RON', rate2: '1150 RON' }
                    ]
                }
            }
        };
    }

    async addClient(clientData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newClient = {
            id: Math.floor(Math.random() * 1000000).toString(),
            ...clientData,
            status: 'Not Started',
            date: new Date().toLocaleDateString('ro-RO'),
            amount: '0 RON'
        };
        MOCK_CLIENTS.push(newClient);
        return newClient;
    }

    async updateClient(id, data) {
        await new Promise(resolve => setTimeout(resolve, 600));
        const index = MOCK_CLIENTS.findIndex(c => c.id === id);
        if (index !== -1) {
            MOCK_CLIENTS[index] = { ...MOCK_CLIENTS[index], ...data };
            return MOCK_CLIENTS[index];
        }
        throw new Error('Client not found');
    }

    async deleteClient(id) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = MOCK_CLIENTS.findIndex(c => c.id === id);
        if (index !== -1) {
            MOCK_CLIENTS.splice(index, 1);
            return { success: true };
        }
        throw new Error('Client not found');
    }
}
