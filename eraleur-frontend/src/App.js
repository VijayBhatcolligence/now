import React, { useState, useEffect, useCallback } from 'react';
import useWebSocket from './hooks/useWebSocket';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import RequirementsView from './components/RequirementsView/RequirementsView';
import ModeToggle from './components/ModeToggle/ModeToggle';
import Toolbar from './components/Toolbar/Toolbar';
import DesignCanvas from './components/DesignCanvas/DesignCanvas';
import PropertyPanel from './components/PropertyPanel/PropertyPanel';
import PageSelector from './components/PageSelector/PageSelector';
import InteractionEditor from './components/InteractionEditor/InteractionEditor';
import styles from './styles/App.module.css';

/**
 * Main App Component
 * Manages application state and mode switching
 *
 * Modes:
 * - 'loading': Initial connection state
 * - 'requirements': Display requirements view
 * - 'canvas': Figma-like design mode (Phase 2)
 */
function App() {
  // Application mode state
  const [currentMode, setCurrentMode] = useState('loading');

  // Project name state
  const [projectName, setProjectName] = useState('');

  // Multi-page state (Phase 3)
  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showInteractionEditor, setShowInteractionEditor] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  // Canvas state (kept for backward compatibility)
  const [canvasData, setCanvasData] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  // WebSocket connection hook
  const {
    connectionStatus,
    projectData,
    sendMessage,
    lastMessage,
    reconnect
  } = useWebSocket('ws://localhost:8080');

  /**
   * Handle refresh button click
   * Sends request_files message to server
   */
  const handleRefresh = useCallback(() => {
    console.log('🔄 Refresh requested');
    sendMessage('request_files', {
      project_name: projectData.project_name || 'current_project'
    });
  }, [sendMessage, projectData.project_name]);

  /**
   * Handle mode toggle between requirements and canvas
   */
  const handleModeToggle = useCallback((mode) => {
    console.log(`🔀 Switching to ${mode} mode`);
    console.log(`📊 Current pages.length: ${pages.length}`);
    console.log(`📊 Project name: ${projectData.project_name}`);
    setCurrentMode(mode);

    // Request canvas data when switching to canvas mode
    if (mode === 'canvas' && pages.length === 0) {
      console.log('📤 Sending request_canvas_mode message');
      sendMessage('request_canvas_mode', {
        project_name: projectData.project_name || 'current_project'
      });
    } else if (mode === 'canvas' && pages.length > 0) {
      console.log('✅ Already have pages data, not requesting');
    }
  }, [pages.length, projectData.project_name, sendMessage]);

  /**
   * Page Management Functions (Phase 3)
   */
  const handlePageChange = useCallback((pageId) => {
    console.log('📄 Switching to page:', pageId);
    setCurrentPageId(pageId);
    setSelectedComponent(null);
  }, []);

  const handleAddPage = useCallback((pageData) => {
    console.log('➕ Adding new page:', pageData);
    sendMessage('page_add', pageData);
  }, [sendMessage]);

  const handleRenamePage = useCallback((pageId, newName) => {
    console.log('✏️ Renaming page:', pageId, 'to', newName);
    sendMessage('page_rename', { pageId, newName });
  }, [sendMessage]);

  const handleDeletePage = useCallback((pageId) => {
    console.log('🗑️ Deleting page:', pageId);
    if (pages.length > 1) {
      sendMessage('page_delete', { pageId });
    }
  }, [pages.length, sendMessage]);

  const handleDuplicatePage = useCallback((pageId) => {
    console.log('📋 Duplicating page:', pageId);
    sendMessage('page_duplicate', { pageId });
  }, [sendMessage]);

  /**
   * Interaction Management (Phase 3)
   */
  const handleAddInteraction = useCallback((component) => {
    setEditingComponent(component);
    setShowInteractionEditor(true);
  }, []);

  const handleSaveInteraction = useCallback((interaction) => {
    console.log('💾 Saving interaction:', interaction);
    setInteractions(prev => [...prev.filter(i => i.componentId !== interaction.componentId), interaction]);
    sendMessage('interaction_add', interaction);
    setShowInteractionEditor(false);
  }, [sendMessage]);

  /**
   * Handle adding new component to canvas
   */
  const handleAddComponent = useCallback(() => {
    if (!currentPageId) return;

    const newComponent = {
      id: `component_${Date.now()}`,
      type: 'button',
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      text: 'New Button',
      fontSize: 14,
      textColor: '#ffffff',
      backgroundColor: '#667eea',
      borderColor: '#5568d3',
      borderWidth: 1,
      borderRadius: 6
    };

    // Update local state (handle pages without components array)
    setPages(prev => prev.map(page =>
      page.id === currentPageId
        ? { ...page, components: [...(page.components || []), newComponent] }
        : page
    ));

    // Send update to server
    setSaveStatus('saving');
    sendMessage('canvas_edit', {
      project_name: projectData.project_name,
      pageId: currentPageId,
      action: 'add_component',
      component: newComponent
    });

    setTimeout(() => setSaveStatus('saved'), 500);
  }, [currentPageId, projectData.project_name, sendMessage]);

  /**
   * Handle component property updates
   */
  const handleComponentUpdate = useCallback((componentId, updates) => {
    if (!currentPageId) return;

    // Update local state (handle pages without components array)
    setPages(prev => prev.map(page =>
      page.id === currentPageId
        ? {
            ...page,
            components: (page.components || []).map(comp =>
              comp.id === componentId ? { ...comp, ...updates } : comp
            )
          }
        : page
    ));

    // Send update to server
    setSaveStatus('saving');
    sendMessage('canvas_edit', {
      project_name: projectData.project_name,
      pageId: currentPageId,
      action: 'update_component',
      component_id: componentId,
      updates
    });

    setTimeout(() => setSaveStatus('saved'), 500);
  }, [currentPageId, projectData.project_name, sendMessage]);

  /**
   * Handle component selection
   */
  const handleComponentSelect = useCallback((component) => {
    setSelectedComponent(component);
  }, []);

  /**
   * Handle component deletion
   */
  const handleComponentDelete = useCallback((componentId) => {
    if (!currentPageId) return;

    console.log('🗑️ Deleting component:', componentId);

    // Update local state (handle pages without components array)
    setPages(prev => prev.map(page =>
      page.id === currentPageId
        ? { ...page, components: (page.components || []).filter(comp => comp.id !== componentId) }
        : page
    ));

    // Clear selection if deleted component was selected
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }

    // Send delete to server
    setSaveStatus('saving');
    sendMessage('canvas_edit', {
      project_name: projectData.project_name,
      pageId: currentPageId,
      action: 'delete_component',
      component_id: componentId
    });

    setTimeout(() => setSaveStatus('saved'), 500);
  }, [currentPageId, selectedComponent, projectData.project_name, sendMessage]);

  /**
   * Effect: Handle mode switching based on connection status and messages
   */
  useEffect(() => {
    // When connected and project is initialized, switch to requirements mode
    if (connectionStatus === 'connected' && projectData.project_name) {
      setCurrentMode('requirements');
      setProjectName(projectData.project_name);
    }

    // When disconnected or error, show loading screen
    if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      // Only switch to loading if we haven't loaded project data yet
      if (!projectData.project_name) {
        setCurrentMode('loading');
      }
    }

    // When connecting, show loading screen
    if (connectionStatus === 'connecting' && !projectData.project_name) {
      setCurrentMode('loading');
    }
  }, [connectionStatus, projectData.project_name]);

  /**
   * Effect: Handle special message types for mode switching
   */
  useEffect(() => {
    if (!lastMessage) return;

    console.log('🔍 App.js received message:', lastMessage.type, lastMessage.data);

    switch (lastMessage.type) {
      case 'switch_to_figma_mode':
      case 'canvas_mode_ready':
        // Phase 3: Switch to canvas mode with multi-page support
        console.log('🎨 Switching to canvas mode (Phase 3)');
        console.log('📦 Message data structure:', JSON.stringify(lastMessage.data, null, 2));
        setCurrentMode('canvas');

        if (lastMessage.data?.pages) {
          // Multi-page data (Phase 3)
          console.log('📄 Received', lastMessage.data.pages.length, 'pages');
          console.log('📄 First page:', lastMessage.data.pages[0]);
          setPages(lastMessage.data.pages);
          setCurrentPageId(lastMessage.data.currentPageId || lastMessage.data.pages[0]?.id);
        } else if (lastMessage.data?.canvas_data) {
          // Legacy single canvas (Phase 2 backward compatibility)
          console.log('📄 Using legacy canvas_data');
          setCanvasData(lastMessage.data.canvas_data);
        } else {
          console.error('❌ No pages or canvas_data in message!');
        }
        break;

      case 'project_initialized':
        console.log('✅ Project initialized, switching to requirements mode');
        setCurrentMode('requirements');
        setProjectName(lastMessage.data.project_name);
        break;

      case 'project_deleted':
        console.log('🗑️ Project deleted:', lastMessage.data.project_name);
        // Clear all project-related state
        setProjectName('');
        setPages([]);
        setCurrentPageId(null);
        setCanvasData(null);
        setSelectedComponent(null);
        setInteractions([]);
        // Switch back to loading mode to show "no project" state
        setCurrentMode('loading');
        break;

      case 'canvas_updated':
        // Update canvas/pages from server
        if (lastMessage.data?.pages) {
          console.log('📥 Received pages update');
          setPages(lastMessage.data.pages);
          setSaveStatus('saved');
        } else if (lastMessage.data?.canvas_data) {
          console.log('📥 Received canvas_updated with', lastMessage.data.canvas_data.components.length, 'components');
          setCanvasData(lastMessage.data.canvas_data);
          setSaveStatus('saved');
        }
        break;

      case 'page_added':
      case 'page_deleted':
      case 'page_renamed':
      case 'page_duplicated':
        // Page management responses
        if (lastMessage.data?.pages) {
          setPages(lastMessage.data.pages);
          if (lastMessage.data?.currentPageId) {
            setCurrentPageId(lastMessage.data.currentPageId);
          }
        }
        break;

      default:
        // No action needed for other message types
        break;
    }
  }, [lastMessage]);

  /**
   * Render appropriate component based on current mode
   */
  const renderContent = () => {
    switch (currentMode) {
      case 'loading':
        return (
          <LoadingSpinner
            status={getLoadingMessage()}
            connectionState={connectionStatus}
          />
        );

      case 'requirements':
        return (
          <div className={styles.appContainer}>
            <ModeToggle
              currentMode={currentMode}
              onModeChange={handleModeToggle}
            />
            <RequirementsView
              projectData={projectData}
              connectionStatus={connectionStatus}
              onRefresh={handleRefresh}
            />
          </div>
        );

      case 'canvas':
        // Phase 3: Canvas mode with multi-page support
        const currentPage = pages.find(p => p.id === currentPageId);
        const currentCanvas = currentPage ? {
          ...currentPage.canvas,
          components: currentPage.components || []
        } : canvasData; // Fallback to legacy canvasData

        return (
          <div className={styles.appContainer}>
            <ModeToggle
              currentMode={currentMode}
              onModeChange={handleModeToggle}
            />
            <div className={styles.topBar}>
              {pages.length > 0 && (
                <PageSelector
                  pages={pages}
                  currentPageId={currentPageId}
                  onPageChange={handlePageChange}
                  onAddPage={handleAddPage}
                  onRenamePage={handleRenamePage}
                  onDeletePage={handleDeletePage}
                  onDuplicatePage={handleDuplicatePage}
                />
              )}
              <Toolbar
                onAddComponent={handleAddComponent}
                zoom={zoom}
                onZoomChange={setZoom}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
                saveStatus={saveStatus}
                isPreviewMode={isPreviewMode}
                onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
              />
            </div>
            <div className={styles.canvasWorkspace}>
              <DesignCanvas
                canvasData={currentCanvas}
                selectedComponent={selectedComponent}
                onComponentSelect={handleComponentSelect}
                onComponentUpdate={handleComponentUpdate}
                onComponentClick={isPreviewMode ? (comp) => {
                  const interaction = interactions.find(i => i.componentId === comp.id);
                  if (interaction?.type === 'navigate') {
                    handlePageChange(interaction.targetPage);
                  }
                } : undefined}
                zoom={zoom}
                showGrid={showGrid}
                isPreviewMode={isPreviewMode}
              />
              <PropertyPanel
                selectedComponent={selectedComponent}
                onPropertyChange={handleComponentUpdate}
                onDeleteComponent={handleComponentDelete}
                onAddInteraction={handleAddInteraction}
              />
            </div>
            {showInteractionEditor && editingComponent && (
              <InteractionEditor
                component={editingComponent}
                pages={pages}
                onSaveInteraction={handleSaveInteraction}
                onClose={() => setShowInteractionEditor(false)}
              />
            )}
          </div>
        );

      default:
        return (
          <LoadingSpinner
            status="Unknown mode"
            connectionState="error"
          />
        );
    }
  };

  /**
   * Get appropriate loading message based on connection status
   */
  const getLoadingMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to server...';
      case 'connected':
        return 'Waiting for project data...';
      case 'disconnected':
        return 'Disconnected from server. Attempting to reconnect...';
      case 'error':
        return 'Connection error. Please check if the server is running.';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className={styles.app}>
      {renderContent()}

      {/* Error recovery option */}
      {connectionStatus === 'error' && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorCard}>
            <h2>⚠️ Connection Error</h2>
            <p>Unable to connect to the WebSocket server.</p>
            <p className={styles.errorHint}>
              Make sure the server is running on <code>ws://localhost:8080</code>
            </p>
            <button onClick={reconnect} className={styles.reconnectButton}>
              🔄 Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
