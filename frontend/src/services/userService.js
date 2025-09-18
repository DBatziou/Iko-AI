// services/userService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const userService = {
    async loginApi(username, password) {
        try {
            // First, authenticate with basic auth to get JWT
            const credentials = btoa(`${username}:${password}`);
            const response = await axios.get(`${API_BASE_URL}/login`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.token;
        } catch (error) {
            console.error("Login error:", error);
            if (error.response?.status === 401) {
                throw new Error("Invalid username or password");
            }
            throw new Error("Login failed. Please try again.");
        }
    },

    async signupApi(username, password, name, email, role) {
        try {
            const userData = {
                username,
                password,
                name,
                email,
                role
            };

            // Create user account
            const createResponse = await axios.post(`${API_BASE_URL}/users`, userData);

            // Automatically login after successful signup
            const token = await this.loginApi(username, password);
            return token;

        } catch (error) {
            console.error("Signup error:", error);
            if (error.response?.status === 400) {
                throw new Error(error.response.data.message || "Username already exists");
            }
            throw new Error("Signup failed. Please try again.");
        }
    },

    async checkUsernameExists(username) {
        try {
            // This endpoint doesn't exist in your controllers, so we'll handle it differently
            // For now, we'll try to create and catch the error
            return false;
        } catch (error) {
            return false;
        }
    },

    logout() {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }
};

export default userService;