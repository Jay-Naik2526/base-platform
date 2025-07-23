import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  // Get the user info from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // --- UPDATED LOGIC ---
  // We now only check for the existence of the 'user' object.
  // This object is only set after a successful, secure login.
  if (!user) {
    // If no user is found, redirect them to the login page.
    return <Navigate to="/login" />;
  }

  // Check 2: Does the logged-in user have the correct role for this page?
  if (requiredRole && user.role !== requiredRole) {
    // If they have the wrong role, send them back to the login page.
    // (A real app might show an "Unauthorized" page here)
    return <Navigate to="/login" />;
  }

  // If both checks pass, show the page they were trying to access.
  return children;
};

export default ProtectedRoute;
