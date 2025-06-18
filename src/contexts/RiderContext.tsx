import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { getRiderByEmail } from '../services/riderService'

interface RiderContextType {
  currentUser: User | null
  riderData: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const RiderContext = createContext<RiderContextType | undefined>(undefined)

export const useRider = () => {
  const context = useContext(RiderContext)
  if (context === undefined) {
    throw new Error('useRider must be used within a RiderProvider')
  }
  return context
}

interface RiderProviderProps {
  children: React.ReactNode
}

export const RiderProvider: React.FC<RiderProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [riderData, setRiderData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (email: string, password: string) => {
    // First check if the user is a registered rider
    const rider = await getRiderByEmail(email)
    
    if (!rider) {
      throw new Error('You are not registered as a delivery partner')
    }

    if (!rider.isActive) {
      throw new Error('Your account is inactive. Please contact admin.')
    }

    // Then authenticate with Firebase
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        try {
          const rider = await getRiderByEmail(user.email!)
          setRiderData(rider)
        } catch (error) {
          console.error('Error fetching rider data:', error)
        }
      } else {
        setRiderData(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: RiderContextType = {
    currentUser,
    riderData,
    login,
    logout,
    loading
  }

  return (
    <RiderContext.Provider value={value}>
      {!loading && children}
    </RiderContext.Provider>
  )
}