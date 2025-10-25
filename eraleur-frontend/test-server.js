const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('🚀 Test WebSocket Server running on ws://localhost:8080');

// Function to load canvas data from new_one
function loadCanvasData() {
  try {
    const canvasPath = path.join(__dirname, '..', 'projects', 'new_one', 'frontend_data.js');
    if (fs.existsSync(canvasPath)) {
      const canvasContent = fs.readFileSync(canvasPath, 'utf-8');
      const canvasData = JSON.parse(canvasContent);
      console.log(`✅ Loaded canvas data with ${canvasData.pages?.length || 0} pages`);
      return canvasData;
    } else {
      console.log('⚠️ Canvas data file not found at:', canvasPath);
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading canvas data:', error);
    return null;
  }
}

// Multi-Page Canvas Data for Phase 3
const pagesData = [
  {
    id: 'page_login',
    name: 'Login Page',
    icon: '🔐',
    canvas: {
      width: 1400,
      height: 900,
      backgroundColor: '#f5f7fa'
    },
    components: [
      {
        id: 'login_title',
        type: 'text',
        x: 550,
        y: 150,
        width: 300,
        height: 50,
        text: 'Welcome Back',
        fontSize: 36,
        textColor: '#333333',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0
      },
      {
        id: 'email_input',
        type: 'input',
        x: 500,
        y: 250,
        width: 400,
        height: 50,
        placeholder: 'Email address',
        fontSize: 16,
        textColor: '#333333',
        backgroundColor: '#ffffff',
        borderColor: '#dddddd',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        id: 'password_input',
        type: 'input',
        x: 500,
        y: 320,
        width: 400,
        height: 50,
        placeholder: 'Password',
        fontSize: 16,
        textColor: '#333333',
        backgroundColor: '#ffffff',
        borderColor: '#dddddd',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        id: 'login_button',
        type: 'button',
        x: 500,
        y: 400,
        width: 400,
        height: 50,
        text: 'Login to Dashboard',
        fontSize: 16,
        textColor: '#ffffff',
        backgroundColor: '#667eea',
        borderColor: '#5568d3',
        borderWidth: 0,
        borderRadius: 8,
        interaction: {
          action: 'navigate',
          targetPage: 'page_dashboard'
        }
      }
    ]
  },
  {
    id: 'page_dashboard',
    name: 'Admin Dashboard',
    icon: '📊',
    canvas: {
      width: 1400,
      height: 900,
      backgroundColor: '#ffffff'
    },
    components: [
      {
        id: 'dashboard_title',
        type: 'text',
        x: 50,
        y: 30,
        width: 300,
        height: 40,
        text: 'Admin Dashboard',
        fontSize: 28,
        textColor: '#333333',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0
      },
      {
        id: 'orders_card',
        type: 'container',
        x: 50,
        y: 100,
        width: 300,
        height: 150,
        backgroundColor: '#667eea',
        borderColor: '#667eea',
        borderWidth: 0,
        borderRadius: 12
      },
      {
        id: 'orders_text',
        type: 'text',
        x: 70,
        y: 120,
        width: 200,
        height: 30,
        text: '📦 Total Orders: 1,234',
        fontSize: 20,
        textColor: '#ffffff',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0
      },
      {
        id: 'orders_button',
        type: 'button',
        x: 70,
        y: 200,
        width: 150,
        height: 35,
        text: 'View Orders',
        fontSize: 14,
        textColor: '#667eea',
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 0,
        borderRadius: 6,
        interaction: {
          action: 'navigate',
          targetPage: 'page_orders'
        }
      },
      {
        id: 'users_card',
        type: 'container',
        x: 400,
        y: 100,
        width: 300,
        height: 150,
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        borderWidth: 0,
        borderRadius: 12
      },
      {
        id: 'users_text',
        type: 'text',
        x: 420,
        y: 120,
        width: 200,
        height: 30,
        text: '👥 Total Users: 5,678',
        fontSize: 20,
        textColor: '#ffffff',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0
      }
    ]
  },
  {
    id: 'page_orders',
    name: 'Orders',
    icon: '📦',
    canvas: {
      width: 1400,
      height: 900,
      backgroundColor: '#ffffff'
    },
    components: [
      {
        id: 'orders_title',
        type: 'text',
        x: 50,
        y: 30,
        width: 200,
        height: 40,
        text: 'Orders List',
        fontSize: 28,
        textColor: '#333333',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0
      },
      {
        id: 'back_button',
        type: 'button',
        x: 1200,
        y: 30,
        width: 150,
        height: 40,
        text: '← Back to Dashboard',
        fontSize: 14,
        textColor: '#667eea',
        backgroundColor: 'transparent',
        borderColor: '#667eea',
        borderWidth: 2,
        borderRadius: 6,
        interaction: {
          action: 'navigate',
          targetPage: 'page_dashboard'
        }
      },
      {
        id: 'order_1',
        type: 'container',
        x: 50,
        y: 100,
        width: 1300,
        height: 80,
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
        borderWidth: 1,
        borderRadius: 8
      },
      {
        id: 'order_1_text',
        type: 'text',
        x: 70,
        y: 120,
        width: 500,
        height: 30,
        text: 'Order #12345 - MacBook Pro - $2,499',
        fontSize: 16,
        textColor: '#333333',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0
      }
    ]
  }
];

let currentPages = JSON.parse(JSON.stringify(pagesData)); // Deep copy for modifications

// Sample data
const sampleData = {
  project_name: 'E-Commerce Platform',
  main: `// Main Requirements Document
// Project: E-Commerce Platform
// Last Updated: ${new Date().toLocaleString()}

## Core Features
1. User Authentication & Authorization
   - Email/password login
   - OAuth (Google, Facebook)
   - JWT token management
   - Role-based access control (Customer, Admin, Vendor)

2. Product Management
   - Product catalog with categories
   - Search and filtering
   - Product variations (size, color, etc.)
   - Inventory tracking
   - Image gallery support

3. Shopping Cart
   - Add/remove items
   - Quantity adjustment
   - Save for later
   - Cart persistence across sessions

4. Checkout Process
   - Shipping address management
   - Payment integration (Stripe, PayPal)
   - Order summary
   - Email confirmations

5. Order Management
   - Order history
   - Order tracking
   - Status updates
   - Return/refund processing

6. Admin Dashboard
   - Sales analytics
   - Product management
   - User management
   - Order processing`,

  ddd: `// Domain-Driven Design Document
// Project: E-Commerce Platform
// Last Updated: ${new Date().toLocaleString()}

## Bounded Contexts

### 1. Identity & Access Context
**Aggregates:**
- User (Root)
  - Email, Password, Roles
  - Authentication tokens
  - Profile information

**Domain Events:**
- UserRegistered
- UserLoggedIn
- PasswordChanged
- RoleAssigned

### 2. Catalog Context
**Aggregates:**
- Product (Root)
  - SKU, Name, Description
  - Price, Stock quantity
  - Category, Tags
  - Images, Variations

- Category (Root)
  - Name, Description
  - Parent category
  - Display order

**Domain Events:**
- ProductCreated
- ProductUpdated
- StockChanged
- ProductDiscontinued

### 3. Shopping Context
**Aggregates:**
- Cart (Root)
  - CartItems[]
  - User reference
  - Session ID
  - Expiration date

**Domain Events:**
- ItemAddedToCart
- ItemRemovedFromCart
- CartCleared
- CartCheckedOut

### 4. Order Context
**Aggregates:**
- Order (Root)
  - OrderNumber
  - OrderItems[]
  - Shipping address
  - Payment information
  - Status (Pending, Processing, Shipped, Delivered)

**Domain Events:**
- OrderPlaced
- OrderPaid
- OrderShipped
- OrderDelivered
- OrderCancelled

## Relationships
- User (Identity) -> Cart (Shopping)
- Cart (Shopping) -> Product (Catalog)
- Order (Order) -> User (Identity)
- Order (Order) -> Product (Catalog)`,

  frontend_data: {
    components: ['Header', 'ProductCard', 'ShoppingCart', 'Checkout'],
    routes: ['/', '/products', '/cart', '/checkout', '/orders', '/admin'],

    // Structured data for User Flow Diagram
    features: [
      {
        name: 'User Authentication & Authorization',
        description: 'Secure login system with email/password and OAuth integration. Role-based access control for customers, admins, and vendors.',
        icon: '🔐',
        priority: 'High'
      },
      {
        name: 'Product Management',
        description: 'Complete catalog system with search, filtering, categories, variations, and inventory tracking.',
        icon: '📦',
        priority: 'High'
      },
      {
        name: 'Shopping Cart',
        description: 'Add/remove items, adjust quantities, save for later with persistent cart across sessions.',
        icon: '🛒',
        priority: 'High'
      },
      {
        name: 'Checkout Process',
        description: 'Streamlined checkout with address management, payment integration (Stripe, PayPal), and email confirmations.',
        icon: '💳',
        priority: 'High'
      },
      {
        name: 'Order Management',
        description: 'Track orders, view history, manage status updates, and handle returns/refunds.',
        icon: '📋',
        priority: 'Medium'
      },
      {
        name: 'Admin Dashboard',
        description: 'Analytics, product management, user management, and order processing tools for administrators.',
        icon: '📊',
        priority: 'Medium'
      }
    ],

    user_journey: [
      {
        title: 'User Registration & Login',
        description: 'User creates an account or logs in using email/password or OAuth providers (Google, Facebook)',
        components: ['LoginForm', 'SignupForm', 'OAuthButtons', 'Header']
      },
      {
        title: 'Browse Products',
        description: 'User browses product catalog, uses search and filters to find desired items',
        components: ['ProductGrid', 'SearchBar', 'FilterPanel', 'CategoryNav']
      },
      {
        title: 'View Product Details',
        description: 'User clicks on a product to view detailed information, images, variations, and reviews',
        components: ['ProductDetails', 'ImageGallery', 'VariationSelector', 'ReviewsList']
      },
      {
        title: 'Add to Cart',
        description: 'User selects variations and quantity, then adds product to shopping cart',
        components: ['AddToCartButton', 'QuantitySelector', 'VariationPicker', 'CartIcon']
      },
      {
        title: 'Review Cart',
        description: 'User reviews cart contents, adjusts quantities, applies discount codes, and proceeds to checkout',
        components: ['ShoppingCart', 'CartItem', 'DiscountCodeInput', 'CheckoutButton']
      },
      {
        title: 'Checkout',
        description: 'User enters shipping address, selects shipping method, and provides payment information',
        components: ['CheckoutForm', 'AddressInput', 'PaymentMethod', 'OrderSummary']
      },
      {
        title: 'Order Confirmation',
        description: 'User receives order confirmation with order number and estimated delivery date',
        components: ['OrderConfirmation', 'OrderSummary', 'EmailConfirmation']
      },
      {
        title: 'Track Order',
        description: 'User can track order status and view shipping updates in their account',
        components: ['OrderHistory', 'OrderTracking', 'StatusTimeline', 'AccountDashboard']
      }
    ]
  }
};

// Handle client connections
wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  // Send project initialization message
  setTimeout(() => {
    const initMessage = {
      type: 'project_initialized',
      data: sampleData
    };
    ws.send(JSON.stringify(initMessage));
    console.log('📤 Sent: project_initialized');
  }, 1000);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log('📥 Received:', parsed.type);

      // Handle different message types
      switch (parsed.type) {
        case 'client_ready':
          console.log('✅ Client is ready');
          break;

        case 'request_files':
          // Update timestamps and send updated files
          const updatedData = {
            ...sampleData,
            main: sampleData.main.replace(
              /Last Updated: .*/,
              `Last Updated: ${new Date().toLocaleString()}`
            ),
            ddd: sampleData.ddd.replace(
              /Last Updated: .*/,
              `Last Updated: ${new Date().toLocaleString()}`
            )
          };

          const updateMessage = {
            type: 'files_updated',
            data: updatedData
          };
          ws.send(JSON.stringify(updateMessage));
          console.log('📤 Sent: files_updated');
          break;

        case 'request_canvas_mode':
          // Load canvas data from demo_project
          const loadedCanvasData = loadCanvasData();

          if (loadedCanvasData && loadedCanvasData.components) {
            // Send canvas data directly (not multi-page)
            const canvasMessage = {
              type: 'canvas_mode_ready',
              data: {
                project_name: parsed.data?.project_name || 'demo_project',
                canvas_data: loadedCanvasData
              }
            };
            ws.send(JSON.stringify(canvasMessage));
            console.log('📤 Sent: canvas_mode_ready with', loadedCanvasData.components.length, 'components from demo_project');
          } else {
            // Fallback to multi-page data for Phase 3
            const canvasMessage = {
              type: 'canvas_mode_ready',
              data: {
                project_name: parsed.data?.project_name || 'E-Commerce Platform',
                pages: currentPages,
                currentPageId: currentPages[0]?.id || 'page_login'
              }
            };
            ws.send(JSON.stringify(canvasMessage));
            console.log('📤 Sent: canvas_mode_ready with', currentPages.length, 'pages (fallback)');
          }
          break;

        case 'canvas_edit':
          // Handle canvas edits from client
          console.log('✏️  Canvas edit:', parsed.data);

          const pageId = parsed.data?.pageId;
          const page = currentPages.find(p => p.id === pageId);

          if (page) {
            if (parsed.data?.action === 'add_component') {
              page.components.push(parsed.data.component);
            } else if (parsed.data?.action === 'update_component') {
              const index = page.components.findIndex(
                c => c.id === parsed.data.component_id
              );
              if (index !== -1) {
                page.components[index] = {
                  ...page.components[index],
                  ...parsed.data.updates
                };
              }
            } else if (parsed.data?.action === 'delete_component') {
              page.components = page.components.filter(
                c => c.id !== parsed.data.component_id
              );
              console.log('🗑️  Component deleted:', parsed.data.component_id);
            }
          }

          // Send confirmation
          const confirmMessage = {
            type: 'canvas_updated',
            data: {
              pages: currentPages,
              timestamp: new Date().toISOString()
            }
          };
          ws.send(JSON.stringify(confirmMessage));
          console.log('📤 Sent: canvas_updated');
          break;

        case 'page_add':
          // Add new page
          const newPage = {
            id: `page_${Date.now()}`,
            name: parsed.data.name || 'New Page',
            icon: parsed.data.icon || '📄',
            canvas: { width: 1400, height: 900, backgroundColor: '#ffffff' },
            components: []
          };
          currentPages.push(newPage);
          ws.send(JSON.stringify({
            type: 'pages_updated',
            data: { pages: currentPages, newPageId: newPage.id }
          }));
          console.log('📄 New page added:', newPage.name);
          break;

        case 'page_delete':
          // Delete page
          if (currentPages.length > 1) {
            currentPages = currentPages.filter(p => p.id !== parsed.data.pageId);
            ws.send(JSON.stringify({
              type: 'pages_updated',
              data: { pages: currentPages }
            }));
            console.log('🗑️  Page deleted:', parsed.data.pageId);
          }
          break;

        case 'page_rename':
          // Rename page
          const pageToRename = currentPages.find(p => p.id === parsed.data.pageId);
          if (pageToRename) {
            pageToRename.name = parsed.data.newName;
            ws.send(JSON.stringify({
              type: 'pages_updated',
              data: { pages: currentPages }
            }));
            console.log('✏️  Page renamed:', parsed.data.newName);
          }
          break;

        case 'page_duplicate':
          // Duplicate page
          const pageToDuplicate = currentPages.find(p => p.id === parsed.data.pageId);
          if (pageToDuplicate) {
            const duplicatedPage = JSON.parse(JSON.stringify(pageToDuplicate));
            duplicatedPage.id = `page_${Date.now()}`;
            duplicatedPage.name = `${pageToDuplicate.name} (Copy)`;
            currentPages.push(duplicatedPage);
            ws.send(JSON.stringify({
              type: 'pages_updated',
              data: { pages: currentPages, newPageId: duplicatedPage.id }
            }));
            console.log('📋 Page duplicated:', duplicatedPage.name);
          }
          break;

        default:
          console.log('⚠️  Unknown message type:', parsed.type);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  // Simulate periodic file updates (every 10 seconds)
  const updateInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const timestamp = new Date().toLocaleString();
      const simulatedUpdate = {
        type: 'files_updated',
        data: {
          ...sampleData,
          main: sampleData.main.replace(
            /Last Updated: .*/,
            `Last Updated: ${timestamp}`
          ) + `\n\n// Auto-update at ${timestamp}`,
          ddd: sampleData.ddd.replace(
            /Last Updated: .*/,
            `Last Updated: ${timestamp}`
          ) + `\n\n// Auto-update at ${timestamp}`
        }
      };
      ws.send(JSON.stringify(simulatedUpdate));
      console.log('📤 Sent: automatic files_updated');
    }
  }, 10000);

  // Handle client disconnect
  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clearInterval(updateInterval);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clearInterval(updateInterval);
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('❌ Server error:', error);
});

console.log('📡 Waiting for client connections...');
console.log('💡 Test the connection at http://localhost:3000');
