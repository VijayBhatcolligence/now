/**
 * Component Templates
 * Predefined component templates for quick canvas additions
 */

export const componentTemplates = {
  button: [
    {
      id: 'primary-button',
      name: 'Primary Button',
      description: 'Main action button with solid background',
      properties: {
        width: 120,
        height: 40,
        text: 'Click Me',
        backgroundColor: '#667eea',
        textColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#5568d3',
        fontSize: 14
      }
    },
    {
      id: 'secondary-button',
      name: 'Secondary Button',
      description: 'Secondary action with outline style',
      properties: {
        width: 120,
        height: 40,
        text: 'Cancel',
        backgroundColor: 'transparent',
        textColor: '#6c757d',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#6c757d',
        fontSize: 14
      }
    },
    {
      id: 'success-button',
      name: 'Success Button',
      description: 'Success action button',
      properties: {
        width: 120,
        height: 40,
        text: 'Success',
        backgroundColor: '#28a745',
        textColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#28a745',
        fontSize: 14
      }
    },
    {
      id: 'danger-button',
      name: 'Danger Button',
      description: 'Destructive action button',
      properties: {
        width: 120,
        height: 40,
        text: 'Delete',
        backgroundColor: '#dc3545',
        textColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dc3545',
        fontSize: 14
      }
    }
  ],
  input: [
    {
      id: 'text-input',
      name: 'Text Input',
      description: 'Standard text input field',
      properties: {
        width: 240,
        height: 40,
        placeholder: 'Enter text...',
        backgroundColor: '#ffffff',
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 4,
        fontSize: 14,
        textColor: '#333333'
      }
    },
    {
      id: 'email-input',
      name: 'Email Input',
      description: 'Email input field',
      properties: {
        width: 260,
        height: 40,
        placeholder: 'email@example.com',
        backgroundColor: '#ffffff',
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 4,
        fontSize: 14,
        textColor: '#333333'
      }
    },
    {
      id: 'search-input',
      name: 'Search Input',
      description: 'Search box with rounded style',
      properties: {
        width: 300,
        height: 44,
        placeholder: '🔍 Search...',
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
        borderWidth: 1,
        borderRadius: 22,
        fontSize: 14,
        textColor: '#333333'
      }
    }
  ],
  text: [
    {
      id: 'heading-h1',
      name: 'Main Heading (H1)',
      description: 'Large main heading',
      properties: {
        width: 300,
        height: 40,
        text: 'Main Heading',
        fontSize: 32,
        textColor: '#212529',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0
      }
    },
    {
      id: 'heading-h2',
      name: 'Sub Heading (H2)',
      description: 'Section heading',
      properties: {
        width: 250,
        height: 32,
        text: 'Section Title',
        fontSize: 24,
        textColor: '#333333',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0
      }
    },
    {
      id: 'body-text',
      name: 'Body Text',
      description: 'Regular paragraph text',
      properties: {
        width: 400,
        height: 24,
        text: 'This is body text content',
        fontSize: 16,
        textColor: '#666666',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0
      }
    },
    {
      id: 'label-text',
      name: 'Label Text',
      description: 'Small label or caption',
      properties: {
        width: 200,
        height: 20,
        text: 'Label',
        fontSize: 12,
        textColor: '#999999',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0
      }
    }
  ],
  container: [
    {
      id: 'card-container',
      name: 'Card Container',
      description: 'Card-style container with shadow',
      properties: {
        width: 320,
        height: 200,
        backgroundColor: '#ffffff',
        borderColor: '#e9ecef',
        borderWidth: 1,
        borderRadius: 8
      }
    },
    {
      id: 'panel-container',
      name: 'Panel Container',
      description: 'Flat panel background',
      properties: {
        width: 400,
        height: 300,
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 4
      }
    },
    {
      id: 'section-container',
      name: 'Section Container',
      description: 'Large section wrapper',
      properties: {
        width: 600,
        height: 400,
        backgroundColor: 'transparent',
        borderColor: '#dddddd',
        borderWidth: 2,
        borderRadius: 0
      }
    }
  ],
  image: [
    {
      id: 'square-image',
      name: 'Square Image',
      description: 'Square image placeholder',
      properties: {
        width: 200,
        height: 200,
        backgroundColor: '#e9ecef',
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 4
      }
    },
    {
      id: 'avatar-image',
      name: 'Avatar Image',
      description: 'Circular avatar',
      properties: {
        width: 80,
        height: 80,
        backgroundColor: '#dee2e6',
        borderColor: '#ced4da',
        borderWidth: 2,
        borderRadius: 40
      }
    },
    {
      id: 'banner-image',
      name: 'Banner Image',
      description: 'Wide banner placeholder',
      properties: {
        width: 600,
        height: 200,
        backgroundColor: '#e9ecef',
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 8
      }
    }
  ]
};

/**
 * Create a component from a template
 * @param {string} templateId - Template ID
 * @param {string} componentType - Component type (button, input, etc.)
 * @param {Object} position - {x, y} position
 * @returns {Object} New component object
 */
export const createComponentFromTemplate = (templateId, componentType, position) => {
  const templates = componentTemplates[componentType];
  if (!templates) return null;

  const template = templates.find(t => t.id === templateId);
  if (!template) return null;

  return {
    id: `component_${Date.now()}`,
    type: componentType,
    x: position.x,
    y: position.y,
    ...template.properties
  };
};

/**
 * Get all templates for a specific component type
 * @param {string} componentType - Component type
 * @returns {Array} Array of templates
 */
export const getTemplatesByType = (componentType) => {
  return componentTemplates[componentType] || [];
};

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @param {string} componentType - Component type
 * @returns {Object|null} Template object or null
 */
export const getTemplateById = (templateId, componentType) => {
  const templates = componentTemplates[componentType];
  if (!templates) return null;
  return templates.find(t => t.id === templateId) || null;
};
