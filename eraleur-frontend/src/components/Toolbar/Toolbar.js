import React from 'react';
import styles from './Toolbar.module.css';

/**
 * Toolbar Component
 * Canvas toolbar with zoom, grid, preview mode, and save controls
 *
 * @param {Object} props
 * @param {Function} props.onAddComponent - Callback for add component
 * @param {number} props.zoom - Current zoom level (0-2)
 * @param {Function} props.onZoomChange - Callback for zoom changes
 * @param {boolean} props.showGrid - Grid visibility state
 * @param {Function} props.onToggleGrid - Toggle grid callback
 * @param {string} props.saveStatus - Save status ('saved' | 'saving' | 'error')
 * @param {boolean} props.isPreviewMode - Preview mode state
 * @param {Function} props.onTogglePreview - Toggle preview mode callback
 */
const Toolbar = ({
  onAddComponent,
  zoom = 1,
  onZoomChange,
  showGrid = false,
  onToggleGrid,
  saveStatus = 'saved',
  isPreviewMode = false,
  onTogglePreview
}) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.5);
    onZoomChange(newZoom);
  };

  const handleFitToScreen = () => {
    onZoomChange(1);
  };

  const getSaveStatusContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <span className={styles.statusDot + ' ' + styles.saving}></span>
            <span>Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <span className={styles.statusDot + ' ' + styles.saved}></span>
            <span>Saved</span>
          </>
        );
      case 'error':
        return (
          <>
            <span className={styles.statusDot + ' ' + styles.error}></span>
            <span>Error</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.toolbar}>
      {/* Left Actions */}
      <div className={styles.leftActions}>
        <button
          className={styles.primaryButton}
          onClick={onAddComponent}
          title="Add new component"
        >
          <span className={styles.buttonIcon}>➕</span>
          <span>Add Component</span>
        </button>

        <div className={styles.separator} />

        {/* Zoom Controls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.toolButton}
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom out"
          >
            −
          </button>

          <span className={styles.zoomDisplay}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            className={styles.toolButton}
            onClick={handleZoomIn}
            disabled={zoom >= 2}
            title="Zoom in"
          >
            +
          </button>

          <button
            className={styles.toolButton}
            onClick={handleFitToScreen}
            title="Fit to screen"
          >
            <span className={styles.fitIcon}>⏹</span>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className={styles.rightActions}>
        {/* Preview Mode Toggle (Phase 3) */}
        {onTogglePreview && (
          <>
            <button
              className={`${styles.previewButton} ${isPreviewMode ? styles.previewActive : ''}`}
              onClick={onTogglePreview}
              title={isPreviewMode ? "Exit Preview Mode" : "Enter Preview Mode"}
            >
              <span className={styles.buttonIcon}>{isPreviewMode ? '✏️' : '▶️'}</span>
              <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>

            <div className={styles.separator} />
          </>
        )}

        {/* Grid Toggle */}
        <button
          className={`${styles.toolButton} ${showGrid ? styles.active : ''}`}
          onClick={onToggleGrid}
          title="Toggle grid"
        >
          <span className={styles.gridIcon}>⊞</span>
          <span>Grid</span>
        </button>

        {/* Save Status */}
        <div className={styles.saveStatus}>
          {getSaveStatusContent()}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
