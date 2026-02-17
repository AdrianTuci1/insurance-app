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
            console.error('Login failed:', error);
            return false;
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
