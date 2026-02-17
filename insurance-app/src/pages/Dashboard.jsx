import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { clientStore } from '../stores/ClientStore';
import { Database } from 'lucide-react';
import ClientTable from '../components/Clients/ClientTable';
import './Dashboard.css';

const Dashboard = observer(() => {
    // Access store
    const { clients, loading, searchTerm, activeFilter, isDemoMode } = clientStore;

    // Fetch initial data
    useEffect(() => {
        if (clients.length === 0) {
            clientStore.fetchClients();
        }
    }, [clients.length]);

    // Memoize filtered results for performance
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch =
                (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (client.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            if (activeFilter === 'Show All') return matchesSearch;
            return matchesSearch && client.status === activeFilter;
        });
    }, [clients, searchTerm, activeFilter]);

    return (
        <div className="dashboard-container animate-fade-in">
            {/* Data Source Toggle */}
            <div className="data-source-toggle">
                <button
                    onClick={() => clientStore.toggleDataSource()}
                    className={`toggle-btn ${isDemoMode ? 'demo-active' : ''}`}
                    title={isDemoMode ? 'Switch to Real API' : 'Switch to Demo Data'}
                >
                    <Database size={14} />
                    {isDemoMode ? 'Demo Data' : 'Real API'}
                </button>
            </div>

            <div className="dashboard-content">
                <ClientTable
                    clients={filteredClients}
                    loading={loading}
                />
            </div>
        </div>
    );
});

export default Dashboard;
