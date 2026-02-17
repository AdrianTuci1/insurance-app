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
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const data = await clientStore.getClient(id);
                // Initialize default selection state
                setFormData({
                    ...data,
                    selectedFranchise: data.selectedFranchise ?? false,
                    selectedOfferIndex: data.selectedOfferIndex ?? 0,
                    selectedRate: data.selectedRate ?? 'rate1'
                });
            } catch (err) {
                console.error(err);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    const handleFranchiseToggle = (hasFranchise) => {
        const offers = hasFranchise ? formData.groupedOffers.withFranchise : formData.groupedOffers.withoutFranchise;
        const newOfferIdx = 0; // Reset to first available offer in group
        const rate = 'rate1';
        const newAmount = offers[newOfferIdx]?.[rate] || '0 €';

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
        const newAmount = offers[idx]?.[rate] || '0 €';

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
            const numericValue = value.replace(/[^\d.]/g, '');
            newValue = numericValue ? `${numericValue} €` : '';
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

    if (loading) {
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
