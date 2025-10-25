import React, { useState } from 'react';
import ResizeHandles from './ResizeHandles';
import styles from './CanvasComponent.module.css';

/**
 * CanvasComponent
 * Renders individual UI components on the canvas
 *
 * @param {Object} props
 * @param {Object} props.component - Component data
 * @param {boolean} props.isSelected - Selection state
 * @param {Function} props.onSelect - Selection callback
 * @param {Function} props.onDrag - Drag callback
 * @param {Function} props.onResize - Resize callback
 * @param {boolean} props.isPreviewMode - Preview mode state (Phase 3)
 */
const CanvasComponent = ({ component, isSelected, onSelect, onDrag, onResize, isPreviewMode }) => {
  const [isDragging, setIsDragging] = useState(false);

  const renderComponentContent = () => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box'
    };

    switch (component.type) {
      case 'button':
        return (
          <button
            style={{
              ...baseStyle,
              backgroundColor: component.backgroundColor || '#667eea',
              color: component.textColor || '#ffffff',
              fontSize: `${component.fontSize || 14}px`,
              fontWeight: component.fontWeight || '500',
              borderRadius: `${component.borderRadius || 6}px`,
              border: component.borderWidth
                ? `${component.borderWidth}px solid ${component.borderColor || '#667eea'}`
                : 'none',
              cursor: 'pointer',
              outline: 'none'
            }}
            onClick={(e) => e.preventDefault()}
          >
            {component.text || 'Button'}
          </button>
        );

      case 'input':
        return (
          <input
            type="text"
            placeholder={component.placeholder || 'Enter text...'}
            style={{
              ...baseStyle,
              padding: '10px',
              backgroundColor: component.backgroundColor || '#ffffff',
              color: component.textColor || '#333',
              fontSize: `${component.fontSize || 14}px`,
              border: `${component.borderWidth || 1}px solid ${component.borderColor || '#ddd'}`,
              borderRadius: `${component.borderRadius || 4}px`,
              outline: 'none'
            }}
            onClick={(e) => e.preventDefault()}
            readOnly
          />
        );

      case 'text':
        return (
          <div
            style={{
              ...baseStyle,
              color: component.textColor || '#333',
              fontSize: `${component.fontSize || 14}px`,
              fontWeight: component.fontWeight || 'normal',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            {component.text || 'Text'}
          </div>
        );

      case 'image':
        return (
          <img
            src={component.imageUrl || 'https://via.placeholder.com/300x200?text=Image'}
            alt={component.alt || 'Image'}
            style={{
              ...baseStyle,
              objectFit: 'cover',
              borderRadius: `${component.borderRadius || 0}px`
            }}
          />
        );

      case 'container':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: component.backgroundColor || '#f5f5f5',
              border: `${component.borderWidth || 1}px solid ${component.borderColor || '#ddd'}`,
              borderRadius: `${component.borderRadius || 4}px`
            }}
          />
        );

      default:
        return <div style={baseStyle}>Unknown Component</div>;
    }
  };

  const handleMouseDown = (event) => {
    event.stopPropagation();

    // In preview mode, just trigger click
    if (isPreviewMode) {
      onSelect(component, event);
      return;
    }

    if (!isSelected) {
      onSelect(component, event);
    }

    if (!onDrag) return; // No dragging if onDrag not provided

    setIsDragging(true);
    const startX = event.clientX - component.x;
    const startY = event.clientY - component.y;

    const handleMouseMove = (e) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      onDrag(component.id, { x: Math.max(0, Math.round(newX)), y: Math.max(0, Math.round(newY)) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`${styles.canvasComponent} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${isPreviewMode ? styles.preview : ''}`}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        cursor: isPreviewMode ? 'pointer' : (isDragging ? 'grabbing' : 'grab')
      }}
      onMouseDown={handleMouseDown}
    >
      {renderComponentContent()}
      {isSelected && !isPreviewMode && onResize && <ResizeHandles component={component} onResize={onResize} />}
    </div>
  );
};

export default CanvasComponent;
