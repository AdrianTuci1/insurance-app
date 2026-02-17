import React from 'react';
import { createPortal } from 'react-dom';
import './PolicyPreview.css';
import { observer } from 'mobx-react-lite';
import { Save, X } from 'lucide-react';
import { apiService } from '../../services/api.service';

const PolicyPreview = observer(({ clientData, onClose }) => {
    const today = new Date().toLocaleDateString('ro-RO');


    const [htmlContent, setHtmlContent] = React.useState(clientData?.html || null);
    const [extractedData, setExtractedData] = React.useState(clientData?.extractedData || null);
    const [jobId, setJobId] = React.useState(clientData?.jobId || clientData?.id || null);

    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [progress, setProgress] = React.useState(''); // To show status
    const [error, setError] = React.useState(null);

    const previewRef = React.useRef(null);

    // Derived state or effect to update when props change
    React.useEffect(() => {
        if (clientData) {
            if (clientData.html) setHtmlContent(clientData.html);
            if (clientData.extractedData) setExtractedData(clientData.extractedData);
            if (clientData.jobId || clientData.id) setJobId(clientData.jobId || clientData.id);
        }
    }, [clientData]);

    // Removed internal auth token logic as this component is now purely presentation/edit
    // Removed connectToSSE and handleFileUpload as they are handled by parent/AddOfferModal

    const handleSave = async () => {
        if (!previewRef.current || !jobId) return;

        setSaving(true);
        setError(null);

        // 1. Scrape the DOM for changes
        const updatedData = extractedData ? JSON.parse(JSON.stringify(extractedData)) : {};
        // Deep copy safely

        const editableElements = previewRef.current.querySelectorAll('[data-field]');

        editableElements.forEach(el => {
            const fieldPath = el.getAttribute('data-field');
            const value = el.innerText.trim();

            // Basic path setter (handles clientData.name or offersWithoutFranchise.0.company)
            const parts = fieldPath.split('.');
            let current = updatedData;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            if (!current) return; // Guard

            // Check if array index
            const lastKey = parts[parts.length - 1];
            const idx = parseInt(lastKey, 10);
            if (idx !== -1 && !isNaN(idx)) {
                if (!current[lastKey]) current[lastKey] = []; // Ensure array exists if null
                current[lastKey][idx] = value;
            } else {
                current[lastKey] = value;
            }
        });

        try {
            const result = await apiService.put(`/policies/${jobId}`, { extractedData: updatedData });

            setHtmlContent(result.html);
            setExtractedData(result.extractedData);
            if (onClose) onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Portal Target
    const portalTarget = document.getElementById('header-actions-portal');

    const headerActions = (
        <>
            <button
                className="btn-header btn-header-ghost icon-only"
                onClick={() => onClose && onClose()}
                disabled={saving}
                title="Închide previzualizarea"
            >
                <X size={20} />
            </button>
            <button
                className="btn-header btn-header-primary icon-only"
                onClick={handleSave}
                disabled={saving}
                title={saving ? 'Se salvează...' : 'Salvează Modificările'}
            >
                {saving ? (
                    <span className="animate-spin">⏳</span>
                ) : (
                    <Save size={20} />
                )}
            </button>
        </>
    );

    return (
        <div className="policy-preview-container">
            <div className="policy-preview-page-container">
                {!htmlContent && (
                    <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        <p>No policy data available to preview.</p>
                    </div>
                )}

                {htmlContent && (
                    <>
                        <div
                            className="generated-policy-content"
                            ref={previewRef}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    </>
                )}
            </div>
            {/* Portal Action Buttons */}
            {portalTarget && createPortal(headerActions, portalTarget)}
        </div>
    );
});

export default PolicyPreview;
