import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} CA Client Manager by KlickBurn. All rights reserved.</p>
                <p>A beautiful and classy client management solution</p>
            </div>
        </footer>
    );
};

export default Footer;