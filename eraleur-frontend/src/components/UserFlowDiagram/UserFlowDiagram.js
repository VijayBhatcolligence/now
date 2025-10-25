import React from 'react';
import styles from './UserFlowDiagram.module.css';

/**
 * UserFlowDiagram Component
 * Visualizes user flow and features in an attractive, interactive diagram
 *
 * @param {Object} props
 * @param {Object} props.flowData - User flow data structure
 */
const UserFlowDiagram = ({ flowData }) => {
  if (!flowData || !flowData.features) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎯</div>
        <p>No user flow data available</p>
      </div>
    );
  }

  const { project_name, features, user_journey } = flowData;

  return (
    <div className={styles.container}>
      {/* Project Overview Card */}
      <div className={styles.overviewCard}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}>🎯</span>
          <h2>{project_name || 'Project Overview'}</h2>
        </div>
        <div className={styles.projectStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{features?.length || 0}</span>
            <span className={styles.statLabel}>Features</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user_journey?.length || 0}</span>
            <span className={styles.statLabel}>User Steps</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      {features && features.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>✨</span>
            Key Features
          </h3>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon || '📦'}</div>
                <h4 className={styles.featureTitle}>{feature.name}</h4>
                <p className={styles.featureDescription}>{feature.description}</p>
                {feature.priority && (
                  <span className={`${styles.priority} ${styles[feature.priority.toLowerCase()]}`}>
                    {feature.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Journey Flow */}
      {user_journey && user_journey.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🚀</span>
            User Journey
          </h3>
          <div className={styles.journeyFlow}>
            {user_journey.map((step, index) => (
              <React.Fragment key={index}>
                <div className={styles.journeyStep}>
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>{step.title}</h4>
                    <p className={styles.stepDescription}>{step.description}</p>
                    {step.components && step.components.length > 0 && (
                      <div className={styles.stepComponents}>
                        {step.components.map((comp, idx) => (
                          <span key={idx} className={styles.componentTag}>
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {index < user_journey.length - 1 && (
                  <div className={styles.journeyArrow}>
                    <svg width="24" height="40" viewBox="0 0 24 40">
                      <path
                        d="M12 0 L12 30 M12 30 L6 24 M12 30 L18 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFlowDiagram;
