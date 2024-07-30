import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './components/pages/Home';
import Contact from './components/pages/Contact';
import Info from './components/pages/Info';
import Header from './components/pages/Header';
import Signup from './components/pages/Signup';
import Login from './components/pages/login'; // Ensure case matches the file name
import Dashboard from './components/pages/Dashboard';
import { auth } from './firebase'; // Import your Firebase configuration

const AppContent = ({ user }) => {
    const location = useLocation(); // Get the current location

    return (
        <>
            {location.pathname !== '/dashboard' && <Header />} {/* Conditionally render Header */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/info" element={<Info />} />
                <Route path="/signup" element={<Signup />} />

                {/* Route for Login */}
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

                {/* Route for Dashboard */}
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />

                {/* Default route - redirect to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </>
    );
};

const App = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Firebase auth state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user); // Set user state
        });

        return () => unsubscribe(); // Cleanup function
    }, []);

    return (
        <Router>
            <AppContent user={user} />
        </Router>
    );
};

export default App;
