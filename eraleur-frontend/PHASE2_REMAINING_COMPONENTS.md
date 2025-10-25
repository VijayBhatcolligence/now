# Phase 2 - Remaining Components

## ✅ Components Created So Far

1. ✅ ModeToggle - Professional toggle with sliding indicator
2. ✅ Toolbar - Full-featured canvas toolbar
3. ✅ ResizeHandles - 8-point resize system

## 🚀 Remaining Components to Create

### 4. CanvasComponent.js

Create: `src/components/DesignCanvas/CanvasComponent.js`

```javascript
import React, { useState } from 'react';
import ResizeHandles from './ResizeHandles';
import styles from './CanvasComponent.module.css';

const CanvasComponent = ({ component, isSelected, onSelect, onDrag, onResize }) => {
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
            src={component.imageUrl || 'https://via.placeholder.com/300x200'}
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
    if (!isSelected) {
      onSelect(component, event);
    }

    setIsDragging(true);
    const startX = event.clientX - component.x;
    const startY = event.clientY - component.y;

    const handleMouseMove = (e) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      onDrag(component.id, { x: Math.round(newX), y: Math.round(newY) });
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
      className={`${styles.canvasComponent} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {renderComponentContent()}
      {isSelected && <ResizeHandles component={component} onResize={onResize} />}
    </div>
  );
};

export default CanvasComponent;
```

**CanvasComponent.module.css:**

```css
.canvasComponent {
  box-sizing: border-box;
  transition: box-shadow 0.2s ease;
  user-select: none;
}

.canvasComponent.selected {
  box-shadow: 0 0 0 2px #667eea;
  z-index: 5;
}

.canvasComponent:hover:not(.selected) {
  box-shadow: 0 0 0 1px #aaa;
}

.canvasComponent.dragging {
  opacity: 0.8;
  z-index: 999;
}
```

---

### 5. DesignCanvas.js

Create: `src/components/DesignCanvas/DesignCanvas.js`

```javascript
import React, { useState, useRef, useCallback } from 'react';
import CanvasComponent from './CanvasComponent';
import styles from './DesignCanvas.module.css';

const DesignCanvas = ({
  canvasData,
  selectedComponent,
  onComponentSelect,
  onComponentUpdate,
  zoom = 1,
  showGrid = false
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
    if (event.target === canvasRef.current || event.target.closest(`.${styles.canvas}`)) {
      onComponentSelect(null);
    }
  };

  // Update components when canvasData changes
  React.useEffect(() => {
    if (canvasData?.components) {
      setComponents(canvasData.components);
    }
  }, [canvasData]);

  return (
    <div className={styles.canvasContainer} onClick={handleCanvasClick}>
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: canvasData?.canvas?.width || 1400,
          height: canvasData?.canvas?.height || 900,
          backgroundColor: canvasData?.canvas?.backgroundColor || '#ffffff'
        }}
      >
        {showGrid && (
          <div className={styles.grid} />
        )}

        {components.map(component => (
          <CanvasComponent
            key={component.id}
            component={component}
            isSelected={selectedComponent?.id === component.id}
            onSelect={(comp, e) => {
              e.stopPropagation();
              onComponentSelect(comp);
            }}
            onDrag={handleComponentDrag}
            onResize={handleComponentResize}
          />
        ))}
      </div>
    </div>
  );
};

export default DesignCanvas;
```

**DesignCanvas.module.css:**

```css
.canvasContainer {
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
  position: relative;
}

.canvas {
  position: relative;
  margin: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(#e0e0e0 1px, transparent 1px),
    linear-gradient(90deg, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}
```

---

### 6. PropertyPanel.js

Create: `src/components/PropertyPanel/PropertyPanel.js`

```javascript
import React from 'react';
import styles from './PropertyPanel.module.css';

const PropertyPanel = ({ selectedComponent, onPropertyChange }) => {
  if (!selectedComponent) {
    return (
      <div className={styles.propertyPanel}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🎨</span>
          <p>Select a component</p>
          <p className={styles.emptyHint}>Click on any component to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleChange = (property, value) => {
    if (onPropertyChange) {
      onPropertyChange(selectedComponent.id, { [property]: value });
    }
  };

  return (
    <div className={styles.propertyPanel}>
      <div className={styles.header}>
        <h3>{selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)}</h3>
        <span className={styles.componentId}>#{selectedComponent.id}</span>
      </div>

      {/* Layout Group */}
      <div className={styles.group}>
        <h4>Layout</h4>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>X</label>
            <input type="number" value={selectedComponent.x} onChange={(e) => handleChange('x', parseInt(e.target.value))} />
          </div>
          <div className={styles.field}>
            <label>Y</label>
            <input type="number" value={selectedComponent.y} onChange={(e) => handleChange('y', parseInt(e.target.value))} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>W</label>
            <input type="number" value={selectedComponent.width} onChange={(e) => handleChange('width', parseInt(e.target.value))} min="40" />
          </div>
          <div className={styles.field}>
            <label>H</label>
            <input type="number" value={selectedComponent.height} onChange={(e) => handleChange('height', parseInt(e.target.value))} min="40" />
          </div>
        </div>
      </div>

      {/* Text Group */}
      {(selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
        <div className={styles.group}>
          <h4>Text</h4>
          <div className={styles.field}>
            <label>Content</label>
            <input type="text" value={selectedComponent.text || ''} onChange={(e) => handleChange('text', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Size: {selectedComponent.fontSize || 14}px</label>
            <input type="range" min="8" max="72" value={selectedComponent.fontSize || 14} onChange={(e) => handleChange('fontSize', parseInt(e.target.value))} />
          </div>
          <div className={styles.field}>
            <label>Color</label>
            <input type="color" value={selectedComponent.textColor || '#000000'} onChange={(e) => handleChange('textColor', e.target.value)} />
          </div>
        </div>
      )}

      {/* Style Group */}
      <div className={styles.group}>
        <h4>Style</h4>
        <div className={styles.field}>
          <label>Background</label>
          <input type="color" value={selectedComponent.backgroundColor || '#ffffff'} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Border Color</label>
          <input type="color" value={selectedComponent.borderColor || '#dddddd'} onChange={(e) => handleChange('borderColor', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Border: {selectedComponent.borderWidth || 1}px</label>
          <input type="range" min="0" max="10" value={selectedComponent.borderWidth || 1} onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))} />
        </div>
        <div className={styles.field}>
          <label>Radius: {selectedComponent.borderRadius || 0}px</label>
          <input type="range" min="0" max="50" value={selectedComponent.borderRadius || 0} onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))} />
        </div>
      </div>

      {/* Input-specific */}
      {selectedComponent.type === 'input' && (
        <div className={styles.group}>
          <h4>Input</h4>
          <div className={styles.field}>
            <label>Placeholder</label>
            <input type="text" value={selectedComponent.placeholder || ''} onChange={(e) => handleChange('placeholder', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;
```

**PropertyPanel.module.css:**

```css
.propertyPanel {
  width: 320px;
  background: white;
  border-left: 1px solid #e9ecef;
  overflow-y: auto;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}

.header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.componentId {
  font-size: 12px;
  color: #999;
}

.group {
  margin-bottom: 24px;
}

.group h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field {
  margin-bottom: 12px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.field input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 13px;
}

.field input[type="color"] {
  height: 40px;
  cursor: pointer;
}

.field input[type="range"] {
  padding: 0;
}

.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #999;
}

.emptyIcon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.emptyHint {
  font-size: 13px;
  color: #bbb;
}
```

---

## 🎯 Next: Update App.js and Test Server

Check the main implementation guide for these updates.

**All components are now ready!** 🎉
