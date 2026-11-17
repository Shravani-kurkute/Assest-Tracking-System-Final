// Authentication context that stores the logged-in user and token lifecycle helpers.

import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function getStoredUser() {
    try {
        const stored = localStorage.getItem("user");
        const token = localStorage.getItem("access_token");
        return stored && token ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [loading] = useState(false);

    const login = async (email, password) => {
        const res = await api.post("/auth/login", {
            email: email.trim().toLowerCase(),
            password,
        });

        const { access_token, refresh_token, user: userData } = res.data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("user", JSON.stringify(userData));

        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
    };

    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
