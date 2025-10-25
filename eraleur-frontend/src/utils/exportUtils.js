/**
 * Export Utilities
 * Functions for exporting canvas designs in various formats
 */

/**
 * Export canvas data as JSON
 * @param {Object} canvasData - Canvas data with components
 * @param {string} projectName - Project name
 * @returns {string} JSON string
 */
export const exportAsJSON = (canvasData, projectName) => {
  const exportData = {
    project: projectName,
    exportDate: new Date().toISOString(),
    canvas: canvasData.canvas,
    components: canvasData.components,
    version: '1.0.0'
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Download a file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export as React component code
 * @param {Object} canvasData - Canvas data
 * @param {string} componentName - Component name
 * @returns {string} React code
 */
export const exportAsReact = (canvasData, componentName = 'DesignCanvas') => {
  const { canvas, components } = canvasData;

  const renderComponent = (comp) => {
    const style = {
      position: 'absolute',
      left: `${comp.x}px`,
      top: `${comp.y}px`,
      width: `${comp.width}px`,
      height: `${comp.height}px`,
      backgroundColor: comp.backgroundColor,
      color: comp.textColor || '#000',
      border: `${comp.borderWidth}px solid ${comp.borderColor}`,
      borderRadius: `${comp.borderRadius}px`,
      fontSize: `${comp.fontSize}px`
    };

    const styleString = Object.entries(style)
      .map(([key, value]) => `${key}: '${value}'`)
      .join(', ');

    switch (comp.type) {
      case 'button':
        return `  <button style={{${styleString}}}>${comp.text}</button>`;
      case 'input':
        return `  <input placeholder="${comp.placeholder}" style={{${styleString}}} />`;
      case 'text':
        return `  <div style={{${styleString}}}>${comp.text}</div>`;
      case 'container':
        return `  <div style={{${styleString}}}></div>`;
      case 'image':
        return `  <div style={{${styleString}, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>📷 Image</div>`;
      default:
        return `  <div style={{${styleString}}}></div>`;
    }
  };

  const componentCode = `import React from 'react';

const ${componentName} = () => {
  return (
    <div style={{
      position: 'relative',
      width: '${canvas.width}px',
      height: '${canvas.height}px',
      backgroundColor: '${canvas.backgroundColor}',
      overflow: 'auto'
    }}>
${components.map(comp => renderComponent(comp)).join('\n')}
    </div>
  );
};

export default ${componentName};
`;

  return componentCode;
};

/**
 * Export as HTML/CSS
 * @param {Object} canvasData - Canvas data
 * @param {string} title - Page title
 * @returns {Object} {html, css} strings
 */
export const exportAsHTML = (canvasData, title = 'Design Export') => {
  const { canvas, components } = canvasData;

  const css = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.canvas {
  position: relative;
  width: ${canvas.width}px;
  height: ${canvas.height}px;
  background-color: ${canvas.backgroundColor};
  margin: 20px auto;
}

${components.map((comp, index) => `
.component-${index} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
  background-color: ${comp.backgroundColor};
  color: ${comp.textColor || '#000'};
  border: ${comp.borderWidth}px solid ${comp.borderColor};
  border-radius: ${comp.borderRadius}px;
  font-size: ${comp.fontSize}px;
  ${comp.type === 'image' ? 'display: flex; align-items: center; justify-content: center;' : ''}
}
`).join('')}
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  <div class="canvas">
${components.map((comp, index) => {
    switch (comp.type) {
      case 'button':
        return `    <button class="component-${index}">${comp.text}</button>`;
      case 'input':
        return `    <input class="component-${index}" placeholder="${comp.placeholder}" />`;
      case 'text':
        return `    <div class="component-${index}">${comp.text}</div>`;
      case 'container':
        return `    <div class="component-${index}"></div>`;
      case 'image':
        return `    <div class="component-${index}">📷 Image</div>`;
      default:
        return `    <div class="component-${index}"></div>`;
    }
  }).join('\n')}
  </div>
</body>
</html>
`;

  return { html, css };
};

/**
 * Export canvas as image (using canvas element)
 * @param {HTMLElement} canvasElement - Canvas DOM element
 * @param {string} filename - Output filename
 */
export const exportAsPNG = async (canvasElement, filename = 'design.png') => {
  try {
    // Use html2canvas or similar library
    // For now, we'll create a simple implementation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = canvasElement.offsetWidth;
    canvas.height = canvasElement.offsetHeight;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Note: Full implementation would require html2canvas library
    // This is a placeholder for the structure

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();

    return dataUrl;
  } catch (error) {
    console.error('Export as PNG failed:', error);
    throw error;
  }
};
