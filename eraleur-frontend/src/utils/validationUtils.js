/**
 * Validation Utilities
 * Input validation and data sanitization
 */

/**
 * Validate component properties
 * @param {Object} component - Component object
 * @returns {Object} {isValid, errors}
 */
export const validateComponent = (component) => {
  const errors = [];

  // Required fields
  if (!component.id) errors.push('Component ID is required');
  if (!component.type) errors.push('Component type is required');

  // Position validation
  if (typeof component.x !== 'number' || component.x < 0) {
    errors.push('X position must be a non-negative number');
  }
  if (typeof component.y !== 'number' || component.y < 0) {
    errors.push('Y position must be a non-negative number');
  }

  // Size validation
  if (typeof component.width !== 'number' || component.width < 10) {
    errors.push('Width must be at least 10px');
  }
  if (typeof component.height !== 'number' || component.height < 10) {
    errors.push('Height must be at least 10px');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate page data
 * @param {Object} page - Page object
 * @returns {Object} {isValid, errors}
 */
export const validatePage = (page) => {
  const errors = [];

  if (!page.id) errors.push('Page ID is required');
  if (!page.name || page.name.trim() === '') errors.push('Page name is required');
  if (!Array.isArray(page.components)) errors.push('Components must be an array');

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize text input
 * @param {string} text - Input text
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/<script[^>]*>.*?<\/script>/gi, '').trim();
};

/**
 * Validate color format
 * @param {string} color - Color string
 * @returns {boolean} Is valid
 */
export const isValidColor = (color) => {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;

  return hexPattern.test(color) || rgbPattern.test(color) || rgbaPattern.test(color) || color === 'transparent';
};

/**
 * Validate interaction target
 * @param {Object} interaction - Interaction object
 * @param {Array} pages - Available pages
 * @returns {Object} {isValid, errors}
 */
export const validateInteraction = (interaction, pages) => {
  const errors = [];

  if (!interaction.action) errors.push('Interaction action is required');

  if (interaction.action === 'navigate' && !interaction.targetPage) {
    errors.push('Target page is required for navigation');
  }

  if (interaction.action === 'navigate' && interaction.targetPage) {
    const pageExists = pages.some(p => p.id === interaction.targetPage);
    if (!pageExists) errors.push('Target page does not exist');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
