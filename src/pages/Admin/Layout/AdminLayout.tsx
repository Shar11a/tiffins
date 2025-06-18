import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import styles from './AdminLayout.module.css'

interface NavigationItem {
  path: string
  label: string
  icon: string
}

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 968)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  const navigationItems: NavigationItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📋' },
    { path: '/admin/menu', label: 'Menu Editor', icon: '🍽️' },
    { path: '/admin/customers', label: 'Customers', icon: '👥' },
    { path: '/admin/delivery', label: 'Delivery & Notifications', icon: '🚚' },
    { path: '/admin/partners', label: 'Delivery Partners', icon: '🏍️' }
  ]

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Get current page title based on route
  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => 
      location.pathname.startsWith(item.path)
    )
    return currentItem?.label || 'Admin Dashboard'
  }

  return (
    <div className={styles.adminLayout}>
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobile && !isSidebarOpen ? styles.collapsed : ''} ${isMobile && isSidebarOpen ? styles.open : ''}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🔐</div>
            <div>
              <h1 className={styles.logoText}>TiffinBox</h1>
              <p className={styles.logoTagline}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {navigationItems.map((item) => (
              <li key={item.path} className={styles.navItem}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={isMobile ? closeSidebar : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navText}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`${styles.mainContent} ${isMobile ? styles.expanded : ''}`}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {isMobile && (
              <button
                className={styles.mobileMenuButton}
                onClick={toggleSidebar}
                aria-label="Toggle navigation menu"
                aria-expanded={isSidebarOpen}
              >
                {isSidebarOpen ? '✕' : '☰'}
              </button>
            )}
            <h2 className={styles.pageTitle}>{getCurrentPageTitle()}</h2>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>👤</div>
              <span className={styles.userName}>
                {currentUser?.email?.split('@')[0] || 'Admin User'}
              </span>
            </div>
            
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
              aria-label="Logout from admin panel"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.contentArea}>
          <div className={styles.contentWrapper}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout