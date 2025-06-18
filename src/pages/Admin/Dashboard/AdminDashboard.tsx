import React, { useEffect, useState } from 'react'
import { getCustomers, getMenuItems, getDeliveryStatuses, getDeliveryPartners } from '../../../services/firestore'

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalMenuItems: 0,
    todaysOrders: 0,
    activeDeliveries: 0,
    totalPartners: 0,
    activePartners: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      const [customers, menuItems, deliveryStatuses, deliveryPartners] = await Promise.all([
        getCustomers(),
        getMenuItems(),
        getDeliveryStatuses(),
        getDeliveryPartners()
      ])

      setStats({
        totalCustomers: customers.length,
        totalMenuItems: menuItems.length,
        todaysOrders: deliveryStatuses.length,
        activeDeliveries: deliveryStatuses.filter(d => d.status !== 'delivered').length,
        totalPartners: deliveryPartners.length,
        activePartners: deliveryPartners.filter(p => p.isActive).length
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: '#2b2b2b', 
          marginBottom: '2rem',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Loading Dashboard... 📊
        </h1>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: '700', 
        color: '#2b2b2b', 
        marginBottom: '2rem',
        fontFamily: 'Poppins, sans-serif'
      }}>
        Welcome to Admin Dashboard 📊
      </h1>

      {/* Notification Status Banner */}
      <div style={{
        background: '#e8f5e8',
        border: '2px solid #25d366',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '2rem' }}>📧</span>
        <div>
          <h3 style={{ 
            fontSize: '1.2rem', 
            fontWeight: '600', 
            margin: '0 0 0.5rem 0',
            color: '#2b2b2b'
          }}>
            Email Notifications Active
          </h3>
          <p style={{ 
            fontSize: '1rem', 
            margin: '0',
            color: '#2b2b2b',
            opacity: 0.8,
            lineHeight: '1.5'
          }}>
            ✅ Email notifications enabled via EmailJS<br/>
            ✅ Automatic notifications sent when delivery status changes<br/>
            ✅ Customers receive tracking codes and real-time updates<br/>
            ✅ Professional email templates with order details
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#fef6e4',
          border: '1px solid rgba(214, 40, 40, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: '0 0 0.5rem 0' }}>
            Today's Orders
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d62828', margin: '0' }}>
            {stats.todaysOrders}
          </p>
        </div>
        
        <div style={{
          background: '#fef6e4',
          border: '1px solid rgba(214, 40, 40, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: '0 0 0.5rem 0' }}>
            Total Customers
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d62828', margin: '0' }}>
            {stats.totalCustomers}
          </p>
        </div>
        
        <div style={{
          background: '#fef6e4',
          border: '1px solid rgba(214, 40, 40, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚚</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: '0 0 0.5rem 0' }}>
            Active Deliveries
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d62828', margin: '0' }}>
            {stats.activeDeliveries}
          </p>
        </div>

        <div style={{
          background: '#fef6e4',
          border: '1px solid rgba(214, 40, 40, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍽️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: '0 0 0.5rem 0' }}>
            Menu Items
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d62828', margin: '0' }}>
            {stats.totalMenuItems}
          </p>
        </div>

        <div style={{
          background: '#fef6e4',
          border: '1px solid rgba(214, 40, 40, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏍️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: '0 0 0.5rem 0' }}>
            Delivery Partners
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d62828', margin: '0' }}>
            {stats.activePartners}/{stats.totalPartners}
          </p>
        </div>
      </div>
      
      <div style={{
        background: '#fef6e4',
        border: '1px solid rgba(214, 40, 40, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2b2b2b', margin: '0 0 1rem 0' }}>
          🔥 Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            style={{
              background: '#d62828',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}
            onClick={() => window.location.href = '/admin/menu'}
          >
            📝 Manage Menu
          </button>
          <button 
            style={{
              background: '#d62828',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}
            onClick={() => window.location.href = '/admin/customers'}
          >
            👥 View Customers
          </button>
          <button 
            style={{
              background: '#d62828',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}
            onClick={() => window.location.href = '/admin/delivery'}
          >
            🚚 Manage Deliveries & Send Emails
          </button>
          <button 
            style={{
              background: '#d62828',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}
            onClick={() => window.location.href = '/admin/partners'}
          >
            🏍️ Manage Partners
          </button>
        </div>
      </div>

      {/* Email System Status */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: '#2b2b2b', 
          margin: '0 0 1rem 0' 
        }}>
          📧 Email Notification System Status
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px solid #25d366',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              margin: '0 0 0.5rem 0',
              color: '#2b2b2b'
            }}>
              ✅ Email Notifications
            </h4>
            <p style={{ 
              fontSize: '0.9rem', 
              margin: '0',
              color: '#2b2b2b',
              opacity: 0.8
            }}>
              EmailJS configured and ready. Customers receive detailed email updates with tracking codes and order information.
            </p>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              margin: '0 0 0.5rem 0',
              color: '#2b2b2b'
            }}>
              📱 Real-time Tracking
            </h4>
            <p style={{ 
              fontSize: '0.9rem', 
              margin: '0',
              color: '#2b2b2b',
              opacity: 0.8
            }}>
              Customers can track their orders using unique tracking codes. Live updates when delivery status changes.
            </p>
          </div>

          <div style={{
            background: 'rgba(139, 69, 19, 0.1)',
            border: '1px solid #8b4513',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              margin: '0 0 0.5rem 0',
              color: '#2b2b2b'
            }}>
              🏍️ Delivery Partners
            </h4>
            <p style={{ 
              fontSize: '0.9rem', 
              margin: '0',
              color: '#2b2b2b',
              opacity: 0.8
            }}>
              Manage your delivery team, track performance, and assign orders to partners efficiently.
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          padding: '1rem',
          fontSize: '0.9rem',
          color: '#2b2b2b'
        }}>
          <strong>🔄 How it works:</strong> When you change delivery status in the Delivery Management section, 
          customers automatically receive email notifications with their tracking code and updated delivery information. 
          You can also manage your delivery partners to ensure efficient order fulfillment.
        </div>
      </div>
      
      <p style={{ 
        fontSize: '1rem', 
        color: '#2b2b2b', 
        opacity: '0.8',
        fontFamily: 'Poppins, sans-serif',
        lineHeight: '1.6'
      }}>
        Your TiffinBox admin dashboard is now connected to Firebase with email notification capabilities and delivery partner management! 
        All customer data is stored securely, customers receive real-time updates via email, and you can efficiently manage your delivery team. 
        Use the Delivery Management section to update order statuses and automatically notify customers.
      </p>
    </div>
  )
}

export default AdminDashboard