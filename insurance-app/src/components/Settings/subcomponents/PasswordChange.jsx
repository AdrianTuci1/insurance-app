import React from 'react';

const PasswordChange = ({ password, setPassword, confirmPassword, setConfirmPassword, onBack, onSave }) => {
    return (
        <div className="animate-fade-in">
            <button className="action-link" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
                ← Back to account
            </button>
            <div className="field-container">
                <label>New Password</label>
                <input
                    type="password"
                    className="field-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                />
            </div>
            <div className="field-container">
                <label>Confirm Password</label>
                <input
                    type="password"
                    className="field-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                />
            </div>
            <button className="btn-premium" style={{ width: '100%' }} onClick={onSave}>
                Update Password
            </button>
        </div>
    );
};

export default PasswordChange;
