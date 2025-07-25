import React, { useEffect, useState } from "react";
import styles from "./HowItWorks.module.css";
import cookFreshImage from "../../../assets/cook-fresh.png";
import deliveredHomeImage from "../../../assets/delivered-home.png";
import subscribeImage from "../../../assets/subscribe.png";

const HowItWorks: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("how-it-works");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      id: 1,
      title: "Subscribe",
      description: "Choose your plan and delivery time",
      image: subscribeImage,
      alt: "Person using smartphone to subscribe to meal service",
    },
    {
      id: 2,
      title: "Cooked Fresh",
      description: "Meals prepared with love every morning",
      image: cookFreshImage,
      alt: "Chef cooking fresh meals in traditional kitchen",
    },
    {
      id: 3,
      title: "Delivered Home",
      description: "Tiffin arrives warm, right to your door",
      image: deliveredHomeImage,
      alt: "Delivery person bringing tiffin box to customer door",
    },
  ];

  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>How It Works</h2>
          <p className={styles.subtitle}>
            From subscription to your doorstep in three simple steps
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.stepCard} ${isVisible ? styles.fadeIn : ""}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={styles.stepNumber}>{step.id}</div>
              <div className={styles.imageContainer}>
                <img
                  src={step.image}
                  alt={step.alt}
                  className={styles.stepImage}
                />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
