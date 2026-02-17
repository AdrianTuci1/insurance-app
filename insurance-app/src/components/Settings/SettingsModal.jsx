import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import { apiService } from '../../services/api.service';
import {
    UserPlus, Trash2, Key, Settings as SettingsIcon, Users as UsersIcon,
    User as UserIcon, Save, Loader2, X, LogOut, CreditCard,
    Calendar, Tag, Layers, Zap, Download, Database, ChevronRight, Mail
} from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = observer(({ isOpen, onClose }) => {
    const { user, logout } = authStore;
    const [activeTab, setActiveTab] = useState('account');
    const [settings, setSettings] = useState({ dataRetention: '1 month' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Forms state
    const [accountForm, setAccountForm] = useState({ name: user?.name || '', password: '', confirmPassword: '' });
    const [emailForm, setEmailForm] = useState({ email: user?.email || '' });
    const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'user', name: '' });

    useEffect(() => {
        if (isOpen && user?.role === 'admin') {
            fetchSettings();
            fetchUsers();
        }
        if (isOpen) {
            setAccountForm({ name: user?.name || '', password: '', confirmPassword: '' });
            setEmailForm({ email: user?.email || '' });
            setMessage({ type: '', text: '' });
        }
    }, [isOpen, user]);

    const fetchSettings = async () => {
        try {
            const data = await apiService.get('/auth/settings');
            setSettings(data);
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await apiService.get('/auth/users');
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const handleUpdateAccount = async (e) => {
        if (e) e.preventDefault();
        setMessage({ type: '', text: '' });

        if (activeTab === 'password-change' && accountForm.password && accountForm.password !== accountForm.confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match' });
        }

        setLoading(true);
        try {
            const updateBody = { name: accountForm.name };
            if (activeTab === 'email-change') updateBody.email = emailForm.email;
            if (activeTab === 'password-change' && accountForm.password) updateBody.password = accountForm.password;

            await apiService.patch(`/auth/users/${user.email}`, updateBody);
            setMessage({ type: 'success', text: 'Updated successfully' });

            if (activeTab !== 'account') {
                setTimeout(() => setActiveTab('account'), 1500);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiService.post('/auth/register', newUserForm);
            setMessage({ type: 'success', text: 'User created successfully' });
            setNewUserForm({ email: '', password: '', role: 'user', name: '' });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (email) => {
        if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;
        try {
            await apiService.delete(`/auth/users/${email}`);
            fetchUsers();
            setMessage({ type: 'success', text: 'User deleted' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            await apiService.patch('/auth/settings', settings);
            setMessage({ type: 'success', text: 'Settings saved' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isAdmin = user?.role === 'admin';

    const handleLogout = () => {
        logout();
        onClose();
    };

    const renderHeaderTitle = () => {
        switch (activeTab) {
            case 'account': return 'Account Settings';
            case 'email-change': return 'Update Email';
            case 'password-change': return 'Change Password';
            case 'users': return 'Manage Team';
            case 'general': return 'System Settings';
            default: return 'Settings';
        }
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-card" onClick={e => e.stopPropagation()}>
                <aside className="settings-sidebar-custom">
                    <div className="sidebar-brand">
                        <div className="user-visual" style={{ width: '40px', height: '40px' }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </div>

                    <div className="sidebar-category">User Settings</div>
                    <button
                        className={`sidebar-nav-item ${['account', 'email-change', 'password-change'].includes(activeTab) ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <UserIcon size={18} /> Account Settings
                    </button>
                    <button className="sidebar-nav-item">
                        <CreditCard size={18} /> Subscription
                    </button>

                    {isAdmin && (
                        <>
                            <div className="sidebar-category">Team</div>
                            <button
                                className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <UsersIcon size={18} /> Manage Team
                            </button>

                            <div className="sidebar-category">App Settings</div>
                            <button
                                className={`sidebar-nav-item ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                <SettingsIcon size={18} /> General settings
                            </button>
                            <button className="sidebar-nav-item">
                                <Calendar size={18} /> Calendar accounts
                            </button>
                            <button className="sidebar-nav-item">
                                <Tag size={18} /> Labels
                            </button>
                            <button className="sidebar-nav-item">
                                <Layers size={18} /> Integrations
                            </button>
                        </>
                    )}

                    <div className="sidebar-footer">
                        <button className="sidebar-nav-item logout-trigger" onClick={handleLogout}>
                            <LogOut size={18} /> Log out
                        </button>
                    </div>
                </aside>

                <main className="settings-main">
                    <header className="settings-header">
                        <h2>{renderHeaderTitle()}</h2>
                        <button className="close-button" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </header>

                    <div className="settings-scroll-content">
                        {message.text && (
                            <div className={`settings-message-modern ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        {loading ? (
                            <div className="loading-centered" style={{ height: '300px' }}>
                                <Loader2 className="animate-spin" size={40} color="var(--primary-color)" />
                                <p>Processing...</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                {activeTab === 'account' && (
                                    <>
                                        <div className="profile-hero">
                                            <div className="large-avatar">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <button className="upload-btn">Upload photo</button>
                                        </div>

                                        <div className="info-box-wrapper">
                                            <div className="info-group-title">Name</div>
                                            <div className="field-container">
                                                <input
                                                    type="text"
                                                    className="field-input"
                                                    value={accountForm.name}
                                                    onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                                                    placeholder="Enter your name"
                                                />
                                            </div>
                                        </div>

                                        <div className="info-box-wrapper">
                                            <div className="info-group-title">Email & Password</div>
                                            <div className="info-box" style={{ marginBottom: '12px' }}>
                                                <div className="info-box-left">
                                                    <div className="info-box-icon"><Mail size={18} /></div>
                                                    <div className="info-box-data">
                                                        <span className="data-label">{user?.email}</span>
                                                        <span className="data-value">Primary email</span>
                                                    </div>
                                                </div>
                                                <span className="action-link" onClick={() => setActiveTab('email-change')}>Manage <ChevronRight size={14} /></span>
                                            </div>

                                            <div className="info-box">
                                                <div className="info-box-left">
                                                    <div className="info-box-icon"><Key size={18} /></div>
                                                    <div className="info-box-data">
                                                        <span className="data-label">Password</span>
                                                        <span className="data-value">Last changed recently</span>
                                                    </div>
                                                </div>
                                                <span className="action-link" onClick={() => setActiveTab('password-change')}>Change <ChevronRight size={14} /></span>
                                            </div>
                                        </div>

                                        <div className="save-action">
                                            <button className="btn-premium" onClick={handleUpdateAccount}>
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'email-change' && (
                                    <div className="animate-fade-in">
                                        <button className="action-link" onClick={() => setActiveTab('account')} style={{ marginBottom: '1.5rem' }}>
                                            ← Back to account
                                        </button>
                                        <div className="field-container">
                                            <label>New Email Address</label>
                                            <input
                                                type="email"
                                                className="field-input"
                                                value={emailForm.email}
                                                onChange={e => setEmailForm({ email: e.target.value })}
                                            />
                                        </div>
                                        <button className="btn-premium" style={{ width: '100%' }} onClick={handleUpdateAccount}>
                                            Save Email
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'password-change' && (
                                    <div className="animate-fade-in">
                                        <button className="action-link" onClick={() => setActiveTab('account')} style={{ marginBottom: '1.5rem' }}>
                                            ← Back to account
                                        </button>
                                        <div className="field-container">
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                className="field-input"
                                                value={accountForm.password}
                                                onChange={e => setAccountForm({ ...accountForm, password: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="field-container">
                                            <label>Confirm Password</label>
                                            <input
                                                type="password"
                                                className="field-input"
                                                value={accountForm.confirmPassword}
                                                onChange={e => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <button className="btn-premium" style={{ width: '100%' }} onClick={handleUpdateAccount}>
                                            Update Password
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'general' && isAdmin && (
                                    <>
                                        <div className="info-box-wrapper">
                                            <div className="info-group-title">Data Retention Policy</div>
                                            <div className="field-container">
                                                <p className="help-text">Define how long documents remain in storage.</p>
                                                <select
                                                    value={settings.dataRetention}
                                                    onChange={e => setSettings({ ...settings, dataRetention: e.target.value })}
                                                    className="field-input"
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    <option value="2 weeks">2 Weeks</option>
                                                    <option value="1 month">1 Month</option>
                                                    <option value="2 months">2 Months</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button onClick={handleSaveSettings} className="btn-premium" style={{ width: '100%' }}>
                                            <Save size={16} /> Update Policy
                                        </button>
                                    </>
                                )}

                                {activeTab === 'users' && isAdmin && (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div className="team-grid" style={{ flex: 1, marginBottom: '2rem' }}>
                                            {users.slice(0, 6).map(u => ( // Limiting to 6 to fit without scroll
                                                <div key={u.email} className="team-member-card">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div className="user-visual" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{u.name}</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{u.email}</span>
                                                        </div>
                                                    </div>
                                                    {u.email !== user.email && (
                                                        <button onClick={() => handleDeleteUser(u.email)} className="delete-trigger">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="info-box-wrapper" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '1.5rem' }}>
                                            <div className="info-group-title">Add Team Member</div>
                                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        className="field-input"
                                                        value={newUserForm.name}
                                                        onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                                        required
                                                    />
                                                    <input
                                                        type="email"
                                                        placeholder="Email"
                                                        className="field-input"
                                                        value={newUserForm.email}
                                                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <select
                                                        className="field-input"
                                                        value={newUserForm.role}
                                                        onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button type="submit" className="btn-premium" style={{ flex: 1 }}>Add Member</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
});

export default SettingsModal;
