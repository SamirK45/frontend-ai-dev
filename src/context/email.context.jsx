import React, { createContext, useContext, useState } from 'react';

export const emailContext = createContext();

export const EmailProvider = ({ children }) => {
    const [email, setEmail] = useState('');

    return (
        <emailContext.Provider value={{ email, setEmail }}>
            {children}
        </emailContext.Provider>
    );
};

