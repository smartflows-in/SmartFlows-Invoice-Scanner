import React, { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>PDF Analyzer Pro</h2>
        </div>
        
        <button 
          className={`mobile-menu-btn ${isMenuOpen ? 'open' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <ul className={`navbar-nav ${isMenuOpen ? 'active' : ''}`}>
          <li><a href="#home" onClick={closeMenu}>Home</a></li>
          <li><a href="#features" onClick={closeMenu}>Features</a></li>
          <li><a href="#about" onClick={closeMenu}>About</a></li>
          <li><a href="#contact" onClick={closeMenu}>Contact</a></li>
          
          {/* Mobile-only action buttons */}
          <div className="mobile-actions">
            <button className="btn btn-secondary" onClick={closeMenu}>
              <i className="fas fa-sign-in-alt"></i>
              Sign In
            </button>
            <button className="btn btn-primary" onClick={closeMenu}>
              <i className="fas fa-user-plus"></i>
              Sign Up
            </button>
          </div>
        </ul>
        
        <div className="navbar-actions">
          <button className="btn btn-secondary">
            <i className="fas fa-sign-in-alt"></i>
            Sign In
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-user-plus"></i>
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;