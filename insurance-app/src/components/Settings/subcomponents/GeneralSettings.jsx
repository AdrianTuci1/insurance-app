import React from 'react';
import { Save } from 'lucide-react';

const GeneralSettings = ({ dataRetention, setDataRetention, onSave }) => {
    return (
        <div className="animate-fade-in">
            <div className="info-box-wrapper">
                <div className="info-group-title">Data Retention Policy</div>
                <div className="field-container">
                    <p className="help-text">Define how long documents remain in storage.</p>
                    <select
                        value={dataRetention}
                        onChange={e => setDataRetention(e.target.value)}
                        className="field-input"
                        style={{ marginTop: '0.5rem' }}
                    >
                        <option value="2 weeks">2 Weeks</option>
                        <option value="1 month">1 Month</option>
                        <option value="2 months">2 Months</option>
                    </select>
                </div>
            </div>
            <button onClick={onSave} className="btn-premium" style={{ width: '100%' }}>
                <Save size={16} /> Update Policy
            </button>
        </div>
    );
};

export default GeneralSettings;
