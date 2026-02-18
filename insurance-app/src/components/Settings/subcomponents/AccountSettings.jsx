import React from 'react';
import { Mail, Key, ChevronRight, Save } from 'lucide-react';

const AccountSettings = ({ user, name, setName, onEmailManage, onPasswordChange, onSave }) => {
    return (
        <div className="animate-fade-in">
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
                        value={name}
                        onChange={e => setName(e.target.value)}
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
                    <span className="action-link" onClick={onEmailManage}>Manage <ChevronRight size={14} /></span>
                </div>

                <div className="info-box">
                    <div className="info-box-left">
                        <div className="info-box-icon"><Key size={18} /></div>
                        <div className="info-box-data">
                            <span className="data-label">Password</span>
                            <span className="data-value">Last changed recently</span>
                        </div>
                    </div>
                    <span className="action-link" onClick={onPasswordChange}>Change <ChevronRight size={14} /></span>
                </div>
            </div>

            <div className="save-action">
                <button className="btn-premium" onClick={onSave}>
                    <Save size={16} /> Save Changes
                </button>
            </div>
        </div>
    );
};

export default AccountSettings;
