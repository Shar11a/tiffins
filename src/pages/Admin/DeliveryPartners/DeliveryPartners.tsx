import React, { useState, useEffect } from 'react'
import { 
  getDeliveryPartners, 
  addDeliveryPartner, 
  updateDeliveryPartner, 
  deleteDeliveryPartner,
  DeliveryPartner,
  getPendingRiders,
  approveRider
} from '../../../services/firestore'
import { getRiderById } from '../../../services/riderService'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase/config'
import styles from './DeliveryPartners.module.css'

interface FormData {
  name: string
  phone: string
  email: string
  password: string
  vehicleType: 'bike' | 'car' | 'scooter'
  vehicleNumber: string
  isActive: boolean
}

const DeliveryPartners: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([])
  const [pendingPartners, setPendingPartners] = useState<DeliveryPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    isActive: true
  })

  useEffect(() => {
    loadAllPartners()
  }, [])

  const loadAllPartners = async () => {
    try {
      setLoading(true)
      const [activeData, pendingData] = await Promise.all([
        getDeliveryPartners(),
        getPendingRiders()
      ])
      setPartners(activeData)
      setPendingPartners(pendingData)
    } catch (error) {
      console.error('Error loading delivery partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (!editingPartner && !formData.password.trim()) {
      alert('Password is required for new riders')
      return
    }

    try {
      setSubmitting(true)
      
      if (editingPartner) {
        // Update existing partner (without password change)
        const updateData = { ...formData }
        delete updateData.password // Don't update password in partner update
        
        await updateDeliveryPartner(editingPartner.id!, updateData)
        alert('✅ Delivery partner updated successfully!')
      } else {
        // Create new partner with Firebase Auth account
        try {
          // Create Firebase Auth account first
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            formData.password
          )
          
          console.log('Firebase Auth account created:', userCredential.user.uid)
          
          // Then create partner record in Firestore
          const partnerData = { ...formData }
          delete partnerData.password // Don't store password in Firestore
          
          await addDeliveryPartner(partnerData)
          alert('✅ Delivery partner added successfully! They can now log in with their email and password.')
        } catch (authError: any) {
          console.error('Error creating Firebase Auth account:', authError)
          
          if (authError.code === 'auth/email-already-in-use') {
            alert('❌ This email is already registered. Please use a different email address.')
          } else if (authError.code === 'auth/weak-password') {
            alert('❌ Password is too weak. Please use at least 6 characters.')
          } else if (authError.code === 'auth/invalid-email') {
            alert('❌ Invalid email address format.')
          } else {
            alert('❌ Failed to create rider account: ' + authError.message)
          }
          return
        }
      }

      await loadAllPartners()
      resetForm()
    } catch (error) {
      console.error('Error saving delivery partner:', error)
      alert('❌ Failed to save delivery partner. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (partner: DeliveryPartner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      phone: partner.phone,
      email: partner.email,
      password: '', // Don't pre-fill password for security
      vehicleType: partner.vehicleType,
      vehicleNumber: partner.vehicleNumber,
      isActive: partner.isActive
    })
    setShowForm(true)
  }

  const handleViewDetails = async (partner: DeliveryPartner) => {
    try {
      // Get the latest data for this partner
      const latestData = await getRiderById(partner.id!)
      if (latestData) {
        setSelectedPartner(latestData)
        setShowDetailsModal(true)
      }
    } catch (error) {
      console.error('Error fetching rider details:', error)
      alert('Failed to load rider details. Please try again.')
    }
  }

  const handleDelete = async (partner: DeliveryPartner) => {
    if (window.confirm(`Are you sure you want to delete ${partner.name}? This action cannot be undone.`)) {
      try {
        await deleteDeliveryPartner(partner.id!)
        alert('✅ Delivery partner deleted successfully!')
        await loadAllPartners()
      } catch (error) {
        console.error('Error deleting delivery partner:', error)
        alert('❌ Failed to delete delivery partner. Please try again.')
      }
    }
  }

  const handleApprove = async (partner: DeliveryPartner) => {
    if (window.confirm(`Are you sure you want to approve ${partner.name} as a delivery partner?`)) {
      try {
        await approveRider(partner.id!)
        alert(`✅ ${partner.name} has been approved as a delivery partner!`)
        await loadAllPartners()
      } catch (error) {
        console.error('Error approving delivery partner:', error)
        alert('❌ Failed to approve delivery partner. Please try again.')
      }
    }
  }

  const toggleStatus = async (partner: DeliveryPartner) => {
    try {
      await updateDeliveryPartner(partner.id!, { isActive: !partner.isActive })
      await loadAllPartners()
    } catch (error) {
      console.error('Error updating partner status:', error)
      alert('❌ Failed to update partner status. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      vehicleType: 'bike',
      vehicleNumber: '',
      isActive: true
    })
    setEditingPartner(null)
    setShowForm(false)
  }

  // Combine active and pending partners for filtering
  const allPartners = [...partners, ...pendingPartners]
  
  const filteredPartners = allPartners.filter(partner => {
    const matchesSearch = 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone.includes(searchTerm) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && partner.isActive) ||
      (statusFilter === 'inactive' && !partner.isActive && partner.id !== undefined) ||
      (statusFilter === 'pending' && !partner.isActive && pendingPartners.some(p => p.id === partner.id))
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.isActive).length,
    inactive: partners.filter(p => !p.isActive).length,
    pending: pendingPartners.length,
    totalDeliveries: partners.reduce((sum, p) => sum + p.totalDeliveries, 0)
  }

  if (loading) {
    return (
      <div className={styles.deliveryPartners}>
        <div className={styles.header}>
          <h1 className={styles.title}>Delivery Partners 🚚</h1>
          <p className={styles.subtitle}>Loading delivery partners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.deliveryPartners}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Delivery Partners 🚚</h1>
        <p className={styles.subtitle}>
          Manage your delivery team and track their performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsSection}>
        <div className={styles.statsCards}>
          <div className={styles.statsCard}>
            <span className={styles.statsIcon}>👥</span>
            <div className={styles.statsValue}>{stats.total}</div>
            <div className={styles.statsLabel}>Total Partners</div>
          </div>
          <div className={styles.statsCard}>
            <span className={styles.statsIcon}>✅</span>
            <div className={styles.statsValue}>{stats.active}</div>
            <div className={styles.statsLabel}>Active Partners</div>
          </div>
          <div className={styles.statsCard}>
            <span className={styles.statsIcon}>❌</span>
            <div className={styles.statsValue}>{stats.inactive}</div>
            <div className={styles.statsLabel}>Inactive Partners</div>
          </div>
          <div className={styles.statsCard} style={{ background: '#f0f9ff', borderColor: '#3b82f6' }}>
            <span className={styles.statsIcon}>🔔</span>
            <div className={styles.statsValue}>{stats.pending}</div>
            <div className={styles.statsLabel}>Pending Applications</div>
          </div>
          <div className={styles.statsCard}>
            <span className={styles.statsIcon}>📦</span>
            <div className={styles.statsValue}>{stats.totalDeliveries}</div>
            <div className={styles.statsLabel}>Total Deliveries</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.controlsLeft}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            placeholder="Search partners..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={styles.filterSelect}
          >
            <option value="all">All Partners</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="pending">Pending Applications</option>
          </select>
        </div>
        <button
          className={styles.addButton}
          onClick={() => setShowForm(true)}
        >
          <span className={styles.buttonIcon}>➕</span>
          Add Partner
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                {editingPartner ? '🖊️ Edit Partner' : '➕ Add New Partner'}
              </h3>
              <button
                className={styles.closeButton}
                onClick={resetForm}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="Partner name"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="+44 7XXX XXXXXX"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="partner@email.com"
                    required
                    disabled={!!editingPartner} // Can't change email for existing partners
                  />
                </div>

                {!editingPartner && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={styles.fieldInput}
                      placeholder="Minimum 6 characters"
                      required={!editingPartner}
                      minLength={6}
                    />
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className={styles.fieldSelect}
                  >
                    <option value="bike">🏍️ Bike</option>
                    <option value="scooter">🛵 Scooter</option>
                    <option value="car">🚗 Car</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="AB12 CDE"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className={styles.checkbox}
                    />
                    Active Partner
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingPartner ? 'Update Partner' : 'Add Partner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rider Details Modal */}
      {showDetailsModal && selectedPartner && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                🏍️ Rider Details: {selectedPartner.name}
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.form} style={{ padding: '1rem 2rem 2rem' }}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailGroup}>
                  <h4 className={styles.detailTitle}>Personal Information</h4>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Name:</span>
                    <span className={styles.detailValue}>{selectedPartner.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailValue}>{selectedPartner.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Phone:</span>
                    <span className={styles.detailValue}>{selectedPartner.phone}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Joined:</span>
                    <span className={styles.detailValue}>
                      {selectedPartner.joinedDate.toDate().toLocaleDateString()} at {selectedPartner.joinedDate.toDate().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status:</span>
                    <span className={`${styles.statusBadge} ${selectedPartner.isActive ? styles.active : styles.inactive}`}>
                      {selectedPartner.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                </div>

                <div className={styles.detailGroup}>
                  <h4 className={styles.detailTitle}>Vehicle Information</h4>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vehicle Type:</span>
                    <span className={styles.detailValue}>
                      {selectedPartner.vehicleType === 'bike' ? '🏍️ Bike' : 
                       selectedPartner.vehicleType === 'scooter' ? '🛵 Scooter' : '🚗 Car'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Vehicle Number:</span>
                    <span className={styles.detailValue}>{selectedPartner.vehicleNumber}</span>
                  </div>
                </div>

                <div className={styles.detailGroup}>
                  <h4 className={styles.detailTitle}>Performance</h4>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total Deliveries:</span>
                    <span className={styles.detailValue}>{selectedPartner.totalDeliveries}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Current Orders:</span>
                    <span className={styles.detailValue}>{selectedPartner.currentOrders}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Rating:</span>
                    <span className={styles.detailValue}>⭐ {selectedPartner.rating.toFixed(1)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Last Active:</span>
                    <span className={styles.detailValue}>
                      {selectedPartner.lastActive.toDate().toLocaleDateString()} at {selectedPartner.lastActive.toDate().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {selectedPartner.identityProof && (
                  <div className={styles.detailGroup} style={{ gridColumn: '1 / -1' }}>
                    <h4 className={styles.detailTitle}>Identity Verification</h4>
                    <div className={styles.identityProofSection}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Document Type:</span>
                        <span className={styles.detailValue}>
                          {selectedPartner.identityProofType?.includes('pdf') ? 'PDF Document' : 'Photo ID'}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>File Name:</span>
                        <span className={styles.detailValue}>{selectedPartner.identityProofFileName}</span>
                      </div>
                      <div className={styles.identityProofPreview}>
                        {selectedPartner.identityProofType?.includes('image') ? (
                          <img 
                            src={selectedPartner.identityProof} 
                            alt="Identity document" 
                            className={styles.identityImage}
                          />
                        ) : (
                          <div className={styles.pdfPreview}>
                            <span className={styles.pdfIcon}>📄</span>
                            <a 
                              href={selectedPartner.identityProof} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={styles.pdfLink}
                            >
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.formActions} style={{ marginTop: '2rem' }}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedPartner);
                  }}
                >
                  Edit Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Applications Section */}
      {pendingPartners.length > 0 && statusFilter !== 'active' && statusFilter !== 'inactive' && (
        <div className={styles.tableContainer} style={{ marginBottom: '2rem' }}>
          <div className={styles.tableHeader} style={{ background: '#f0f9ff', borderColor: '#3b82f6' }}>
            <h3 className={styles.tableTitle} style={{ color: '#3b82f6' }}>
              🔔 Pending Applications ({pendingPartners.length})
            </h3>
          </div>

          <table className={styles.table}>
            <thead className={styles.tableHead} style={{ background: '#3b82f6' }}>
              <tr>
                <th className={styles.tableHeadCell}>Applicant</th>
                <th className={styles.tableHeadCell}>Contact</th>
                <th className={styles.tableHeadCell}>Vehicle</th>
                <th className={styles.tableHeadCell}>Applied On</th>
                <th className={styles.tableHeadCell}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {pendingPartners.map((partner) => (
                <tr key={partner.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.partnerInfo}>
                      <div className={styles.partnerName}>{partner.name}</div>
                      <div className={styles.partnerJoined}>
                        Applied {partner.joinedDate.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.contactInfo}>
                      <div className={styles.phone}>📞 {partner.phone}</div>
                      <div className={styles.email}>📧 {partner.email}</div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.vehicleInfo}>
                      <div className={styles.vehicleType}>
                        {partner.vehicleType === 'bike' ? '🏍️' : 
                         partner.vehicleType === 'scooter' ? '🛵' : '🚗'} 
                        {partner.vehicleType}
                      </div>
                      <div className={styles.vehicleNumber}>{partner.vehicleNumber}</div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    {partner.joinedDate.toDate().toLocaleDateString()} at {partner.joinedDate.toDate().toLocaleTimeString()}
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => handleViewDetails(partner)}
                        title="View details"
                      >
                        🔍
                      </button>
                      <button
                        className={styles.editButton}
                        style={{ background: '#10b981', color: 'white', width: 'auto', padding: '0.5rem 1rem' }}
                        onClick={() => handleApprove(partner)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(partner)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Partners Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            📋 Partners List ({filteredPartners.filter(p => pendingPartners.every(pp => pp.id !== p.id)).length})
          </h3>
        </div>

        {filteredPartners.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🚚</span>
            <div className={styles.emptyText}>No delivery partners found</div>
            <div className={styles.emptySubtext}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first delivery partner to get started'
              }
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Partner</th>
                  <th className={styles.tableHeadCell}>Contact</th>
                  <th className={styles.tableHeadCell}>Vehicle</th>
                  <th className={styles.tableHeadCell}>Performance</th>
                  <th className={styles.tableHeadCell}>Status</th>
                  <th className={styles.tableHeadCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredPartners
                  .filter(partner => pendingPartners.every(p => p.id !== partner.id))
                  .map((partner) => (
                  <tr key={partner.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.partnerInfo}>
                        <div className={styles.partnerName}>{partner.name}</div>
                        <div className={styles.partnerJoined}>
                          Joined {partner.joinedDate.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.contactInfo}>
                        <div className={styles.phone}>📞 {partner.phone}</div>
                        <div className={styles.email}>📧 {partner.email}</div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.vehicleInfo}>
                        <div className={styles.vehicleType}>
                          {partner.vehicleType === 'bike' ? '🏍️' : 
                           partner.vehicleType === 'scooter' ? '🛵' : '🚗'} 
                          {partner.vehicleType}
                        </div>
                        <div className={styles.vehicleNumber}>{partner.vehicleNumber}</div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.performance}>
                        <div className={styles.deliveries}>📦 {partner.totalDeliveries} deliveries</div>
                        <div className={styles.rating}>⭐ {partner.rating.toFixed(1)}</div>
                        <div className={styles.currentOrders}>🔄 {partner.currentOrders} active</div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <button
                        className={`${styles.statusBadge} ${partner.isActive ? styles.active : styles.inactive}`}
                        onClick={() => toggleStatus(partner)}
                      >
                        {partner.isActive ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actions}>
                        <button
                          className={styles.viewButton}
                          onClick={() => handleViewDetails(partner)}
                          title="View details"
                        >
                          🔍
                        </button>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEdit(partner)}
                        >
                          🖊️
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(partner)}
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
              {filteredPartners
                .filter(partner => pendingPartners.every(p => p.id !== partner.id))
                .map((partner) => (
                <div key={partner.id} className={styles.partnerCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardPartnerInfo}>
                      <div className={styles.cardPartnerName}>{partner.name}</div>
                      <div className={styles.cardJoined}>
                        Joined {partner.joinedDate.toDate().toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => handleViewDetails(partner)}
                        title="View details"
                      >
                        🔍
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(partner)}
                      >
                        🖊️
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(partner)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardDetails}>
                    <div className={styles.cardDetail}>
                      <span className={styles.cardDetailLabel}>Phone</span>
                      <span className={styles.cardDetailValue}>{partner.phone}</span>
                    </div>
                    <div className={styles.cardDetail}>
                      <span className={styles.cardDetailLabel}>Email</span>
                      <span className={styles.cardDetailValue}>{partner.email}</span>
                    </div>
                    <div className={styles.cardDetail}>
                      <span className={styles.cardDetailLabel}>Vehicle</span>
                      <span className={styles.cardDetailValue}>
                        {partner.vehicleType === 'bike' ? '🏍️' : 
                         partner.vehicleType === 'scooter' ? '🛵' : '🚗'} 
                        {partner.vehicleType} - {partner.vehicleNumber}
                      </span>
                    </div>
                    <div className={styles.cardDetail}>
                      <span className={styles.cardDetailLabel}>Performance</span>
                      <span className={styles.cardDetailValue}>
                        📦 {partner.totalDeliveries} | ⭐ {partner.rating.toFixed(1)} | 🔄 {partner.currentOrders}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <button
                      className={`${styles.statusBadge} ${partner.isActive ? styles.active : styles.inactive}`}
                      onClick={() => toggleStatus(partner)}
                    >
                      {partner.isActive ? '✅ Active' : '❌ Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DeliveryPartners