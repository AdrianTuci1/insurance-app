import React from 'react';
import './PolicyPreview.css';
import { apiService } from '../../services/api.service';
import { API_CONFIG } from '../../config/api.config';

const PolicyPreview = ({ clientData }) => {
    const today = new Date().toLocaleDateString('ro-RO');

    const [htmlContent, setHtmlContent] = React.useState(null);
    const [extractedData, setExtractedData] = React.useState(null);
    const [jobId, setJobId] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [progress, setProgress] = React.useState(''); // To show status
    const [error, setError] = React.useState(null);

    const previewRef = React.useRef(null);

    const [token, setToken] = React.useState(localStorage.getItem('token')); // Simple auth state

    const connectToSSE = (jobId) => {
        const eventSource = new EventSource(`${API_CONFIG.BASE_URL}/policies/events/${jobId}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.status === 'in progress') {
                setProgress(data.message || data.progress || 'In Progress...');
            } else if (data.status === 'complete') {
                setHtmlContent(data.html);
                setExtractedData(data.extractedData);
                setLoading(false);
                setProgress('');
                eventSource.close();
            } else if (data.status === 'failed') {
                setError(data.error || 'Job failed');
                setLoading(false);
                eventSource.close();
            }
        };

        eventSource.onerror = () => {
            console.error("SSE Error");
            eventSource.close();
            setError("Connection lost. Please try again.");
            setLoading(false);
        };
    };

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        if (!token) {
            // Mock login for demo purposes if no token
            const mockToken = prompt("Enter JWT Token (or just click OK to try anonymous/mock):");
            if (mockToken) setToken(mockToken);
            else {
                alert("Authentication required. Please login.");
                return;
            }
        }

        setLoading(true);
        setError(null);
        setHtmlContent(null);
        setProgress('Starting upload...');

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('documents', files[i]);
        }
        formData.append('type', 'casco');

        // Use current token or the one just set
        const currentToken = token || localStorage.getItem('token');

        try {
            const data = await apiService.post('/policies/process', formData);

            if (data.jobId) {
                setJobId(data.jobId);
                setProgress('Job started. Connecting to stream...');
                connectToSSE(data.jobId);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!previewRef.current || !jobId) return;

        setSaving(true);
        setError(null);

        // 1. Scrape the DOM for changes
        const updatedData = { ...extractedData };
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
            current[parts[parts.length - 1]] = value;
        });

        try {
            const result = await apiService.put(`/policies/${jobId}`, { extractedData: updatedData });

            setHtmlContent(result.html);
            setExtractedData(result.extractedData);
            alert("Modificările au fost salvate cu succes!");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="policy-preview-container">
            <div className="policy-preview-page-container">
                {!htmlContent && (
                    <div className="upload-section">
                        <h3>Generează Ofertă CASCO</h3>
                        <p>Încarcă documentele (PDF/DOCX) pentru a extrage datele și a genera oferta.</p>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            accept=".pdf,.docx"
                            disabled={loading}
                        />
                        {loading && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <div className="spinner" style={{ marginBottom: '0.5rem' }}>⏳</div>
                                <p style={{ fontWeight: 'bold' }}>{progress}</p>
                            </div>
                        )}
                        {error && <p className="error-text" style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                    </div>
                )}

                {htmlContent && (
                    <>
                        <div className="preview-actions">
                            <button
                                className="save-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Se salvează...' : 'Salvează Modificările'}
                            </button>
                            <p className="edit-hint">💡 Poți modifica textul direct pe ofertă înainte de a salva.</p>
                        </div>
                        <div
                            className="generated-policy-content"
                            ref={previewRef}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default PolicyPreview;
