import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style.css';
import { auth } from '../../firebase'; // Import Firebase auth module

const Header = ({ user }) => {
    const location = useLocation();

    useEffect(() => {
        // Remove existing classes before adding new ones
        document.body.classList.remove('signup-page', 'contact-page', 'info-page','login');

        // Add class based on current route
        if (location.pathname === '/signup') {
            document.body.classList.add('signup-page');
        } else if (location.pathname === '/contact') {
            document.body.classList.add('contact-page');
        } else if (location.pathname === '/info') {
            document.body.classList.add('info-page');
        } else if(location.pathname === '/login'){
            document.body.classList.add('login');
        } 
        
    }, [location.pathname]);

    const getLinkStyle = (path) => {
        if (location.pathname === '/') {
            return { color: 'white' };
        } else if (location.pathname === '/contact') {
            return { color: 'orangered' };
        } else if (location.pathname === '/info') {
            return { color: 'orangered' };
        } else if (location.pathname === '/signup') {
            return { 
                color: 'orangered',
                // Optionally set link-specific styles here
            };
        } else {
            return { color: 'orangered' }; // Default color for other links
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            // Handle any additional logout tasks if needed
        } catch (error) {
            console.error('Error signing out:', error);
            // Handle logout error if needed
        }
    };

    return (
        <header>
            <nav>
                <div className="nav-links">
                    <Link to="/" style={getLinkStyle('/')}>Home</Link>
                    <Link to="/contact" style={getLinkStyle('/contact')}>Contacts</Link>
                    <Link to="/info" style={getLinkStyle('/info')}>Info</Link>
                    <Link to="/signup" style={getLinkStyle('/signup')}>Sign Up</Link>
                </div>
                {user ? (
                    <div className="logout-btn">
                        <button className="btn-primary btn-sm" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                ) : null}
            </nav>
        </header>
    );
};

export default Header;
