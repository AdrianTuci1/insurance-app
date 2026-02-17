import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { clientStore } from '../../stores/ClientStore';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../Common/Modal';
import PDFMergeZone from './PDFMergeZone';
import { ClientBuilder } from '../../utils/ClientBuilder';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api.service';
import './AddOfferModal.css';

const AddOfferModal = observer(({ isOpen, onClose }) => {
    const [type, setType] = useState('CASCO'); // Default selected CASCO
    const [files, setFiles] = useState([]); // New file state
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const handleCreateOffer = async (e) => {
        e.preventDefault();

        if (files.length === 0) {
            alert("Please select at least one document.");
            return;
        }

        setIsProcessing(true);

        try {
            const formData = new FormData();
            // Append files
            files.forEach(file => {
                formData.append('documents', file);
            });
            // Append type
            formData.append('type', type);

            // Call API
            const response = await apiService.post('/policies/process', formData);

            if (response && response.jobId) {
                // Success! Redirect to client page
                // We don't need to wait for processing here.
                onClose();
                navigate(`/client/${response.jobId}`);
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload documents: " + error.message);
        } finally {
            setIsProcessing(false);
        }
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
                            Uploading documents...
                        </p>
                        <p className="loading-description">
                            Starting extraction process
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
                                <PDFMergeZone
                                    showResync={false}
                                    files={files}
                                    onFilesChange={setFiles}
                                />
                            </div>
                        </div>

                        <div className="modal-actions-centered">
                            <button
                                type="submit"
                                className="btn-solid btn-submit-large"
                                disabled={isProcessing || !type || files.length === 0}
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
