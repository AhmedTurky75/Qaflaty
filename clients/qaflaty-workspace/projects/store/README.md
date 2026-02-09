# Qaflaty Store - Customer Storefront Application

This is the customer-facing storefront application for the Qaflaty multi-tenant e-commerce platform. Each store has its own branded storefront accessible via subdomain (e.g., `mystore.qaflaty.com`) or custom domain.

## Features

### 1. Tenant Detection and Theming
- Automatic store detection from subdomain or custom domain
- Dynamic theming with store's primary color
- Store branding (logo, name, colors)
- Real-time theme application

### 2. Home Page
- Hero section with store name and description
- Featured/New products section
- Categories navigation
- Responsive design

### 3. Product Catalog
- Product listing with grid layout
- Category filtering
- Search functionality
- Sort options (name, price, newest)
- Pagination
- Product cards with:
  - Product images
  - Name and price
  - Discount badge
  - Stock status

### 4. Product Detail Page
- Image gallery with thumbnails
- Product information (name, price, description)
- Discount badge and savings display
- Stock status indicator
- Quantity selector
- Add to Cart button
- SKU display
- Category breadcrumb

### 5. Shopping Cart
- Cart sidebar with slide-in animation
- Item management:
  - Quantity adjustment
  - Remove items
  - Product thumbnails
- Price breakdown:
  - Subtotal
  - Delivery fee
  - Total
- Free delivery threshold indicator
- Persistent cart (localStorage)
- Real-time cart count badge

### 6. Checkout Flow
- Customer information form:
  - Full name (required)
  - Phone number (required)
  - Email (optional)
- Delivery address form:
  - Street address (required)
  - City (required)
  - District (optional)
  - Additional instructions (optional)
- Payment method selection:
  - Cash on Delivery
  - Card (coming soon)
- Order notes
- Order summary with pricing
- Form validation

### 7. Order Confirmation
- Success message with order number
- Order details summary
- Next steps information
- Track order link
- Return to store button

### 8. Order Tracking
- Order number search
- Order status timeline
- Order items list
- Delivery information
- Payment status
- Pricing summary

### 9. Layout & Navigation
- Responsive header with:
  - Store logo and name
  - Categories menu
  - Search bar
  - Cart icon with count
- Footer with store contact info
- Mobile-friendly navigation
- Sticky header

## Technology Stack

- **Angular 19**: Modern Angular with standalone components
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first styling with dynamic theming
- **RxJS**: Reactive state management
- **Signals**: Angular's reactive primitives
- **HttpClient**: API communication

## Project Structure

```
src/app/
├── models/               # TypeScript interfaces and enums
│   ├── store.model.ts
│   ├── product.model.ts
│   ├── category.model.ts
│   ├── cart.model.ts
│   └── order.model.ts
├── services/             # Business logic and API calls
│   ├── store.service.ts  # Store detection and info
│   ├── theme.service.ts  # Dynamic theming
│   ├── cart.service.ts   # Cart management
│   ├── product.service.ts
│   ├── category.service.ts
│   └── order.service.ts
├── components/           # Reusable components
│   ├── layout/
│   │   ├── header.component.ts
│   │   └── footer.component.ts
│   └── shared/
│       └── cart-sidebar.component.ts
├── pages/                # Route components
│   ├── home/
│   ├── products/
│   ├── checkout/
│   └── orders/
├── app.ts                # Root component
├── app.routes.ts         # Route configuration
└── app.config.ts         # App configuration
```

## Key Services

### StoreService
- Detects store from subdomain/custom domain
- Loads store information
- Provides store context throughout the app

### ThemeService
- Applies dynamic theming based on store branding
- Updates CSS custom properties
- Updates page title and favicon

### CartService
- Manages cart state using signals
- Persists cart to localStorage
- Calculates totals and delivery fees
- Handles free delivery threshold

### ProductService
- Fetches products with filtering and pagination
- Gets product details by slug
- Supports search and sorting

### OrderService
- Places orders
- Tracks order status

## API Endpoints

All endpoints use the store context (X-Store-Slug or X-Custom-Domain header):

- `GET /api/storefront/store` - Get store information
- `GET /api/storefront/categories` - List categories
- `GET /api/storefront/products` - List products (with filters)
- `GET /api/storefront/products/{slug}` - Get product details
- `POST /api/storefront/orders` - Place order
- `GET /api/storefront/orders/track/{orderNumber}` - Track order

## Development

### Prerequisites
- Node.js 18+ and npm
- .NET 10 SDK (for backend API)

### Setup

1. Install dependencies:
```bash
cd clients/qaflaty-workspace
npm install
```

2. Start the development server:
```bash
npm run start:store
```

3. Set development store slug (in browser console):
```javascript
localStorage.setItem('dev-store-slug', 'demo-store');
```

4. Access the app:
```
http://localhost:4200
```

### Building for Production

```bash
npm run build:store
```

## Configuration

### Environment Variables

**Development** (`environment.ts`):
- `production: false`
- `apiUrl: 'http://localhost:5000/api'`

**Production** (`environment.prod.ts`):
- `production: true`
- `apiUrl: 'https://api.qaflaty.com'`

### Tenant Detection

In development:
- Uses `dev-store-slug` from localStorage
- Fallback to 'demo-store'

In production:
- Extracts subdomain from URL (e.g., `mystore.qaflaty.com` → `mystore`)
- Supports custom domains via X-Custom-Domain header

## Dynamic Theming

The app supports dynamic theming through CSS custom properties:

```scss
:root {
  --primary-color: #3B82F6;        // Set from store branding
  --primary-light: #60A5FA;
  --primary-dark: #2563EB;
  --primary-hover: #2563EB;
}
```

Classes:
- `.bg-primary` - Primary background
- `.text-primary` - Primary text
- `.border-primary` - Primary border
- `.hover:bg-primary-dark` - Primary hover state

## State Management

### Cart State
- Uses Angular Signals for reactivity
- Persists to localStorage
- Computed values:
  - Item count
  - Subtotal
  - Delivery fee
  - Total
  - Free delivery status

### Store State
- Loaded on app initialization
- Shared across components via signals
- Used for theming and branding

## Responsive Design

Mobile-first approach with breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

All pages are fully responsive:
- Mobile menu for navigation
- Stacked layouts on mobile
- Grid layouts on desktop
- Touch-friendly UI elements

## Best Practices

### Performance
- Lazy loading for route components
- OnPush change detection where possible
- Optimized images
- Pagination for large lists

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management

### SEO
- Server-side rendering support
- Meta tags
- Structured data
- Clean URLs

### UX
- Loading states
- Error handling
- Form validation
- Success feedback
- Empty states

## Future Enhancements

- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Advanced filtering (price range, attributes)
- [ ] Customer accounts
- [ ] Order history
- [ ] Multiple payment methods
- [ ] Real-time order updates
- [ ] Push notifications
- [ ] PWA support
- [ ] Multi-language support

## License

Proprietary - Qaflaty © 2024
