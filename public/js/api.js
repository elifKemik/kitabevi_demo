// ========== API MODÜLÜ ==========
const API = {
    async get(endpoint) {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`);
        return response.json();
    },
    
    async post(endpoint, data) {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response;
    },
    
    async postFormData(endpoint, formData) {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        return response;
    },
    
    async putFormData(endpoint, formData) {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            method: 'PUT',
            body: formData
        });
        return response;
    },
    
    async delete(endpoint) {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            method: 'DELETE'
        });
        return response;
    }
};