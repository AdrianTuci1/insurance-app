import { makeAutoObservable, runInAction } from 'mobx';
import { apiService } from '../services/api.service';

class AuthStore {
    user = null;
    token = null;
    loading = true;

    constructor() {
        makeAutoObservable(this);
        this.loadFromStorage();
    }

    loadFromStorage() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('insurance_user');

        if (token && user) {
            this.token = token;
            this.user = JSON.parse(user);
        }
        this.loading = false;
    }

    async login(email, password) {
        try {
            const data = await apiService.post('/auth/login', { email, password });

            if (data.token && data.user) {
                runInAction(() => {
                    this.token = data.token;
                    this.user = data.user;
                });
                localStorage.setItem('token', data.token);
                localStorage.setItem('insurance_user', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed, checking for mock credentials:', error);

            // Mock Fallback for local development
            if (email === 'admin@insurance.com' && password === 'admin') {
                const mockUser = {
                    email: 'admin@insurance.com',
                    role: 'admin',
                    name: 'Admin User',
                    avatar: null
                };
                runInAction(() => {
                    this.token = 'mock-token-123';
                    this.user = mockUser;
                });
                localStorage.setItem('token', 'mock-token-123');
                localStorage.setItem('insurance_user', JSON.stringify(mockUser));
                return true;
            }
            return false;
        }
    }

    async signup(signupData) {
        try {
            const data = await apiService.post('/auth/signup', signupData);
            if (data.message) {
                return { success: true };
            }
            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error('Signup failed, checking for mock flow:', error);

            // Mock Fallback for local development
            if (signupData.secretKey === 'admin') {
                return { success: true, mock: true };
            }
            return { success: false, error: error.message || 'Registration failed' };
        }
    }

    logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('insurance_user');
    }

    get isAuthenticated() {
        return !!this.user;
    }
}

export const authStore = new AuthStore();
