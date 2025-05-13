import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useContext(AuthContext);
    
    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="sidebar-header">
                <h2>{!collapsed && 'Navigation'}</h2>
                <button className="collapse-button" onClick={toggleSidebar}>
                    {collapsed ? '→' : '←'}
                </button>
            </div>
            
            <ul className="sidebar-menu">
                <li className="sidebar-category">Main</li>
                <li className="sidebar-item">
                    <NavLink 
                        to={user?.role === 'admin' ? '/admin' : '/user'} 
                        className="sidebar-link" 
                        activeClassName="active"
                    >
                        <span className="sidebar-icon">📊</span>
                        <span className="sidebar-text">Dashboard</span>
                    </NavLink>
                </li>
                
                <li className="sidebar-category">Management</li>
                <li className="sidebar-item">
                    <NavLink 
                        to="/clients" 
                        className="sidebar-link" 
                        activeClassName="active"
                    >
                        <span className="sidebar-icon">👥</span>
                        <span className="sidebar-text">Clients</span>
                    </NavLink>
                </li>
                
                {user?.role === 'admin' && (
                    <li className="sidebar-item">
                        <NavLink 
                            to="/users" 
                            className="sidebar-link" 
                            activeClassName="active"
                        >
                            <span className="sidebar-icon">👤</span>
                            <span className="sidebar-text">Users</span>
                        </NavLink>
                    </li>
                )}
                
                <li className="sidebar-category">System</li>
                <li className="sidebar-item">
                    <NavLink 
                        to="/settings" 
                        className="sidebar-link" 
                        activeClassName="active"
                    >
                        <span className="sidebar-icon">⚙️</span>
                        <span className="sidebar-text">Settings</span>
                    </NavLink>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;