import React from 'react';
import styles from './PropertyPanel.module.css';

/**
 * PropertyPanel Component
 * Displays and edits properties of selected component
 *
 * @param {Object} props
 * @param {Object} props.selectedComponent - Currently selected component
 * @param {Function} props.onPropertyChange - Property change callback
 * @param {Function} props.onDeleteComponent - Delete component callback
 * @param {Function} props.onAddInteraction - Add interaction callback (Phase 3)
 */
const PropertyPanel = ({ selectedComponent, onPropertyChange, onDeleteComponent, onAddInteraction }) => {
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

  const handleDelete = () => {
    if (onDeleteComponent && window.confirm('Are you sure you want to delete this component?')) {
      onDeleteComponent(selectedComponent.id);
    }
  };

  return (
    <div className={styles.propertyPanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h3>{selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)}</h3>
            <span className={styles.componentId}>#{selectedComponent.id}</span>
          </div>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            title="Delete component"
          >
            🗑️
          </button>
        </div>

        {/* Add Interaction Button (Phase 3) */}
        {onAddInteraction && (
          <button
            className={styles.interactionButton}
            onClick={() => onAddInteraction(selectedComponent)}
            title="Add interaction"
          >
            <span>🔗</span>
            <span>Add Interaction</span>
          </button>
        )}
      </div>

      {/* Layout Group */}
      <div className={styles.group}>
        <h4>Layout</h4>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>X</label>
            <input
              type="number"
              value={selectedComponent.x}
              onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={styles.field}>
            <label>Y</label>
            <input
              type="number"
              value={selectedComponent.y}
              onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>W</label>
            <input
              type="number"
              value={selectedComponent.width}
              onChange={(e) => handleChange('width', parseInt(e.target.value) || 40)}
              min="40"
            />
          </div>
          <div className={styles.field}>
            <label>H</label>
            <input
              type="number"
              value={selectedComponent.height}
              onChange={(e) => handleChange('height', parseInt(e.target.value) || 40)}
              min="40"
            />
          </div>
        </div>
      </div>

      {/* Text Group */}
      {(selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
        <div className={styles.group}>
          <h4>Text</h4>
          <div className={styles.field}>
            <label>Content</label>
            <input
              type="text"
              value={selectedComponent.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Size: {selectedComponent.fontSize || 14}px</label>
            <input
              type="range"
              min="8"
              max="72"
              value={selectedComponent.fontSize || 14}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label>Color</label>
            <input
              type="color"
              value={selectedComponent.textColor || '#000000'}
              onChange={(e) => handleChange('textColor', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Style Group */}
      <div className={styles.group}>
        <h4>Style</h4>
        <div className={styles.field}>
          <label>Background</label>
          <input
            type="color"
            value={selectedComponent.backgroundColor || '#ffffff'}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Border Color</label>
          <input
            type="color"
            value={selectedComponent.borderColor || '#dddddd'}
            onChange={(e) => handleChange('borderColor', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Border: {selectedComponent.borderWidth || 1}px</label>
          <input
            type="range"
            min="0"
            max="10"
            value={selectedComponent.borderWidth || 1}
            onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <label>Radius: {selectedComponent.borderRadius || 0}px</label>
          <input
            type="range"
            min="0"
            max="50"
            value={selectedComponent.borderRadius || 0}
            onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Input-specific Properties */}
      {selectedComponent.type === 'input' && (
        <div className={styles.group}>
          <h4>Input</h4>
          <div className={styles.field}>
            <label>Placeholder</label>
            <input
              type="text"
              value={selectedComponent.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;
