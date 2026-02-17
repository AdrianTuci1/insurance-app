import React from 'react';
import { Trash2 } from 'lucide-react';

const ClientForm = ({
    formData,
    onChange,
    onFranchiseToggle,
    onOfferSelect,
    onRateSelect,
    onDeleteClick,
    insuranceTypes,
    isProcessing
}) => {
    if (!formData) return null;

    return (
        <div className="column-content">
            <h3 className="section-title">Job Information</h3>

            <div className="client-details-form">
                <div className="form-group">
                    <label className="detail-label">Client Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={onChange}
                        className="detail-input"
                        placeholder="Enter full name"
                    />
                </div>

                <div className="form-group">
                    <label className="detail-label">Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={onChange}
                        className="detail-input"
                        placeholder="+40..."
                    />
                </div>

                <div className="form-group">
                    <label className="detail-label">Vehicle VIN</label>
                    <input
                        type="text"
                        name="vin"
                        value={formData.vin || ''}
                        onChange={onChange}
                        className="detail-input"
                        placeholder="Enter VIN number"
                    />
                </div>

                <div className="form-group">
                    <label className="detail-label">Insurance Object</label>
                    <input
                        type="text"
                        name="object"
                        value={formData.object || ''}
                        onChange={onChange}
                        className="detail-input"
                        placeholder="Vehicle or Property"
                    />
                </div>

                <div className="form-group">
                    <label className="detail-label">Insurance Type</label>
                    <select
                        name="type"
                        value={formData.type || ''}
                        onChange={onChange}
                        className="detail-select"
                    >
                        <option value="" disabled>Select Type</option>
                        {insuranceTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* ADVANCED OFFER SELECTION OR PROCESSING STATE */}
                {isProcessing ? (
                    <div className="processing-offers-loader">
                        <div className="loader-mini"></div>
                        <p>Document processing in progress... extracting offers</p>
                    </div>
                ) : formData.groupedOffers && (formData.groupedOffers.withoutFranchise.length > 0 || formData.groupedOffers.withFranchise.length > 0) ? (
                    <div className="advanced-offer-selection">
                        <label className="detail-label">Select Offer & Installments</label>

                        <div className="offer-type-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${!formData.selectedFranchise ? 'active' : ''}`}
                                onClick={() => onFranchiseToggle(false)}
                            >
                                Without Franchise
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${formData.selectedFranchise ? 'active' : ''}`}
                                onClick={() => onFranchiseToggle(true)}
                            >
                                With Franchise
                            </button>
                        </div>

                        <div className="offer-selection-controls">
                            <select
                                className="detail-select offer-dropdown"
                                value={formData.selectedOfferIndex ?? -1}
                                onChange={(e) => onOfferSelect(Number(e.target.value))}
                            >
                                <option value="-1">Not set</option>
                                {(formData.selectedFranchise ? formData.groupedOffers.withFranchise : formData.groupedOffers.withoutFranchise).map((offer, idx) => (
                                    <option key={idx} value={idx}>
                                        {offer.company} - {offer.rate1}
                                    </option>
                                ))}
                            </select>

                            {(() => {
                                const offers = formData.selectedFranchise ? formData.groupedOffers.withFranchise : formData.groupedOffers.withoutFranchise;
                                const selectedOffer = offers[formData.selectedOfferIndex];

                                if (!selectedOffer || formData.selectedOfferIndex === -1) return null;

                                return (
                                    <div className="selected-offer-details">
                                        <div className="offer-info-row">
                                            <span className="label">Company:</span>
                                            <span className="value">{selectedOffer.company}</span>
                                        </div>
                                        <div className="offer-info-row">
                                            <span className="label">Sum Insured:</span>
                                            <span className="value">{selectedOffer.sum}</span>
                                        </div>
                                        {selectedOffer.hasFranchise && (
                                            <div className="offer-info-row">
                                                <span className="label">Franchise:</span>
                                                <span className="value">{selectedOffer.franchisePartial} / {selectedOffer.franchiseTotal}</span>
                                            </div>
                                        )}

                                        <div className="installment-selection">
                                            <label className="detail-label">Payment Installments</label>
                                            <div className="installment-buttons">
                                                <button
                                                    type="button"
                                                    className={`installment-btn ${formData.selectedRate === 'rate1' ? 'active' : ''}`}
                                                    onClick={() => onRateSelect('rate1', selectedOffer.rate1, formData.selectedOfferIndex)}
                                                >
                                                    <span className="rate-label">1 Rate</span>
                                                    <span className="rate-value">{selectedOffer.rate1}</span>
                                                </button>

                                                {selectedOffer.rate4 && (
                                                    <button
                                                        type="button"
                                                        className={`installment-btn ${formData.selectedRate === 'rate4' ? 'active' : ''}`}
                                                        onClick={() => onRateSelect('rate4', selectedOffer.rate4, formData.selectedOfferIndex)}
                                                    >
                                                        <span className="rate-label">4 Rates</span>
                                                        <span className="rate-value">{selectedOffer.rate4}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="form-group">
                        <label className="detail-label">Offer Amount</label>
                        <input
                            type="text"
                            name="amount"
                            value={formData.amount || ''}
                            onChange={onChange}
                            className="detail-input"
                            placeholder="Not set"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label className="detail-label">Current Premium</label>
                    <div className="premium-display">
                        <span className="premium-value">{formData.amount || 'Not set'}</span>
                        <span className={`status-pill ${formData.status?.toLowerCase().replace(' ', '-')}`}>
                            {formData.status}
                        </span>
                    </div>
                </div>

                <div className="form-separator"></div>

                <div className="danger-zone">
                    <button
                        onClick={onDeleteClick}
                        className="btn-delete"
                    >
                        <Trash2 size={16} /> Delete Job
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientForm;
