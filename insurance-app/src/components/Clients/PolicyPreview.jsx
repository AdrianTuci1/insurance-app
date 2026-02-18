import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PolicyPreview.css';
import { observer } from 'mobx-react-lite';
import { Save, X, Loader2 } from 'lucide-react';
import { uiStore, clientStore } from '../../stores/RootStore';
import { apiService } from '../../services/api.service';

const PolicyPreview = observer(({ clientData: propsClientData, onClose: propsOnClose }) => {
    const { id: urlId } = useParams();
    const navigate = useNavigate();

    const [clientData, setLocalClientData] = React.useState(propsClientData || null);
    const [htmlContent, setHtmlContent] = React.useState(propsClientData?.html || null);
    const [extractedData, setExtractedData] = React.useState(propsClientData?.extractedData || null);
    const [jobId, setJobId] = React.useState(propsClientData?.jobId || propsClientData?.id || urlId || null);

    const [loading, setLoading] = React.useState(!propsClientData);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);

    const previewRef = React.useRef(null);

    // Fetch data if not provided via props (standard page navigation)
    React.useEffect(() => {
        const fetchData = async () => {
            if (!propsClientData && urlId) {
                setLoading(true);
                try {
                    const data = await clientStore.getClient(urlId);
                    setLocalClientData(data);
                    setHtmlContent(data.html);
                    setExtractedData(data.extractedData);
                    setJobId(data.jobId || data.id);
                } catch (err) {
                    console.error('Error fetching policy for preview:', err);
                    setError('Failed to load policy data');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [propsClientData, urlId]);

    // Handle close (navigate back to client detail)
    const handleClose = React.useCallback(() => {
        if (propsOnClose) {
            propsOnClose();
        } else if (urlId) {
            navigate(`/client/${urlId}`);
        } else {
            navigate('/');
        }
    }, [propsOnClose, navigate, urlId]);

    const handleSave = React.useCallback(async () => {
        if (!previewRef.current || !jobId) return;

        setSaving(true);
        setError(null);

        // Scrape the DOM for changes
        const updatedData = extractedData ? JSON.parse(JSON.stringify(extractedData)) : {};
        const editableElements = previewRef.current.querySelectorAll('[data-field]');

        editableElements.forEach(el => {
            const fieldPath = el.getAttribute('data-field');
            const value = el.innerText.trim();

            const parts = fieldPath.split('.');
            let current = updatedData;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            if (!current) return;

            const lastKey = parts[parts.length - 1];
            const idx = parseInt(lastKey, 10);
            if (idx !== -1 && !isNaN(idx)) {
                if (!current[lastKey]) current[lastKey] = [];
                current[lastKey][idx] = value;
            } else {
                current[lastKey] = value;
            }
        });

        try {
            const result = await apiService.put(`/policies/${jobId}`, { extractedData: updatedData });
            setHtmlContent(result.html);
            setExtractedData(result.extractedData);
            // Optionally navigate back on success or just show success state
            handleClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }, [jobId, extractedData, handleClose]);

    const HeaderActions = React.useCallback(() => (
        <>
            <button
                className="btn-header btn-header-ghost icon-only"
                onClick={handleClose}
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
    ), [saving, handleSave, handleClose]);

    React.useEffect(() => {
        uiStore.setHeaderActions(HeaderActions);
        return () => {
            uiStore.clearHeaderActions();
        };
    }, [HeaderActions]);

    if (loading) {
        return (
            <div className="policy-preview-container loading-centered">
                <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
                <p>Se încarcă previzualizarea...</p>
            </div>
        );
    }

    return (
        <div className="policy-preview-container">
            <div className="policy-preview-page-container">
                {error && (
                    <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {!htmlContent && !error && (
                    <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        <p>No policy data available to preview.</p>
                    </div>
                )}

                {htmlContent && (
                    <div
                        className="generated-policy-content"
                        ref={previewRef}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                )}
            </div>
        </div>
    );
});

export default PolicyPreview;
