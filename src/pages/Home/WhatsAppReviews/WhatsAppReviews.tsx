import React, { useEffect, useState } from 'react'
import styles from './WhatsAppReviews.module.css'

const WhatsAppReviews: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('whatsapp-reviews')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  const reviews = [
    {
      id: 1,
      type: 'text',
      sender: 'Ankita D.',
      message: 'Thank you Amma 🙏 reminded me of home 💖 The dal was exactly like my mom makes it!',
      timestamp: 'Yesterday, 1:42 PM',
      delivered: true
    },
    {
      id: 2,
      type: 'voice',
      sender: 'Rahul M.',
      message: 'Voice message',
      duration: '0:23',
      timestamp: 'Today, 11:15 AM',
      delivered: true
    },
    {
      id: 3,
      type: 'text',
      sender: 'Priya S.',
      message: 'Guys!! This tiffin service is amazing 😍 Fresh rotis every day and the sabzi tastes so good. My hostel friends are jealous 😂',
      timestamp: 'Today, 2:30 PM',
      delivered: true
    },
    {
      id: 4,
      type: 'voice',
      sender: 'Arjun K.',
      message: 'Voice message',
      duration: '0:31',
      timestamp: '2 days ago, 7:45 PM',
      delivered: true
    },
    {
      id: 5,
      type: 'text',
      sender: 'Meera R.',
      message: 'Best decision ever! 🌟 No more mess food for me. The paneer masala today was chef\'s kiss 👌✨',
      timestamp: 'Today, 6:20 PM',
      delivered: true
    },
    {
      id: 6,
      type: 'text',
      sender: 'Vikash T.',
      message: 'Bro the delivery uncle is so sweet 😊 Always on time and food comes hot. Worth every rupee 💯',
      timestamp: 'Yesterday, 8:10 PM',
      delivered: true
    }
  ]

  return (
    <section id="whatsapp-reviews" className={styles.whatsappReviews}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Straight From WhatsApp</h2>
          <p className={styles.subtitle}>
            Real messages from real customers 💬
          </p>
        </div>
        
        <div className={styles.reviewsGrid}>
          {reviews.map((review, index) => (
            <div 
              key={review.id}
              className={`${styles.reviewCard} ${isVisible ? styles.fadeIn : ''}`}
              style={{ 
                animationDelay: `${index * 0.15}s`,
                transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 2 + 0.5)}deg)`
              }}
            >
              <div className={styles.whatsappHeader}>
                <div className={styles.whatsappLogo}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                </div>
                <span className={styles.senderName}>{review.sender}</span>
              </div>
              
              <div className={styles.messageContent}>
                {review.type === 'text' ? (
                  <div className={styles.textMessage}>
                    <p className={styles.messageText}>{review.message}</p>
                  </div>
                ) : (
                  <div className={styles.voiceMessage}>
                    <div className={styles.playButton}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <div className={styles.voiceWave}>
                      <div className={styles.waveBar}></div>
                      <div className={styles.waveBar}></div>
                      <div className={styles.waveBar}></div>
                      <div className={styles.waveBar}></div>
                      <div className={styles.waveBar}></div>
                    </div>
                    <span className={styles.voiceDuration}>{review.duration}</span>
                  </div>
                )}
              </div>
              
              <div className={styles.messageFooter}>
                <span className={styles.timestamp}>{review.timestamp}</span>
                <div className={styles.deliveryStatus}>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="#4FC3F7">
                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l2.541 2.434c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhatsAppReviews