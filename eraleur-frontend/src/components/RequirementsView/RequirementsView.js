import React, { useState } from 'react';
import UserFlowDiagram from '../UserFlowDiagram/UserFlowDiagram';
import styles from './RequirementsView.module.css';

/**
 * RequirementsView Component
 * Displays project requirements with user flow diagram and optional DDD view
 *
 * @param {Object} props
 * @param {Object} props.projectData - Project data from WebSocket
 * @param {string} props.connectionStatus - Current WebSocket connection status
 * @param {Function} props.onRefresh - Callback to refresh data from server
 */
const RequirementsView = ({
  projectData = {},
  connectionStatus = 'disconnected',
  onRefresh
}) => {
  const [showDDD, setShowDDD] = useState(false);

  const { project_name = '', requirements = '', ddd = '', frontend_data = {} } = projectData;

  // Get connection status indicator class
  const getConnectionClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return styles.connected;
      case 'connecting':
        return styles.connecting;
      case 'disconnected':
        return styles.disconnected;
      case 'error':
        return styles.error;
      default:
        return styles.disconnected;
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  // Parse requirements content to extract structured data for flow diagram
  const parseFlowData = () => {
    try {
      // Check if requirements is a JSON object (new format)
      if (typeof requirements === 'object' && requirements !== null) {
        return {
          project_name,
          requirements: requirements.requirements || [],
          features: requirements.features || [],
          user_flows: requirements.user_flows || [],
          pages: requirements.pages || []
        };
      }

      // If frontend_data has structured info, use it
      if (frontend_data.features || frontend_data.user_journey) {
        return {
          project_name,
          features: frontend_data.features || [],
          user_journey: frontend_data.user_journey || []
        };
      }

      // Otherwise, parse from requirements text (legacy string format)
      const features = [];
      const user_journey = [];

      // Simple parsing logic - you can enhance this
      const lines = requirements.split('\n');
      let currentSection = null;

      lines.forEach(line => {
        if (line.includes('##') && line.includes('Core Features')) {
          currentSection = 'features';
        } else if (line.match(/^\d+\.\s/)) {
          // Extract numbered features
          const match = line.match(/^\d+\.\s(.+)/);
          if (match && currentSection === 'features') {
            features.push({
              name: match[1].trim(),
              description: '',
              icon: '✨',
              priority: 'High'
            });
          }
        }
      });

      // Create basic user journey from features
      if (features.length > 0) {
        features.forEach((feature, idx) => {
          user_journey.push({
            title: feature.name,
            description: `User interacts with ${feature.name.toLowerCase()}`,
            components: []
          });
        });
      }

      return {
        project_name,
        features,
        user_journey
      };
    } catch (error) {
      console.error('Error parsing flow data:', error);
      return {
        project_name,
        requirements: [],
        features: [],
        user_flows: [],
        pages: []
      };
    }
  };

  const flowData = parseFlowData();

  return (
    <div className={styles.container}>
      {/* Modern Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.projectNameContainer}>
            <span className={styles.projectIcon}>🎯</span>
            <h1 className={styles.projectName}>
              {project_name || 'Eraleur Project'}
            </h1>
          </div>
          <div className={styles.headerTabs}>
            <button
              className={`${styles.tab} ${!showDDD ? styles.activeTab : ''}`}
              onClick={() => setShowDDD(false)}
            >
              <span>📊</span>
              <span>User Flow</span>
            </button>
            <button
              className={`${styles.tab} ${showDDD ? styles.activeTab : ''}`}
              onClick={() => setShowDDD(true)}
            >
              <span>🏗️</span>
              <span>Domain Design</span>
            </button>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Connection Status */}
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${getConnectionClass()}`}></span>
            <span className={styles.statusText}>{connectionStatus}</span>
          </div>

          {/* Refresh Button */}
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={connectionStatus !== 'connected'}
            title="Refresh requirements from server"
          >
            <svg
              className={styles.refreshIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {!showDDD ? (
          /* User Flow Diagram View */
          <div className={styles.flowView}>
            <UserFlowDiagram flowData={flowData} />
          </div>
        ) : (
          /* Domain Design View */
          <div className={styles.dddView}>
            <div className={styles.dddContainer}>
              <div className={styles.dddHeader}>
                <h2>
                  <span className={styles.dddIcon}>🏗️</span>
                  Domain-Driven Design
                </h2>
                <p className={styles.dddSubtitle}>
                  Technical architecture and domain model structure
                </p>
              </div>
              <div className={styles.dddContent}>
                {ddd ? (
                  <pre className={styles.codeBlock}>
                    {typeof ddd === 'object' ? JSON.stringify(ddd, null, 2) : ddd}
                  </pre>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏗️</div>
                    <p>No domain design available yet</p>
                    <p className={styles.emptyHint}>
                      Domain design will appear here once the project is initialized
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementsView;
