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

const ClientDetail = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // We need local state for editing
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        let pollInterval;

        const fetchDetails = async () => {
            try {
                // If we are already loading effectively (first load), set loading
                if (!formData) setLoading(true); // Only show full loader on first load

                const data = await clientStore.getClient(id);

                // Initialize default selection state
                setFormData({
                    ...data,
                    selectedFranchise: data.selectedFranchise ?? false,
                    selectedOfferIndex: data.selectedOfferIndex ?? -1,
                    selectedRate: data.selectedRate ?? 'rate1',
                    amount: (data.amount === 'Pending...' || !data.amount) ? 'Not set' : data.amount
                });

                // Check status for polling
                // Note: ApiStrategy maps 'in progress' to 'In Progress'
                if (data.status === 'In Progress' || data.status === 'not started') {
                    if (!pollInterval) {
                        pollInterval = setInterval(fetchDetails, 3000); // Poll every 3s
                    }
                } else {
                    if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                    }
                }

            } catch (err) {
                console.error(err);
                setError('Failed to load job details');
                if (pollInterval) clearInterval(pollInterval);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [id]); // Check dependency: if formData changes, we don't want to re-run effect, so keep it just [id]
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
        clientStore.updateClient(formData.id, updatedData);
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

    // Show processing state if status is 'In Progress' or 'not started'
    // Note: The helper might convert 'not started' to something else, checking raw props if available or just the string
    const isProcessing = formData.status === 'In Progress' || formData.status === 'not started' || formData.status === 'initializing';

    if (isProcessing) {
        return (
            <div className="client-detail-full-layout loading-centered">
                <Loader2 className="animate-spin" size={64} color="var(--primary-color)" />
                <h2 style={{ marginTop: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Processing Document...</h2>
                <p className="loading-text" style={{ maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
                    We are extracting data from your uploaded files. <br />
                    This usually takes 10-20 seconds.
                </p>
                <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#f5f5f5', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
                    Status: {formData.status}
                </div>
            </div>
        );
    }

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
                />
            </div>

            {/* COLUMN 2: Final Policy & Actions */}
            <div className="detail-column right-column">

                {/* Section 1: Final Policy & Docs */}
                <PolicySection
                    formData={formData}
                    onManageDocuments={() => setIsUploadModalOpen(true)}
                    onPreview={() => setIsPreviewModalOpen(true)}
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

            <Modal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Policy Offer Preview"
                isFullScreen={true}
            >
                <PolicyPreview clientData={formData} />
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
