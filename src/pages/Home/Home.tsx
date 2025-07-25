import React from 'react'
import Hero from './Hero/Hero'
import WhatWeDo from './WhatWeDo/WhatWeDo'
import HowItWorks from './HowItWorks/HowItWorks'
import WhatYouGet from './WhatYouGet/WhatYouGet'
import StudentDiscount from './StudentDiscount/StudentDiscount'
import DeliveryPreview from './DeliveryPreview/DeliveryPreview'
import FinalCTA from './FinalCTA/FinalCTA'
import Footer from './Footer/Footer'

const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      <WhatWeDo />
      <HowItWorks />
      <WhatYouGet />
      <StudentDiscount />
      <DeliveryPreview />
      <FinalCTA />
      <Footer />
    </div>
  )
}

export default Home