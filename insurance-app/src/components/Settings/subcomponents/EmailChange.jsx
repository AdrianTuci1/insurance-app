import React from 'react';

const EmailChange = ({ email, setEmail, onBack, onSave }) => {
    return (
        <div className="animate-fade-in">
            <button className="action-link" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
                ← Back to account
            </button>
            <div className="field-container">
                <label>New Email Address</label>
                <input
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>
            <button className="btn-premium" style={{ width: '100%' }} onClick={onSave}>
                Save Email
            </button>
        </div>
    );
};

export default EmailChange;
