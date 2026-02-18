import React from 'react';
import { User as UserIcon, Users as UsersIcon, Settings as SettingsIcon, LogOut } from 'lucide-react';

const Sidebar = ({ user, activeTab, setActiveTab, onLogout, isAdmin }) => {
    return (
        <aside className="settings-sidebar-custom">
            <div className="sidebar-brand">
                <div className="user-profile-summary">
                    <div className="user-visual">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info-text">
                        <span className="user-display-name">{user?.name || 'User'}</span>
                        <span className="user-display-role">{user?.role || 'Member'}</span>
                    </div>
                </div>
            </div>

            <div className="sidebar-nav-list">
                <button
                    className={`sidebar-nav-item ${['account', 'email-change', 'password-change'].includes(activeTab) ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    <UserIcon size={18} /> Account Settings
                </button>

                {isAdmin && (
                    <>
                        <button
                            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <UsersIcon size={18} /> Manage Team
                        </button>

                        <button
                            className={`sidebar-nav-item ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <SettingsIcon size={18} /> General Settings
                        </button>
                    </>
                )}
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-nav-item logout-trigger" onClick={onLogout}>
                    <LogOut size={18} /> Log out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
