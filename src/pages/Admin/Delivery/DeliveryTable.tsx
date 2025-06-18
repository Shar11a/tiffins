import React, { useState, useEffect, useMemo } from 'react'
import { 
  getDeliveryStatuses, 
  updateDeliveryStatus,
  deleteDeliveryStatus,
  getDeliveryPartners,
  DeliveryStatus,
  DeliveryPartner 
} from '../../../services/firestore'
import styles from './DeliveryTable.module.css'

type SortField = 'deliverySlot' | 'status' | 'lastUpdated'
type SortOrder = 'asc' | 'desc'

const DeliveryTable: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryStatus[]>([])
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('lastUpdated')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<DeliveryStatus | null>(null)

  // Status options
  const statusOptions = [
    { value: 'prepared', label: 'Prepared', icon: '🍽️' },
    { value: 'pickedUp', label: 'Picked Up', icon: '📦' },
    { value: 'onTheWay', label: 'On the Way', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '✅' }
  ]

  // Load delivery statuses and partners from Firestore
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [deliveryData, partnersData] = await Promise.all([
        getDeliveryStatuses(),
        getDeliveryPartners()
      ])
      setOrders(deliveryData)
      setDeliveryPartners(partnersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeliveryStatuses = async () => {
    try {
      const deliveryData = await getDeliveryStatuses()
      setOrders(deliveryData)
    } catch (error) {
      console.error('Error loading delivery statuses:', error)
    }
  }

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesPartner = partnerFilter === 'all' || order.assignedPartner === partnerFilter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      
      return matchesPartner && matchesStatus
    })

    // Sort orders
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'deliverySlot':
          aValue = a.estimatedArrival
          bValue = b.estimatedArrival
          break
        case 'status':
          const statusOrder = { 'prepared': 1, 'pickedUp': 2, 'onTheWay': 3, 'delivered': 4 }
          aValue = statusOrder[a.status]
          bValue = statusOrder[b.status]
          break
        case 'lastUpdated':
          aValue = a.lastUpdated.toMillis()
          bValue = b.lastUpdated.toMillis()
          break
        default:
          aValue = a.lastUpdated.toMillis()
          bValue = b.lastUpdated.toMillis()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [orders, partnerFilter, statusFilter, sortField, sortOrder])

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const pending = orders.filter(o => o.status !== 'delivered').length
    const unassigned = orders.filter(o => o.assignedPartner === 'unassigned').length

    return { total, delivered, pending, unassigned }
  }, [orders])

  const handlePartnerChange = async (orderId: string, partnerId: string) => {
    try {
      await updateDeliveryStatus(orderId, { assignedPartner: partnerId })
      await loadDeliveryStatuses()
    } catch (error) {
      console.error('Error updating partner assignment:', error)
    }
  }

  const handleStatusChange = async (orderId: string, status: DeliveryStatus['status']) => {
    try {
      setUpdatingStatus(orderId)
      
      // Show immediate feedback
      const statusMessages = {
        prepared: 'Updating status to "Prepared" and sending email notification...',
        pickedUp: 'Updating status to "Picked Up" and sending email notification...',
        onTheWay: 'Updating status to "On the Way" and sending email notification...',
        delivered: 'Updating status to "Delivered" and sending email notification...'
      }
      
      console.log(statusMessages[status])
      
      // Update status in Firestore (this will trigger email notification)
      await updateDeliveryStatus(orderId, { status })
      
      // Show success message
      const successMessages = {
        prepared: '✅ Status updated to "Prepared" - Customer notified via email',
        pickedUp: '✅ Status updated to "Picked Up" - Customer notified via email',
        onTheWay: '✅ Status updated to "On the Way" - Customer notified via email',
        delivered: '✅ Status updated to "Delivered" - Customer notified via email'
      }
      
      // Show success notification (you could use a toast library here)
      alert(successMessages[status])
      
      await loadDeliveryStatuses()
    } catch (error) {
      console.error('Error updating delivery status:', error)
      alert('❌ Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleView = (order: DeliveryStatus) => {
    setViewingOrder(order)
    setShowOrderDetailsModal(true)
  }

  const handleRemove = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order && window.confirm(`Are you sure you want to remove order ${order.orderId}?`)) {
      try {
        await deleteDeliveryStatus(orderId)
        await loadData()
        alert('✅ Order removed successfully')
      } catch (error) {
        console.error('Error removing order:', error)
        alert('❌ Failed to remove order. Please try again.')
      }
    }
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-') as [SortField, SortOrder]
    setSortField(field)
    setSortOrder(order)
  }

  const getPartnerName = (partnerId: string) => {
    if (partnerId === 'unassigned') return 'Unassigned'
    const partner = deliveryPartners.find(p => p.id === partnerId)
    return partner?.name || partnerId
  }

  const getStatusInfo = (status: DeliveryStatus['status']) => {
    const statusInfo = statusOptions.find(s => s.value === status)
    return statusInfo || { value: status, label: status, icon: '❓' }
  }

  if (isLoading) {
    return (
      <div className={styles.deliveryTable}>
        <div className={styles.header}>
          <h1 className={styles.title}>Delivery Management 🚚</h1>
          <p className={styles.subtitle}>
            Loading delivery orders and partners...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.deliveryTable}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Delivery Management 🚚</h1>
        <p className={styles.subtitle}>
          Manage today's delivery assignments and track order status. 
          <strong> Customers are automatically notified via email when status changes.</strong>
        </p>
      </div>

      {/* Notification Info Banner */}
      <div style={{
        background: '#e8f5e8',
        border: '2px solid #25d366',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>📧</span>
        <div>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            margin: '0 0 0.25rem 0',
            color: '#2b2b2b'
          }}>
            Automatic Email Notifications Enabled
          </h3>
          <p style={{ 
            fontSize: '0.9rem', 
            margin: '0',
            color: '#2b2b2b',
            opacity: 0.8
          }}>
            When you update order status below, customers automatically receive email notifications with their tracking code and delivery updates.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summarySection}>
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>📦</span>
            <div className={styles.summaryValue}>{stats.total}</div>
            <div className={styles.summaryLabel}>Total Orders Today</div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>✅</span>
            <div className={styles.summaryValue}>{stats.delivered}</div>
            <div className={styles.summaryLabel}>Delivered</div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>⏳</span>
            <div className={styles.summaryValue}>{stats.pending}</div>
            <div className={styles.summaryLabel}>Pending</div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>❓</span>
            <div className={styles.summaryValue}>{stats.unassigned}</div>
            <div className={styles.summaryLabel}>Unassigned</div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>🏍️</span>
            <div className={styles.summaryValue}>{deliveryPartners.filter(p => p.isActive).length}</div>
            <div className={styles.summaryLabel}>Active Partners</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className={styles.controlsSection}>
        <div className={styles.controlsGrid}>
          <div className={styles.controlGroup}>
            <label htmlFor="partnerFilter" className={styles.controlLabel}>
              Filter by Partner
            </label>
            <select
              id="partnerFilter"
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Partners</option>
              <option value="unassigned">Unassigned</option>
              {deliveryPartners
                .filter(partner => partner.isActive)
                .map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="statusFilter" className={styles.controlLabel}>
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="sort" className={styles.controlLabel}>
              Sort By
            </label>
            <select
              id="sort"
              value={`${sortField}-${sortOrder}`}
              onChange={handleSortChange}
              className={styles.sortSelect}
            >
              <option value="lastUpdated-desc">Last Updated (Newest)</option>
              <option value="lastUpdated-asc">Last Updated (Oldest)</option>
              <option value="deliverySlot-asc">Delivery Slot (Early)</option>
              <option value="deliverySlot-desc">Delivery Slot (Late)</option>
              <option value="status-asc">Status (Prepared First)</option>
              <option value="status-desc">Status (Delivered First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            <span className={styles.tableIcon}>📋</span>
            Today's Deliveries
          </h2>
          <span className={styles.resultCount}>
            Showing {filteredAndSortedOrders.length} of {orders.length} orders
          </span>
        </div>

        {filteredAndSortedOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <div className={styles.emptyText}>No delivery orders found</div>
            <div className={styles.emptySubtext}>
              {partnerFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your filter criteria'
                : 'No delivery orders have been placed today'
              }
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeadCell}>Order ID</th>
                  <th className={styles.tableHeadCell}>Customer Name</th>
                  <th className={styles.tableHeadCell}>Delivery Slot</th>
                  <th className={styles.tableHeadCell}>Location</th>
                  <th className={styles.tableHeadCell}>Assigned Partner</th>
                  <th className={styles.tableHeadCell}>Status (Auto-Email)</th>
                  <th className={styles.tableHeadCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredAndSortedOrders.map((order) => (
                  <tr key={order.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.orderId}>#{order.orderId}</div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.customerName}>{order.customerName}</div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.deliverySlot}>{order.estimatedArrival}</span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.mealType}>
                        <span className={styles.mealIcon}>📍</span>
                        {order.currentLocation}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <select
                        value={order.assignedPartner}
                        onChange={(e) => handlePartnerChange(order.id!, e.target.value)}
                        className={`${styles.partnerSelect} ${order.assignedPartner === 'unassigned' ? styles.unassigned : styles.assigned}`}
                      >
                        <option value="unassigned">Unassigned</option>
                        {deliveryPartners
                          .filter(partner => partner.isActive)
                          .map(partner => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name} ({partner.vehicleType === 'bike' ? '🏍️' : 
                                              partner.vehicleType === 'scooter' ? '🛵' : '🚗'})
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className={styles.tableCell}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id!, e.target.value as DeliveryStatus['status'])}
                        className={`${styles.statusSelect} ${styles[order.status]}`}
                        disabled={updatingStatus === order.id}
                        style={{
                          opacity: updatingStatus === order.id ? 0.6 : 1,
                          cursor: updatingStatus === order.id ? 'wait' : 'pointer'
                        }}
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.icon} {status.label}
                          </option>
                        ))}
                      </select>
                      {updatingStatus === order.id && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#d62828',
                          marginTop: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Sending email...
                        </div>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionsCell}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleView(order)}
                          aria-label={`View order ${order.orderId}`}
                        >
                          🔍
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.removeButton}`}
                          onClick={() => handleRemove(order.id!)}
                          aria-label={`Remove order ${order.orderId}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className={styles.mobileCards}>
              {filteredAndSortedOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                return (
                  <div key={order.id} className={styles.deliveryCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardOrderInfo}>
                        <div className={styles.cardOrderId}>#{order.orderId}</div>
                        <div className={styles.cardCustomerName}>{order.customerName}</div>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleView(order)}
                          aria-label={`View order ${order.orderId}`}
                        >
                          🔍
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.removeButton}`}
                          onClick={() => handleRemove(order.id!)}
                          aria-label={`Remove order ${order.orderId}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className={styles.cardDetails}>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardDetailLabel}>Delivery Time</span>
                        <span className={styles.cardDetailValue}>{order.estimatedArrival}</span>
                      </div>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardDetailLabel}>Location</span>
                        <span className={styles.cardDetailValue}>{order.currentLocation}</span>
                      </div>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardDetailLabel}>Current Status</span>
                        <span className={styles.cardDetailValue}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </div>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardDetailLabel}>Assigned Partner</span>
                        <span className={styles.cardDetailValue}>
                          {getPartnerName(order.assignedPartner)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardControls}>
                      <div className={styles.cardControlGroup}>
                        <span className={styles.cardControlLabel}>Assign Partner</span>
                        <select
                          value={order.assignedPartner}
                          onChange={(e) => handlePartnerChange(order.id!, e.target.value)}
                          className={styles.cardSelect}
                        >
                          <option value="unassigned">Unassigned</option>
                          {deliveryPartners
                            .filter(partner => partner.isActive)
                            .map(partner => (
                              <option key={partner.id} value={partner.id}>
                                {partner.name} ({partner.vehicleType === 'bike' ? '🏍️' : 
                                                partner.vehicleType === 'scooter' ? '🛵' : '🚗'})
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <div className={styles.cardControlGroup}>
                        <span className={styles.cardControlLabel}>Update Status (Auto-Email)</span>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id!, e.target.value as DeliveryStatus['status'])}
                          className={styles.cardSelect}
                          disabled={updatingStatus === order.id}
                          style={{
                            opacity: updatingStatus === order.id ? 0.6 : 1,
                            cursor: updatingStatus === order.id ? 'wait' : 'pointer'
                          }}
                        >
                          {statusOptions.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.icon} {status.label}
                            </option>
                          ))}
                        </select>
                        {updatingStatus === order.id && (
                          <div style={{
                            fontSize: '0.7rem',
                            color: '#d62828',
                            marginTop: '0.25rem',
                            fontWeight: '500',
                            textAlign: 'center'
                          }}>
                            Sending email...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetailsModal && viewingOrder && (
        <OrderDetailsModal 
          order={viewingOrder} 
          onClose={() => setShowOrderDetailsModal(false)}
          partnerName={getPartnerName(viewingOrder.assignedPartner)}
        />
      )}
    </div>
  )
}

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: DeliveryStatus
  onClose: () => void
  partnerName: string
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, partnerName }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Order Details</h3>
          <button 
            className={styles.modalClose}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.orderDetailGrid}>
            <div className={styles.orderDetailSection}>
              <h4 className={styles.sectionTitle}>Order Information</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Order ID:</span>
                <span className={styles.detailValue}>#{order.orderId}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tracking Token:</span>
                <span className={styles.detailValue}>{order.trackingToken}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={styles.detailValue}>
                  {order.status === 'prepared' ? '🍽️ Being Prepared' :
                   order.status === 'pickedUp' ? '📦 Picked Up' :
                   order.status === 'onTheWay' ? '🚚 On the Way' :
                   '✅ Delivered'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Delivery Slot:</span>
                <span className={styles.detailValue}>{order.estimatedArrival}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Current Location:</span>
                <span className={styles.detailValue}>{order.currentLocation}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Last Updated:</span>
                <span className={styles.detailValue}>
                  {order.lastUpdated.toDate().toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className={styles.orderDetailSection}>
              <h4 className={styles.sectionTitle}>Customer Information</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>{order.customerName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Customer ID:</span>
                <span className={styles.detailValue}>{order.customerId}</span>
              </div>
            </div>
            
            <div className={styles.orderDetailSection}>
              <h4 className={styles.sectionTitle}>Delivery Information</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Assigned Partner:</span>
                <span className={styles.detailValue}>{partnerName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Expires At:</span>
                <span className={styles.detailValue}>
                  {order.expiresAt.toDate().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button 
              className={styles.modalButton}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryTable