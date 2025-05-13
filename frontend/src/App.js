import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import UserDashboard from './components/Dashboard/UserDashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import './styles/global.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/" exact>
              <Redirect to="/login" />
            </Route>
            
            <Route path="/(admin|user)">
              <div className="authenticated-container">
                <Header />
                <div className="content-container">
                  <Sidebar />
                  <main className="main-content">
                    <Switch>
                      <ProtectedRoute 
                        path="/admin" 
                        component={AdminDashboard} 
                        requiredRole="admin" 
                      />
                      <ProtectedRoute 
                        path="/user" 
                        component={UserDashboard} 
                      />
                    </Switch>
                  </main>
                </div>
                <Footer />
              </div>
            </Route>
          </Switch>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;