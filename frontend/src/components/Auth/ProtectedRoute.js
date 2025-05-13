import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ component: Component, requiredRole, ...rest }) => {
    const { user, loading } = useContext(AuthContext);

    return (
        <Route
            {...rest}
            render={props => {
                // Show loading indicator if auth state is still loading
                if (loading) {
                    return <div className="loading-screen">Loading...</div>;
                }
                
                // If not authenticated, redirect to login
                if (!user) {
                    return <Redirect to={{ 
                        pathname: "/login", 
                        state: { from: props.location } 
                    }} />;
                }
                
                // If requiredRole is provided and user doesn't have that role, redirect
                if (requiredRole && user.role !== requiredRole) {
                    return <Redirect to={user.role === 'admin' ? '/admin' : '/user'} />;
                }
                
                // If authenticated and has required role, render component
                return <Component {...props} />;
            }}
        />
    );
};

export default ProtectedRoute;