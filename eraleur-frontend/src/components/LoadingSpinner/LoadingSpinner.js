import React from 'react';
import styles from './LoadingSpinner.module.css';

/**
 * LoadingSpinner component
 * Displays an animated spinner with connection status
 *
 * @param {Object} props
 * @param {string} props.status - Connection status message to display
 * @param {string} props.connectionState - Current connection state ('connecting' | 'disconnected' | 'error')
 */
const LoadingSpinner = ({ status = 'Connecting...', connectionState = 'connecting' }) => {
  // Determine status color based on connection state
  const getStatusClass = () => {
    switch (connectionState) {
      case 'connecting':
        return styles.connecting;
      case 'disconnected':
        return styles.disconnected;
      case 'error':
        return styles.error;
      default:
        return styles.connecting;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.spinnerWrapper}>
        {/* Animated spinner circle */}
        <div className={styles.spinner}></div>

        {/* Status message */}
        <div className={`${styles.status} ${getStatusClass()}`}>
          {status}
        </div>

        {/* Connection state indicator */}
        <div className={styles.indicator}>
          <span className={`${styles.dot} ${getStatusClass()}`}></span>
          <span className={styles.stateText}>{connectionState}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
