import React, { createContext, useContext, useState } from 'react';

const LoginContext = createContext();

export function LoginProvider({ children }) {
    const [showLoginModal, setShowLoginModal] = useState(false);

    const openLogin = () => setShowLoginModal(true);
    const closeLogin = () => setShowLoginModal(false);

    return (
        <LoginContext.Provider value={{ showLoginModal, openLogin, closeLogin }}>
            {children}
        </LoginContext.Provider>
    );
}

export function useLogin() {
    return useContext(LoginContext);
}
