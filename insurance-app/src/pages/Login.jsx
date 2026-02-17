import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { authStore } from '../stores/AuthStore';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const success = await authStore.login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Failed to login');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card animate-fade-in">
                <div className="login-header">
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Sign in to access your dashboard</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <User className="input-icon" />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="admin@insurance.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-submit">
                        Sign In
                    </button>

                    <div className="demo-credentials">
                        <p>Demo Credentials: admin@insurance.com / admin</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
