import React from 'react';
import { UserPlus, ChevronLeft } from 'lucide-react';

const AddMember = ({ newUserForm, setNewUserForm, onCreateUser, onBack }) => {
    return (
        <div className="animate-fade-in add-member-view">
            <button className="action-link back-button" onClick={onBack}>
                <ChevronLeft size={16} /> Back to team
            </button>

            <div className="view-header">
                <h3>Add New Team Member</h3>
                <p>Grant access to a new person by inviting them to your team.</p>
            </div>

            <form onSubmit={onCreateUser} className="premium-form-container">
                <div className="field-container">
                    <label>Full Name</label>
                    <input
                        type="text"
                        placeholder="e.g. John Doe"
                        className="field-input"
                        value={newUserForm.name}
                        onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                        required
                    />
                </div>

                <div className="field-container">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="e.g. john@example.com"
                        className="field-input"
                        value={newUserForm.email}
                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        required
                    />
                </div>

                <div className="field-container">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="field-input"
                        value={newUserForm.password}
                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        required
                    />
                </div>

                <div className="field-container">
                    <label>Access Role</label>
                    <select
                        className="field-input"
                        value={newUserForm.role}
                        onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    >
                        <option value="user">Standard User - Read & Edit access</option>
                        <option value="admin">Administrator - Full system access</option>
                    </select>
                </div>

                <div className="form-actions-footer">
                    <button type="submit" className="btn-premium btn-full">
                        <UserPlus size={18} /> Send Invitation
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMember;
