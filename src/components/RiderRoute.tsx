import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getRiderByEmail } from '../services/riderService'

interface RiderRouteProps {
  children: React.ReactNode
}

const RiderRoute: React.FC<RiderRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth()
  const [isRider, setIsRider] = React.useState<boolean | null>(null)
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    const checkRiderStatus = async () => {
      if (!currentUser) {
        setIsRider(false)
        setChecking(false)
        return
      }

      try {
        const rider = await getRiderByEmail(currentUser.email!)
        setIsRider(!!rider && rider.isActive)
      } catch (error) {
        console.error('Error checking rider status:', error)
        setIsRider(false)
      } finally {
        setChecking(false)
      }
    }

    if (!loading) {
      checkRiderStatus()
    }
  }, [currentUser, loading])

  if (loading || checking) {
    // Show loading state
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div>Verifying rider access...</div>
      </div>
    )
  }

  return isRider ? <>{children}</> : <Navigate to="/rider/login" />
}

export default RiderRoute