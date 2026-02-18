import React from 'react';
import { Trash2, UserPlus, Shield, User, Mail, ChevronRight } from 'lucide-react';

const ManageTeam = ({ users, currentUserEmail, onDeleteUser, onAddMemberClick }) => {
    return (
        <div className="animate-fade-in team-management-container">
            <header className="team-header-section-premium">
                <div className="section-title-area">
                    <h3>Team Members</h3>
                    <p className="section-subtitle">You have {users.length} members in your organization.</p>
                </div>
                <button className="btn-premium add-member-trigger" onClick={onAddMemberClick}>
                    <UserPlus size={16} /> Add Member
                </button>
            </header>

            <div className="team-members-list-modern">
                {users.map(u => (
                    <div key={u.email} className={`team-member-row-modern ${u.email === currentUserEmail ? 'is-current' : ''}`}>
                        <div className="member-main-info">
                            <div className="member-avatar-gradient">
                                {u.name.charAt(0)}
                            </div>
                            <div className="member-details">
                                <span className="member-name-bold">
                                    {u.name} {u.email === currentUserEmail && <span className="current-user-tag">You</span>}
                                </span>
                                <span className="member-email-sub"><Mail size={12} /> {u.email}</span>
                            </div>
                        </div>

                        <div className="member-right-section">
                            <div className={`role-chip ${u.role}`}>
                                {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                {u.role}
                            </div>

                            <div className="member-actions-group">
                                {u.email !== currentUserEmail && (
                                    <button
                                        onClick={() => onDeleteUser(u.email)}
                                        className="action-btn-danger"
                                        title="Remove member"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageTeam;
