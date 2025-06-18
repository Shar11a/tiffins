import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/subscription', label: 'Subscribe' },
    { to: '/tracking', label: 'Track My Tiffin' }
  ]

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Brand Section */}
        <div className={styles.brand}>
          <NavLink to="/" className={styles.brandLink} onClick={closeMobileMenu}>
            <div className={styles.brandContent}>
              <h1 className={styles.brandName}>TiffinBox</h1>
              <span className={styles.brandTagline}>Home on your plate</span>
            </div>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          
          <div className={styles.authSection}>
            <NavLink
              to="/admin/login"
              className={({ isActive }) =>
                `${styles.loginButton} ${isActive ? styles.active : ''}`
              }
            >
              Admin
            </NavLink>
            <div style={{ display: 'flex', gap: '10px' }}>
              <NavLink
                to="/rider/login"
                className={({ isActive }) =>
                  `${styles.loginButton} ${isActive ? styles.active : ''}`
                }
                style={{ background: '#3b82f6' }}
              >
                Rider Login
              </NavLink>
              <NavLink
                to="/rider/signup"
                className={({ isActive }) =>
                  `${styles.loginButton} ${isActive ? styles.active : ''}`
                }
                style={{ background: '#10b981' }}
              >
                Become a Rider
              </NavLink>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`${styles.mobileMenuButton} ${isMobileMenuOpen ? styles.open : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileNavContent}>
          <div className={styles.mobileNavLinks}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                }
                onClick={closeMobileMenu}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          
          <div className={styles.mobileAuthSection}>
            <NavLink
              to="/admin/login"
              className={({ isActive }) =>
                `${styles.mobileLoginButton} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobileMenu}
            >
              Admin Login
            </NavLink>
            <NavLink
              to="/rider/login"
              className={({ isActive }) =>
                `${styles.mobileLoginButton} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobileMenu}
              style={{ marginTop: '10px', background: '#3b82f6' }}
            >
              Rider Login
            </NavLink>
            <NavLink
              to="/rider/signup"
              className={({ isActive }) =>
                `${styles.mobileLoginButton} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobileMenu}
              style={{ marginTop: '10px', background: '#10b981' }}
            >
              Become a Rider
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  )
}

export default Navbar