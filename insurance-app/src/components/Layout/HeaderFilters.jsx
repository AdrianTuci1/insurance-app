import { observer } from 'mobx-react-lite';
import { clientStore } from '../../stores/ClientStore';
import { X } from 'lucide-react';
import './HeaderFilters.css';

const HeaderFilters = observer(() => {
    // const { activeFilter, setActiveFilter } = clientStore; // Removed destructuring
    const filters = ['Show All', 'Complete', 'Not Started', 'In Progress'];

    return (
        <div className="header-filters-container">
            <div className="filter-bar">
                {filters.map(filter => (
                    <button
                        key={filter}
                        className={`filter-btn ${clientStore.activeFilter === filter ? 'active' : ''}`}
                        onClick={() => {
                            if (clientStore.activeFilter === filter && filter !== 'Show All') {
                                clientStore.setActiveFilter('Show All');
                            } else {
                                clientStore.setActiveFilter(filter);
                            }
                        }}
                    >
                        {clientStore.activeFilter === filter && filter !== 'Show All' && <X size={14} className="close-icon" />}
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
});

export default HeaderFilters;
