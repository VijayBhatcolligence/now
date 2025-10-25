import React from 'react';
import styles from './ResizeHandles.module.css';

/**
 * ResizeHandles Component
 * 8-point resize system for canvas components
 *
 * @param {Object} props
 * @param {Object} props.component - Component being resized
 * @param {Function} props.onResize - Callback for resize events
 */
const ResizeHandles = ({ component, onResize }) => {
  const handleResizeStart = (handleId, event) => {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = component.width;
    const startHeight = component.height;
    const startPosX = component.x;
    const startPosY = component.y;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      // Calculate new dimensions based on handle direction
      switch (handleId) {
        case 'nw': // Top-left
          newWidth = Math.max(40, startWidth - deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newX = startPosX + (startWidth - newWidth);
          newY = startPosY + (startHeight - newHeight);
          break;
        case 'n': // Top
          newHeight = Math.max(40, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
          break;
        case 'ne': // Top-right
          newWidth = Math.max(40, startWidth + deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
          break;
        case 'e': // Right
          newWidth = Math.max(40, startWidth + deltaX);
          break;
        case 'se': // Bottom-right
          newWidth = Math.max(40, startWidth + deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          break;
        case 's': // Bottom
          newHeight = Math.max(40, startHeight + deltaY);
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(40, startWidth - deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          newX = startPosX + (startWidth - newWidth);
          break;
        case 'w': // Left
          newWidth = Math.max(40, startWidth - deltaX);
          newX = startPosX + (startWidth - newWidth);
          break;
        default:
          break;
      }

      onResize(component.id, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        x: Math.round(newX),
        y: Math.round(newY)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const resizeHandles = [
    { id: 'nw', cursor: 'nw-resize', x: -4, y: -4 },
    { id: 'n', cursor: 'n-resize', x: component.width / 2 - 4, y: -4 },
    { id: 'ne', cursor: 'ne-resize', x: component.width - 4, y: -4 },
    { id: 'e', cursor: 'e-resize', x: component.width - 4, y: component.height / 2 - 4 },
    { id: 'se', cursor: 'se-resize', x: component.width - 4, y: component.height - 4 },
    { id: 's', cursor: 's-resize', x: component.width / 2 - 4, y: component.height - 4 },
    { id: 'sw', cursor: 'sw-resize', x: -4, y: component.height - 4 },
    { id: 'w', cursor: 'w-resize', x: -4, y: component.height / 2 - 4 }
  ];

  return (
    <>
      {resizeHandles.map(handle => (
        <div
          key={handle.id}
          className={styles.resizeHandle}
          style={{
            left: handle.x,
            top: handle.y,
            cursor: handle.cursor
          }}
          onMouseDown={(e) => handleResizeStart(handle.id, e)}
        />
      ))}
    </>
  );
};

export default ResizeHandles;
