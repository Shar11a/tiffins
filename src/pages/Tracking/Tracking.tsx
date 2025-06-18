import React, { useState } from 'react'
import TrackingInput from './TrackingInput/TrackingInput'
import DeliverySummaryCard from './DeliverySummaryCard/DeliverySummaryCard'
import DeliveryMap from './DeliveryMap/DeliveryMap'
import DeliveryFooterStatus from './DeliveryFooterStatus/DeliveryFooterStatus'

const Tracking: React.FC = () => {
  const [trackingToken, setTrackingToken] = useState<string | null>(null)

  const handleTrackingFound = (token: string) => {
    setTrackingToken(token)
  }

  const handleBackToSearch = () => {
    setTrackingToken(null)
  }

  if (!trackingToken) {
    return <TrackingInput onTrackingFound={handleTrackingFound} />
  }

  return (
    <div>
      <DeliverySummaryCard 
        trackingToken={trackingToken} 
        onBackToSearch={handleBackToSearch}
      />
      <DeliveryMap trackingToken={trackingToken} />
      <DeliveryFooterStatus trackingToken={trackingToken} />
    </div>
  )
}

export default Tracking