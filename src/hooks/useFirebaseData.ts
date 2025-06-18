import { useState, useEffect } from 'react'
import { 
  getMenuItems, 
  getCustomers, 
  getDeliveryStatuses,
  MenuItem,
  Customer,
  DeliveryStatus 
} from '../services/firestore'

// Hook for menu items
export const useMenuItems = (category?: 'veg' | 'non-veg') => {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMenuItems(category)
      setItems(data)
    } catch (err) {
      setError('Failed to load menu items')
      console.error('Error loading menu items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [category])

  return { items, loading, error, refetch: loadItems }
}

// Hook for customers
export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCustomers()
      setCustomers(data)
    } catch (err) {
      setError('Failed to load customers')
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  return { customers, loading, error, refetch: loadCustomers }
}

// Hook for delivery statuses
export const useDeliveryStatuses = () => {
  const [statuses, setStatuses] = useState<DeliveryStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatuses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDeliveryStatuses()
      setStatuses(data)
    } catch (err) {
      setError('Failed to load delivery statuses')
      console.error('Error loading delivery statuses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatuses()
  }, [])

  return { statuses, loading, error, refetch: loadStatuses }
}