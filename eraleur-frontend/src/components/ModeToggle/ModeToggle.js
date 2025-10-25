import React from 'react';
import styles from './ModeToggle.module.css';

/**
 * ModeToggle Component
 * Allows switching between Requirements and Canvas modes
 *
 * @param {Object} props
 * @param {string} props.currentMode - Current mode ('requirements' | 'canvas')
 * @param {Function} props.onModeChange - Callback when mode changes
 * @param {boolean} props.disabled - Disable toggle during loading
 */
const ModeToggle = ({ currentMode, onModeChange, disabled = false }) => {
  const handleKeyDown = (event) => {
    // Support Tab key to switch modes
    if (event.key === 'Tab' && !disabled) {
      event.preventDefault();
      const newMode = currentMode === 'requirements' ? 'canvas' : 'requirements';
      onModeChange(newMode);
    }
  };

  return (
    <div
      className={styles.modeToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        className={`${styles.toggleButton} ${currentMode === 'requirements' ? styles.active : ''}`}
        onClick={() => onModeChange('requirements')}
        disabled={disabled}
        aria-label="Switch to Requirements mode"
      >
        <span className={styles.icon}>📋</span>
        <span className={styles.label}>Requirements</span>
      </button>

      <button
        className={`${styles.toggleButton} ${currentMode === 'canvas' ? styles.active : ''}`}
        onClick={() => onModeChange('canvas')}
        disabled={disabled}
        aria-label="Switch to Canvas mode"
      >
        <span className={styles.icon}>🎨</span>
        <span className={styles.label}>Design Canvas</span>
      </button>

      {/* Sliding indicator */}
      <div
        className={`${styles.indicator} ${currentMode === 'canvas' ? styles.indicatorRight : ''}`}
      />
    </div>
  );
};

export default ModeToggle;
