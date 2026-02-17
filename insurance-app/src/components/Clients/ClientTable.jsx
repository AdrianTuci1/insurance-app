import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import './ClientTable.css';

const ClientTable = observer(({ clients, loading }) => {
    const navigate = useNavigate();

    const getStatusClass = (status) => {
        switch (status) {
            case 'Complete': return 'status-complete';
            case 'Incomplete': return 'status-incomplete';
            case 'In Progress': return 'status-progress';
            case 'Not Started': return 'status-not-started';
            default: return '';
        }
    };

    if (loading && clients.length === 0) {
        return (
            <div className="table-loading">
                <div className="spinner">⏳</div>
                <p>Loading offers...</p>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="empty-state">
                <User className="empty-icon" strokeWidth={1.5} />
                <h3>No records found</h3>
                <p>Try adjusting your search terms or filters.</p>
            </div>
        );
    }

    return (
        <div className="client-table-container">
            <table className="client-table">
                <thead>
                    <tr>
                        <th className="th-status">Status</th>
                        <th className="th-id">Job #</th>
                        <th className="th-customer">Customer</th>
                        <th className="th-type">Type</th>
                        <th className="th-amount">Amount</th>
                        <th className="th-date">Date</th>
                        <th className="th-action"></th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map((client) => (
                        <tr
                            key={client.id}
                            onClick={() => navigate(`/client/${client.id}`)}
                            className="table-row"
                        >
                            <td>
                                <span className={`status-badge ${getStatusClass(client.status)}`}>
                                    {client.status}
                                </span>
                            </td>
                            <td>
                                <div className="cell-id">#{client.id}</div>
                            </td>
                            <td>
                                <div className="cell-name">{client.name}</div>
                            </td>
                            <td>
                                <span className="type-tag">{client.type}</span>
                            </td>
                            <td>
                                <div className="cell-amount">
                                    {client.amount}
                                    {client.status === 'Complete' && <span className="paid-tag">Paid</span>}
                                </div>
                            </td>
                            <td>
                                <div className="cell-sub">{client.date}</div>
                            </td>
                            <td className="action-cell">
                                ›
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

export default ClientTable;
