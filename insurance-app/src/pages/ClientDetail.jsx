import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { clientStore } from '../stores/ClientStore';
import { Loader2, AlertTriangle } from 'lucide-react';
import PDFMergeZone from '../components/Clients/PDFMergeZone';
import PaymentLinkGenerator from '../components/Clients/PaymentLinkGenerator';
import Modal from '../components/Common/Modal';
import PolicyPreview from '../components/Clients/PolicyPreview';
import ClientForm from '../components/Clients/ClientForm';
import PolicySection from '../components/Clients/PolicySection';
import './ClientDetail.css';

import { API_CONFIG } from '../config/api.config';

const ClientDetail = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // We need local state for editing
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        let eventSource;

        const connectSSE = () => {
            if (!id) return;

            const url = `${API_CONFIG.BASE_URL}/policies/events/${id}`;
            console.log('Connecting to SSE:', url);

            eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.status === 'complete' || data.status === 'Complete') {
                        // Reload data smoothly via store to get processed/normalized version
                        // Even if data.extractedData is not in the event, we fetch it fresh from API
                        clientStore.getClient(id).then(client => {
                            setFormData(prev => ({
                                ...client,
                                // Preserve selection state if possible, or reset to best guess from fresh data
                                selectedFranchise: client.selectedFranchise ?? prev?.selectedFranchise ?? false,
                                selectedOfferIndex: client.selectedOfferIndex ?? prev?.selectedOfferIndex ?? -1,
                                selectedRate: client.selectedRate ?? prev?.selectedRate ?? 'rate1',
                                amount: (client.amount && client.amount !== 'Pending...') ? client.amount : (prev?.amount || 'Not set')
                            }));
                            setLoading(false);
                        });
                    } else if (data.status === 'failed') {
                        setError(data.error || 'Processing failed');
                        setLoading(false);
                    } else {
                        // Update status/progress for "in progress"
                        setFormData(prev => prev ? ({ ...prev, status: data.status }) : null);
                    }
                } catch (e) {
                    console.error('SSE Error parsing:', e);
                }
            };

            eventSource.onerror = (err) => {
                console.error('SSE Error:', err);
                eventSource.close();
                // Optional: Retry logic could go here
            };
        };

        const fetchInitialData = async () => {
            try {
                if (!formData) setLoading(true);
                const data = await clientStore.getClient(id);
                setFormData({
                    ...data,
                    selectedFranchise: data.selectedFranchise ?? false,
                    selectedOfferIndex: data.selectedOfferIndex ?? -1,
                    selectedRate: data.selectedRate ?? 'rate1',
                    amount: (data.amount === 'Pending...' || !data.amount) ? 'Not set' : data.amount
                });

                // If job is processing, connect to SSE
                if (data.status === 'In Progress' || data.status === 'not started' || data.status === 'initializing') {
                    connectSSE();
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInitialData();
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [id]);
    // But we need to reference pollInterval.
    // Actually, `fetchDetails` closure usually captures stale state, but here we call clientStore.getClient(id) so it fetches fresh data.
    // The logic `if (data.status ...)` uses the fresh `data`.
    // The `pollInterval` variable is local to the effect. Redefining it on every render is bad if effect re-runs.
    // But effect only runs on [id].
    // Wait, if I call `setFormData`, it re-renders. But effect doesn't re-run.
    // So `fetchDetails` inside the effect is defined once.
    // But it calls `setFormData`.
    // The recursion "setInterval(fetchDetails)" works because `fetchDetails` is stable in the closure?
    // references `id`. `id` is stable.

    // One catch: `formData` check?
    // `if (!formData) setLoading(true)` -> `formData` is from outer scope closure.
    // This `formData` will be the initial value (null) forever in the closure!
    // So on subsequent polls, `!formData` is true? No, wait.
    // `formData` is a const from `useState`. It holds the value from the *render where the effect was created*.
    // If [id] doesn't change, effect doesn't re-run. So `formData` is always null inside `fetchDetails`.
    // So `setLoading(true)` might happen every time?
    // Actually `setLoading(true)` is fine if we use a different check or just remove that check after first run?
    // I will refactor to use a ref or just simpler logic.

    const handleFranchiseToggle = (hasFranchise) => {
        const offers = hasFranchise ? formData.groupedOffers.withFranchise : formData.groupedOffers.withoutFranchise;

        // If we currently have "Not set" selected, keep it
        if (formData.selectedOfferIndex === -1) {
            const updated = {
                ...formData,
                selectedFranchise: hasFranchise
            };
            setFormData(updated);
            clientStore.updateClient(id, updated);
            return;
        }

        const newOfferIdx = 0; // Reset to first available offer in group
        const rate = 'rate1';
        const newAmount = offers[newOfferIdx]?.[rate] || 'Not set';

        const updated = {
            ...formData,
            selectedFranchise: hasFranchise,
            selectedOfferIndex: newOfferIdx,
            selectedRate: rate,
            amount: newAmount
        };
        setFormData(updated);
        clientStore.updateClient(id, updated);
    };

    const handleOfferSelect = (idx) => {
        const offers = formData.selectedFranchise ? formData.groupedOffers.withFranchise : formData.groupedOffers.withoutFranchise;
        const rate = formData.selectedRate || 'rate1';

        let newAmount = 'Not set';
        if (idx !== -1) {
            newAmount = offers[idx]?.[rate] || 'Not set';
        }

        const updated = {
            ...formData,
            selectedOfferIndex: idx,
            amount: newAmount
        };
        setFormData(updated);
        clientStore.updateClient(id, updated);
    };

    const handleRateSelect = (rate, amount, idx) => {
        const updated = {
            ...formData,
            selectedRate: rate,
            amount: amount,
            selectedOfferIndex: idx
        };
        setFormData(updated);
        clientStore.updateClient(id, updated);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        // Auto-handle Euro symbol for amount field
        if (name === 'amount') {
            if (value === 'Not set' || value === '') {
                newValue = value;
            } else {
                const numericValue = value.replace(/[^\d.]/g, '');
                newValue = numericValue ? `${numericValue} €` : '';
            }
        }

        const updatedData = { ...formData, [name]: newValue };
        setFormData(updatedData);

        // Construct the payload structure expected by the backend
        // IMPORTANT: We must NOT overwrite the entire extractedData with partial information
        // We should merge our changes into the original extractedData structure
        const currentExtractedData = formData.originalData?.extractedData || {};

        const payload = {
            extractedData: {
                ...currentExtractedData,
                clientData: {
                    ...(currentExtractedData.clientData || {}),
                    name: name === 'name' ? newValue : updatedData.name,
                    phone: name === 'phone' ? newValue : updatedData.phone,
                    vin: name === 'vin' ? newValue : updatedData.vin,
                    object: name === 'object' ? newValue : updatedData.object,
                }
            },
            policyType: name === 'type' ? newValue : updatedData.type,
            amount: name === 'amount' ? newValue : updatedData.amount
        };

        clientStore.updateClient(id, payload);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await clientStore.deleteClient(id);
            setIsDeleteModalOpen(false);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Failed to delete job');
        } finally {
            setIsDeleting(false);
        }
    };

    const insuranceTypes = ['Locuinta', 'RCA', 'CASCO', 'Viata', 'Calatorie', 'Sanatate', 'General'];

    if (loading && !formData) { // Only show full loader if we have NO data yet
        return (
            <div className="client-detail-full-layout loading-centered">
                <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
                <p className="loading-text">Loading job details...</p>
            </div>
        );
    }

    if (error || !formData) {
        return <div className="error-state">{error || 'Job not found'}</div>;
    }

    // Simplified processing indicator instead of full page overlay
    const isProcessing = formData.status === 'In Progress' || formData.status === 'not started' || formData.status === 'initializing' || formData.status === 'processing';

    // Removed inline PolicyPreview rendering as it is now a separate route

    return (
        <div className="client-detail-full-layout animate-fade-in">
            {/* COLUMN 1: Editable Job Data */}
            <div className="detail-column left-column">
                <ClientForm
                    formData={formData}
                    onChange={handleChange}
                    onFranchiseToggle={handleFranchiseToggle}
                    onOfferSelect={handleOfferSelect}
                    onRateSelect={handleRateSelect}
                    onDeleteClick={() => setIsDeleteModalOpen(true)}
                    insuranceTypes={insuranceTypes}
                    isProcessing={isProcessing}
                />
            </div>

            {/* COLUMN 2: Final Policy & Actions */}
            <div className="detail-column right-column">

                {/* Section 1: Final Policy & Docs */}
                <PolicySection
                    formData={formData}
                    onManageDocuments={() => setIsUploadModalOpen(true)}
                    onPreview={() => navigate(`/client/${id}/preview`)}
                />

                {/* Horizontal Separator */}
                <div className="horizontal-separator"></div>

                {/* Section 2: Payments */}
                <div className="column-section payment-section">
                    <PaymentLinkGenerator clientName={formData.name} status={formData.status} />
                </div>

            </div>

            {/* Modals */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Manage Documents"
            >
                <div style={{ padding: '1rem' }}>
                    <PDFMergeZone
                        initialDocuments={formData.documents || []}
                        onUpdate={(newDocs) => setFormData(prev => ({ ...prev, documents: newDocs }))}
                    />
                </div>
            </Modal>


            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            >
                <div className="delete-confirm-modal">
                    <div className="confirm-icon-wrapper">
                        <AlertTriangle size={32} />
                    </div>
                    <h3>Are you sure?</h3>
                    <p>This action will permanently delete the job for <strong>{formData.name}</strong>. This cannot be undone.</p>

                    <div className="confirm-actions">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="btn-secondary"
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn-danger"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'Delete Permanently'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
});

export default ClientDetail;
