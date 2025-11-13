import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Landingpage/Home';
import './App.css';
import Login from './Landingpage/Login';
import Signup from './Landingpage/Signup';
import Dashboard from './Dashboard/Dashboard';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from 'react';
import app from './firebase';
import Admin from './Landingpage/Admin';

function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    // Optionally, show a loading spinner here
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/Dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/admin" element={<Admin />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;
