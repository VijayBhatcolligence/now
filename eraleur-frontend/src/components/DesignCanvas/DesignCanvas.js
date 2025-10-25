import React, { useState, useRef, useCallback, useEffect } from 'react';
import CanvasComponent from './CanvasComponent';
import styles from './DesignCanvas.module.css';

/**
 * DesignCanvas Component
 * Main canvas area for designing UI components
 *
 * @param {Object} props
 * @param {Object} props.canvasData - Canvas configuration and components
 * @param {Object} props.selectedComponent - Currently selected component
 * @param {Function} props.onComponentSelect - Selection callback
 * @param {Function} props.onComponentUpdate - Update callback
 * @param {Function} props.onComponentClick - Click callback in preview mode
 * @param {number} props.zoom - Zoom level
 * @param {boolean} props.showGrid - Grid visibility
 * @param {boolean} props.isPreviewMode - Preview mode state (Phase 3)
 */
const DesignCanvas = ({
  canvasData,
  selectedComponent,
  onComponentSelect,
  onComponentUpdate,
  onComponentClick,
  zoom = 1,
  showGrid = false,
  isPreviewMode = false
}) => {
  const canvasRef = useRef(null);
  const [components, setComponents] = useState(canvasData?.components || []);

  // Debounce utility
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((componentId, updates) => {
      if (onComponentUpdate) {
        onComponentUpdate(componentId, updates);
      }
    }, 300),
    [onComponentUpdate]
  );

  const handleComponentDrag = (componentId, position) => {
    // Optimistic update
    setComponents(prev =>
      prev.map(comp =>
        comp.id === componentId ? { ...comp, ...position } : comp
      )
    );

    // Debounced save
    debouncedSave(componentId, position);
  };

  const handleComponentResize = (componentId, dimensions) => {
    // Optimistic update
    setComponents(prev =>
      prev.map(comp =>
        comp.id === componentId ? { ...comp, ...dimensions } : comp
      )
    );

    // Debounced save
    debouncedSave(componentId, dimensions);
  };

  const handleCanvasClick = (event) => {
    // Deselect if clicking canvas background
    if (event.target === canvasRef.current || event.target.classList.contains(styles.canvas)) {
      onComponentSelect(null);
    }
  };

  // Update components when canvasData changes
  useEffect(() => {
    if (canvasData?.components) {
      setComponents(canvasData.components);
    } else {
      setComponents([]);
    }
  }, [canvasData]);

  return (
    <div className={styles.canvasContainer} onClick={handleCanvasClick}>
      {!canvasData ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#666',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
          <div style={{ marginBottom: '8px', fontWeight: '600' }}>No Canvas Data Available</div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            The canvas will appear once you connect to a project with canvas data
          </div>
        </div>
      ) : (
        <div
          ref={canvasRef}
          className={styles.canvas}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: canvasData?.width || 1400,
            height: canvasData?.height || 900,
            backgroundColor: canvasData?.backgroundColor || '#ffffff'
          }}
        >
          {showGrid && (
            <div className={styles.grid} />
          )}

          {components.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
              <div>Canvas is empty - click "Add Component" to get started</div>
            </div>
          ) : (
            components.map(component => (
              <CanvasComponent
                key={component.id}
                component={component}
                isSelected={!isPreviewMode && selectedComponent?.id === component.id}
                onSelect={(comp, e) => {
                  e.stopPropagation();
                  if (isPreviewMode && onComponentClick) {
                    onComponentClick(comp);
                  } else {
                    onComponentSelect(comp);
                  }
                }}
                onDrag={!isPreviewMode ? handleComponentDrag : undefined}
                onResize={!isPreviewMode ? handleComponentResize : undefined}
                isPreviewMode={isPreviewMode}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DesignCanvas;
