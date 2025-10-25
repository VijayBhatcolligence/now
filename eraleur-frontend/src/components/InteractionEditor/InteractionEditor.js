import React, { useState } from 'react';
import styles from './InteractionEditor.module.css';

/**
 * InteractionEditor Component
 * Allows adding interactions like navigation, modals, etc. to components
 */
const InteractionEditor = ({ component, pages, onSaveInteraction, onClose }) => {
  const [interactionType, setInteractionType] = useState('navigate');
  const [targetPage, setTargetPage] = useState('');
  const [modalContent, setModalContent] = useState('');

  const interactionTypes = [
    { id: 'navigate', name: 'Navigate to Page', icon: '🔗', description: 'Go to another page' },
    { id: 'modal', name: 'Show Modal', icon: '📱', description: 'Display a popup' },
    { id: 'toggle', name: 'Toggle Visibility', icon: '👁️', description: 'Show/hide element' },
    { id: 'external', name: 'External Link', icon: '🌐', description: 'Open URL' }
  ];

  const handleSave = () => {
    const interaction = {
      componentId: component.id,
      type: interactionType,
      targetPage: interactionType === 'navigate' ? targetPage : undefined,
      modalContent: interactionType === 'modal' ? modalContent : undefined
    };
    onSaveInteraction(interaction);
    onClose();
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>🎯 Add Interaction</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.componentInfo}>
            <span className={styles.label}>Component:</span>
            <span className={styles.value}>{component.type} #{component.id}</span>
          </div>

          <div className={styles.section}>
            <label>Interaction Type</label>
            <div className={styles.typeGrid}>
              {interactionTypes.map(type => (
                <div
                  key={type.id}
                  className={`${styles.typeCard} ${interactionType === type.id ? styles.selected : ''}`}
                  onClick={() => setInteractionType(type.id)}
                >
                  <span className={styles.typeIcon}>{type.icon}</span>
                  <span className={styles.typeName}>{type.name}</span>
                  <span className={styles.typeDesc}>{type.description}</span>
                </div>
              ))}
            </div>
          </div>

          {interactionType === 'navigate' && (
            <div className={styles.section}>
              <label>Target Page</label>
              <select
                className={styles.select}
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
              >
                <option value="">Select page...</option>
                {pages.filter(p => p.id !== component.pageId).map(page => (
                  <option key={page.id} value={page.id}>
                    {page.icon} {page.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {interactionType === 'modal' && (
            <div className={styles.section}>
              <label>Modal Content</label>
              <textarea
                className={styles.textarea}
                placeholder="Enter modal message..."
                value={modalContent}
                onChange={(e) => setModalContent(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={interactionType === 'navigate' && !targetPage}
          >
            💾 Save Interaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractionEditor;
