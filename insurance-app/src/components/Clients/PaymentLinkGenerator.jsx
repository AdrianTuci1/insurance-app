import { useState } from 'react';
import { CreditCard, Link, Copy, Check, Loader2 } from 'lucide-react';
import './PaymentLinkGenerator.css';

const PaymentLinkGenerator = ({ clientName, status }) => {
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const isComplete = status === 'Complete';

    const generateLink = () => {
        if (!isComplete) return;
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            const randomId = Math.random().toString(36).substring(7);
            const link = `https://pay.insurance.com/secure/${randomId}`;
            setGeneratedLink(link);
            setIsLoading(false);
        }, 1200);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`payment-card ${!isComplete ? 'is-pending' : ''}`}>
            <div className="feature-header">
                <div className="payment-icon-wrapper">
                    <CreditCard size={20} />
                </div>
                <div>
                    <h3 className="feature-title">Payments</h3>
                    <p className="feature-subtitle">Generate payment link for {clientName}</p>
                </div>
            </div>

            {!isComplete ? (
                <div className="payment-pending-message">
                    <div className="pending-icon">
                        <Loader2 className="animate-spin" size={20} />
                    </div>
                    <p>Payment link will be available once the policy offer is <strong>Complete</strong>.</p>
                </div>
            ) : !generatedLink ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ marginBottom: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'var(--text-light)' }}>
                        <Link size={24} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Create a secure payment link to send via SMS or WhatsApp.</p>
                    <button
                        onClick={generateLink}
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{ width: '100%', maxWidth: '250px' }}
                    >
                        {isLoading ? 'Generating Link...' : 'Generate Payment Link'}
                    </button>
                </div>
            ) : (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="payment-link-container">
                        <label className="payment-label">Active Payment Link</label>
                        <div className="link-input-group">
                            <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="link-input"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="btn-copy"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-light)' }}>Link expires in 24 hours.</p>
                    <button
                        onClick={() => setGeneratedLink('')}
                        style={{ width: '100%', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.5rem' }}
                    >
                        Generate New Link
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentLinkGenerator;
