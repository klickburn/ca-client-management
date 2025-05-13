import React, { useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const history = useHistory();

    const handleLogout = async () => {
        await logout();
        history.push('/login');
    };

    return (
        <header className="header">
            <div className="logo">
                <h1>CA Client Manager</h1>
            </div>
            {user && (
                <>
                    <nav className="navigation">
                        <ul>
                            <li><Link to={user.role === 'admin' ? '/admin' : '/user'}>Dashboard</Link></li>
                            <li><Link to="/clients">Clients</Link></li>
                            {user.role === 'admin' && <li><Link to="/users">Users</Link></li>}
                        </ul>
                    </nav>
                    <div className="user-menu">
                        <div className="user-info">
                            Welcome, {user.username} ({user.role})
                        </div>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </>
            )}
        </header>
    );
};

export default Header;