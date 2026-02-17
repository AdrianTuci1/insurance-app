import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { authStore } from '../stores/AuthStore';
import './Signup.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        secretKey: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await authStore.signup(formData);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card signup-card animate-fade-in">
                <div className="login-header">
                    <h1 className="login-title">Admin Registration</h1>
                    <p className="login-subtitle">Create a new administrator account</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">Account created! Redirecting...</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-wrapper">
                            <User className="input-icon" />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Derryl Admin"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="admin@insurance.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type="password"
                                className="form-input"
                                placeholder="********"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Registration Key</label>
                        <div className="input-wrapper">
                            <ShieldCheck className="input-icon" />
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter secret key"
                                value={formData.secretKey}
                                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Admin Account'}
                    </button>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
