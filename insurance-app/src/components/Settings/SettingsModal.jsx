import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '../Common/Modal';
import { authStore } from '../../stores/AuthStore';
import { apiService } from '../../services/api.service';
import { UserPlus, Trash2, Key, Settings as SettingsIcon, Users as UsersIcon, User as UserIcon, Save } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = observer(({ isOpen, onClose }) => {
    const { user } = authStore;
    const [activeTab, setActiveTab] = useState('account');
    const [settings, setSettings] = useState({ dataRetention: '1 month' });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Forms state
    const [accountForm, setAccountForm] = useState({ name: user?.name || '', password: '', confirmPassword: '' });
    const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'user', name: '' });

    useEffect(() => {
        if (isOpen && user?.role === 'admin') {
            fetchSettings();
            fetchUsers();
        }
        if (isOpen) {
            setAccountForm({ name: user?.name || '', password: '', confirmPassword: '' });
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
        e.preventDefault();
        if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match' });
        }

        setLoading(true);
        try {
            const updateBody = { name: accountForm.name };
            if (accountForm.password) updateBody.password = accountForm.password;
            await apiService.patch(`/auth/users/${user.email}`, updateBody);
            setMessage({ type: 'success', text: 'Account updated successfully' });
            // Update MobX store to reflect changes locally if needed
            // For now, we assume the user object in store is the source of truth
            // Ideally we'd have an action in AuthStore to updateProfile
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

    const isAdmin = user?.role === 'admin';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="App Settings">
            <div className="settings-container-modern">
                <aside className="settings-sidebar-modern">
                    <button
                        className={`sidebar-item-modern ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <UserIcon size={18} /> <span>Account</span>
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                className={`sidebar-item-modern ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                <SettingsIcon size={18} /> <span>General</span>
                            </button>
                            <button
                                className={`sidebar-item-modern ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <UsersIcon size={18} /> <span>Users</span>
                            </button>
                        </>
                    )}
                </aside>

                <main className="settings-content-modern">
                    {message.text && (
                        <div className={`settings-message-modern ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-centered">
                            <Loader2 className="animate-spin" size={32} color="var(--primary-color)" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'account' && (
                                <section className="animate-fade-in">
                                    <h3 className="section-title-modern">Personal Profile</h3>
                                    <form onSubmit={handleUpdateAccount}>
                                        <div className="form-group-modern">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                value={accountForm.name}
                                                onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                                                className="detail-input"
                                            />
                                        </div>
                                        <div className="form-group-modern">
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                value={accountForm.password}
                                                onChange={e => setAccountForm({ ...accountForm, password: e.target.value })}
                                                placeholder="••••••••"
                                                className="detail-input"
                                            />
                                        </div>
                                        <div className="form-group-modern" style={{ marginBottom: '1.5rem' }}>
                                            <label>Confirm Password</label>
                                            <input
                                                type="password"
                                                value={accountForm.confirmPassword}
                                                onChange={e => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                                                placeholder="••••••••"
                                                className="detail-input"
                                            />
                                        </div>
                                        <button type="submit" className="btn-solid" style={{ width: '100%' }}>
                                            <Save size={16} /> Save Changes
                                        </button>
                                    </form>
                                </section>
                            )}

                            {activeTab === 'general' && isAdmin && (
                                <section className="animate-fade-in">
                                    <h3 className="section-title-modern">System Defaults</h3>
                                    <div className="form-group-modern" style={{ marginBottom: '2rem' }}>
                                        <label>Data Retention Policy</label>
                                        <p className="help-text">Define how long documents remain in storage.</p>
                                        <select
                                            value={settings.dataRetention}
                                            onChange={e => setSettings({ ...settings, dataRetention: e.target.value })}
                                            className="detail-select"
                                            style={{ width: '100%', marginTop: '0.5rem' }}
                                        >
                                            <option value="2 weeks">2 Weeks</option>
                                            <option value="1 month">1 Month</option>
                                            <option value="2 months">2 Months</option>
                                        </select>
                                    </div>
                                    <button onClick={handleSaveSettings} className="btn-solid" style={{ width: '100%' }}>
                                        <Save size={16} /> Update Policy
                                    </button>
                                </section>
                            )}

                            {activeTab === 'users' && isAdmin && (
                                <section className="animate-fade-in">
                                    <h3 className="section-title-modern">User Management</h3>

                                    <div className="users-list-modern">
                                        {users.map(u => (
                                            <div key={u.email} className="user-card-mini">
                                                <div className="user-visual">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div className="user-details">
                                                    <span className="user-main">{u.name}</span>
                                                    <span className="user-mail">{u.email}</span>
                                                </div>
                                                {u.email !== user.email && (
                                                    <button onClick={() => handleDeleteUser(u.email)} className="delete-trigger">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="add-user-trigger" style={{ marginTop: '2rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Add Team Member</h4>
                                        <form onSubmit={handleCreateUser} className="mini-form">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={newUserForm.name}
                                                onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                                required
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={newUserForm.email}
                                                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                                required
                                            />
                                            <select
                                                value={newUserForm.role}
                                                onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button type="submit" className="btn-solid-mini">Add</button>
                                        </form>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </main>
            </div>
        </Modal>
    );
});

export default SettingsModal;
