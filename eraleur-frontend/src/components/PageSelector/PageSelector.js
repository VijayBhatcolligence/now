import React, { useState } from 'react';
import styles from './PageSelector.module.css';

/**
 * PageSelector Component
 * Allows switching between different pages and managing them
 *
 * @param {Object} props
 * @param {Array} props.pages - Array of page objects
 * @param {string} props.currentPageId - Current active page ID
 * @param {Function} props.onPageChange - Callback when page is selected
 * @param {Function} props.onAddPage - Callback to add new page
 * @param {Function} props.onRenamePage - Callback to rename page
 * @param {Function} props.onDeletePage - Callback to delete page
 * @param {Function} props.onDuplicatePage - Callback to duplicate page
 */
const PageSelector = ({
  pages = [],
  currentPageId,
  onPageChange,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onDuplicatePage
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageType, setNewPageType] = useState('blank');

  const currentPage = pages.find(p => p.id === currentPageId);

  const pageTypes = [
    { id: 'blank', name: 'Blank Page', icon: '📄', description: 'Start from scratch' },
    { id: 'login', name: 'Login Page', icon: '🔐', description: 'Login form template' },
    { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Analytics dashboard' },
    { id: 'admin', name: 'Admin Panel', icon: '⚙️', description: 'Admin controls' },
    { id: 'profile', name: 'Profile Page', icon: '👤', description: 'User profile' },
    { id: 'settings', name: 'Settings', icon: '🎛️', description: 'Settings page' }
  ];

  const handleAddPage = () => {
    if (newPageName.trim()) {
      onAddPage({
        name: newPageName,
        type: newPageType
      });
      setNewPageName('');
      setNewPageType('blank');
      setShowAddPageModal(false);
    }
  };

  const handleRename = (pageId, newName) => {
    if (newName.trim() && onRenamePage) {
      onRenamePage(pageId, newName);
      setEditingPageId(null);
    }
  };

  const handleDuplicate = (page) => {
    if (onDuplicatePage) {
      onDuplicatePage(page.id);
    }
    setIsDropdownOpen(false);
  };

  const handleDelete = (pageId) => {
    if (pages.length > 1 && window.confirm('Delete this page?')) {
      onDeletePage(pageId);
    } else if (pages.length === 1) {
      alert('Cannot delete the last page');
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.pageSelector}>
      {/* Current Page Display */}
      <div
        className={styles.currentPage}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span className={styles.pageIcon}>{currentPage?.icon || '📄'}</span>
        <span className={styles.pageName}>{currentPage?.name || 'Untitled'}</span>
        <span className={styles.pageCount}>({pages.length} pages)</span>
        <span className={styles.dropdownArrow}>{isDropdownOpen ? '▲' : '▼'}</span>
      </div>

      {/* Pages Dropdown */}
      {isDropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>All Pages</span>
            <button
              className={styles.addPageButton}
              onClick={() => {
                setShowAddPageModal(true);
                setIsDropdownOpen(false);
              }}
            >
              + New Page
            </button>
          </div>

          <div className={styles.pagesList}>
            {pages.map(page => (
              <div
                key={page.id}
                className={`${styles.pageItem} ${page.id === currentPageId ? styles.active : ''}`}
              >
                {editingPageId === page.id ? (
                  <input
                    className={styles.editInput}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRename(page.id, editingName)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRename(page.id, editingName)}
                    autoFocus
                  />
                ) : (
                  <>
                    <div
                      className={styles.pageInfo}
                      onClick={() => {
                        onPageChange(page.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className={styles.pageIcon}>{page.icon || '📄'}</span>
                      <span className={styles.pageName}>{page.name}</span>
                      <span className={styles.componentCount}>
                        {page.components?.length || 0} items
                      </span>
                    </div>

                    <div className={styles.pageActions}>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageId(page.id);
                          setEditingName(page.name);
                        }}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(page);
                        }}
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(page.id);
                        }}
                        title="Delete"
                        disabled={pages.length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className={styles.modal} onClick={() => setShowAddPageModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create New Page</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddPageModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Page Name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., Login Page, Admin Dashboard"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPage()}
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label>Page Template</label>
                <div className={styles.templateGrid}>
                  {pageTypes.map(type => (
                    <div
                      key={type.id}
                      className={`${styles.templateCard} ${newPageType === type.id ? styles.selected : ''}`}
                      onClick={() => setNewPageType(type.id)}
                    >
                      <div className={styles.templateIcon}>{type.icon}</div>
                      <div className={styles.templateName}>{type.name}</div>
                      <div className={styles.templateDesc}>{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowAddPageModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.createButton}
                onClick={handleAddPage}
                disabled={!newPageName.trim()}
              >
                Create Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSelector;
