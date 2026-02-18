import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore, clientStore, uiStore } from '../../stores/RootStore';
import { LogOut, Settings as SettingsIcon, Plus, Search, ChevronLeft, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import SettingsModal from '../Settings/SettingsModal';
import AddOfferModal from '../Clients/AddOfferModal';
import HeaderFilters from './HeaderFilters';
import './Header.css';

const Header = observer(() => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Access stores directly
    const { user, logout } = authStore;
    // Don't destructure MobX observables/actions from clientStore to preserve 'this' context

    // Determine current view
    const isDashboard = location.pathname === '/';
    const isClientDetail = location.pathname.startsWith('/client/');

    // Get client name/id for detail view header
    const [clientHeaderInfo, setClientHeaderInfo] = useState(null);

    useEffect(() => {
        if (isClientDetail) {
            const parts = location.pathname.split('/');
            const id = parts[2]; // Format is /client/:id/...
            // Try to find client in store first, or fetch if needed (store handles fetch)
            // Ideally we just grab from store.clients if loaded
            const foundClient = clientStore.clients.find(c => c.id === id);
            if (foundClient) {
                setClientHeaderInfo(foundClient.name || `Job #${foundClient.id}`);
            } else {
                // Fallback if direct access or reload
                // We could trigger a fetch, but ClientDetail component does that.
                // We just display ID for now or "Job Details"
                setClientHeaderInfo(`Job #${id}`);
            }
        } else {
            setClientHeaderInfo(null);
        }
    }, [location.pathname, clientStore.clients]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <>
            <header className="header">
                <div className="header-top">
                    <div className="header-left-content">
                        {isDashboard ? (
                            // Dashboard Header: Search + Add Button
                            <div className="dashboard-header-controls">
                                <div className="header-search-container">
                                    <div className="search-wrapper-top">
                                        <Search className="search-icon-top" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search clients, policies..."
                                            className="nav-search-input-top"
                                            value={clientStore.searchTerm}
                                            onChange={(e) => clientStore.setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddOfferOpen(true)}
                                    className="action-btn plus-btn"
                                    title="New Offer"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        ) : (
                            // Client Detail Header: Back + Title
                            <div className="detail-header-controls">
                                <button
                                    onClick={() => navigate('/')}
                                    className="header-back-btn"
                                    title="Back to Dashboard"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <h1 className="header-page-title">
                                    {clientHeaderInfo || 'Job Details'}
                                </h1>

                                <div className="header-custom-actions">
                                    {uiStore.headerActions && typeof uiStore.headerActions === 'function' ? (
                                        <uiStore.headerActions />
                                    ) : uiStore.headerActions}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="header-right-content">
                        <div className="header-user">
                            <button
                                className="avatar-btn"
                                title={user.name}
                            >
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt={user.name}
                                    className="avatar-img"
                                />
                            </button>

                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <p className="user-name">{user.name}</p>
                                    <p className="user-email">{user.email}</p>
                                </div>

                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="dropdown-item settings"
                                >
                                    <SettingsIcon size={16} />
                                    Settings
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="dropdown-item logout"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Row - Only on Dashboard */}
                {isDashboard && <HeaderFilters />}
            </header>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <AddOfferModal
                isOpen={isAddOfferOpen}
                onClose={() => setIsAddOfferOpen(false)}
            />
        </>
    );
});

export default Header;
