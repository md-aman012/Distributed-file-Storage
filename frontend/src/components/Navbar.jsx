import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null; // Only show navbar when logged in

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Cloud className="brand-icon" />
        <span>AeroStorage</span>
      </div>
      <div className="navbar-user">
        <span className="welcome-text">Welcome, {user.username}</span>
        <button onClick={logout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
