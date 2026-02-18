import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import { apiService } from '../../services/api.service';
import { Loader2, X } from 'lucide-react';

// Subcomponents
import Sidebar from './subcomponents/Sidebar';
import AccountSettings from './subcomponents/AccountSettings';
import EmailChange from './subcomponents/EmailChange';
import PasswordChange from './subcomponents/PasswordChange';
import GeneralSettings from './subcomponents/GeneralSettings';
import ManageTeam from './subcomponents/ManageTeam';
import AddMember from './subcomponents/AddMember';

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
            case 'add-member': return 'Invite Team Member';
            case 'general': return 'System Settings';
            default: return 'Settings';
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-centered" style={{ height: '300px' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary-color)" />
                    <p>Processing...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'account':
                return (
                    <AccountSettings
                        user={user}
                        name={accountForm.name}
                        setName={(name) => setAccountForm({ ...accountForm, name })}
                        onEmailManage={() => setActiveTab('email-change')}
                        onPasswordChange={() => setActiveTab('password-change')}
                        onSave={handleUpdateAccount}
                    />
                );
            case 'email-change':
                return (
                    <EmailChange
                        email={emailForm.email}
                        setEmail={(email) => setEmailForm({ email })}
                        onBack={() => setActiveTab('account')}
                        onSave={handleUpdateAccount}
                    />
                );
            case 'password-change':
                return (
                    <PasswordChange
                        password={accountForm.password}
                        setPassword={(password) => setAccountForm({ ...accountForm, password })}
                        confirmPassword={accountForm.confirmPassword}
                        setConfirmPassword={(confirmPassword) => setAccountForm({ ...accountForm, confirmPassword })}
                        onBack={() => setActiveTab('account')}
                        onSave={handleUpdateAccount}
                    />
                );
            case 'general':
                return isAdmin ? (
                    <GeneralSettings
                        dataRetention={settings.dataRetention}
                        setDataRetention={(dataRetention) => setSettings({ ...settings, dataRetention })}
                        onSave={handleSaveSettings}
                    />
                ) : null;
            case 'users':
                return isAdmin ? (
                    <ManageTeam
                        users={users}
                        currentUserEmail={user.email}
                        onDeleteUser={handleDeleteUser}
                        onAddMemberClick={() => setActiveTab('add-member')}
                    />
                ) : null;
            case 'add-member':
                return isAdmin ? (
                    <AddMember
                        newUserForm={newUserForm}
                        setNewUserForm={setNewUserForm}
                        onCreateUser={handleCreateUser}
                        onBack={() => setActiveTab('users')}
                    />
                ) : null;
            default:
                return null;
        }
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-card" onClick={e => e.stopPropagation()}>
                <Sidebar
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={handleLogout}
                    isAdmin={isAdmin}
                />

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
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
});

export default SettingsModal;
