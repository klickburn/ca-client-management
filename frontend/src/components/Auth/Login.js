import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use the login function from AuthContext
            const userData = await login(username, password);
            
            // Redirect based on user role
            if (userData && userData.role) {
                history.push(userData.role === 'admin' ? '/admin' : '/user');
            } else {
                throw new Error('Invalid user data returned');
            }
        } catch (error) {
            setError('Invalid username or password');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-logo">
                    <h1>CA Client Manager</h1>
                    <p>Manage your CA firm clients efficiently</p>
                </div>
                <div className="login-form-container">
                    <h2>Login</h2>
                    {error && <p className="error-message">{error}</p>}
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    <div className="login-footer">
                        <p>© 2025 CA Client Management System</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;