import React from 'react';
import { FileText, CheckCircle, Download } from 'lucide-react';

const PolicySection = ({ formData, onManageDocuments, onPreview }) => {
    if (!formData) return null;

    return (
        <div className="column-section policy-section">
            <div className="section-header-row">
                <h3 className="section-title">Final Policy</h3>

                <button
                    onClick={onManageDocuments}
                    className="text-btn"
                >
                    Manage Documents
                </button>
            </div>

            <div className="policy-content-wrapper">
                {formData.finalPolicy ? (
                    <div className="policy-active-state">
                        <div className="policy-icon-wrapper success">
                            <CheckCircle size={24} />
                        </div>
                        <div className="policy-details">
                            <h4>Policy Issued</h4>
                            <p>{formData.finalPolicy}</p>
                            <div className="policy-actions">
                                <button onClick={onPreview} className="btn-outline">Preview</button>
                                <button
                                    className="btn-solid"
                                    onClick={() => formData.finalPolicyUrl && window.open(formData.finalPolicyUrl, '_blank')}
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="policy-empty-state">
                        <div className="policy-icon-wrapper pending">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h4>Pending Generation</h4>
                            <p>Upload documents to generate final policy.</p>
                        </div>
                    </div>
                )}

                {/* Document List Preview (Small) */}
                {formData.documents && formData.documents.length > 0 && (
                    <div className="mini-doc-list">
                        {formData.documents.map((doc, idx) => (
                            <span key={idx} className="mini-doc-tag">
                                <FileText size={12} /> {doc.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PolicySection;
