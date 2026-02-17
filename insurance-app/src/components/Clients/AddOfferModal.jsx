import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { clientStore } from '../../stores/ClientStore';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../Common/Modal';
import PDFMergeZone from './PDFMergeZone';
import { ClientBuilder } from '../../utils/ClientBuilder';
import './AddOfferModal.css';

const AddOfferModal = observer(({ isOpen, onClose }) => {
    const [type, setType] = useState('CASCO'); // Default selected CASCO
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate processing uploaded docs
        setTimeout(() => {
            const newClientData = new ClientBuilder()
                .withBasicInfo({
                    name: 'Extracted Name',
                    phone: '0000000000',
                    type: type,
                    object: 'Extracted from documents'
                })
                .build();

            clientStore.addClient(newClientData);
            setIsProcessing(false);
            onClose();
        }, 1500);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
        >
            <form onSubmit={handleCreateOffer} className="modal-form">
                {isProcessing ? (
                    <div className="loading-container">
                        <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
                        <p className="loading-title">
                            Extracting data...
                        </p>
                        <p className="loading-description">
                            Working on your documents
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="form-header">
                        </div>

                        <div className="form-group form-group-spaced">
                            <label className="detail-label">Insurance Type</label>
                            <select
                                name="type"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="detail-select full-width-select"
                                required
                            >
                                <option value="Locuinta">Locuinta</option>
                                <option value="RCA">RCA</option>
                                <option value="CASCO">CASCO</option>
                                <option value="Viata">Viata</option>
                                <option value="Calatorie">Calatorie</option>
                                <option value="Sanatate">Sanatate</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div className="form-group form-group-large-margin">
                            <label className="detail-label">Source Documents</label>
                            <div className="merge-zone-wrapper">
                                <PDFMergeZone showResync={false} />
                            </div>
                        </div>

                        <div className="modal-actions-centered">
                            <button
                                type="submit"
                                className="btn-solid btn-submit-large"
                                disabled={isProcessing || !type}
                            >
                                <Save size={18} />
                                Create Offer
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
});

export default AddOfferModal;
