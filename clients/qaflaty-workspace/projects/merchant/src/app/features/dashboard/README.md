# Dashboard Module

This module implements the main dashboard page for the Merchant application (Task 4.6).

## Structure

```
dashboard/
├── components/
│   ├── stats-card/
│   │   └── stats-card.component.ts
│   ├── sales-chart/
│   │   └── sales-chart.component.ts
│   ├── recent-orders/
│   │   └── recent-orders.component.ts
│   ├── top-products/
│   │   └── top-products.component.ts
│   └── quick-actions/
│       └── quick-actions.component.ts
├── services/
│   └── dashboard.service.ts
├── dashboard.component.ts
└── dashboard.component.html
```

## Features Implemented

### 1. Statistics Cards
- **Total Revenue** - Shows total revenue with trend indicator (percentage change)
- **Total Orders** - Shows total orders with trend indicator
- **Total Products** - Shows total number of products in store
- **Total Customers** - Shows total number of customers

Each card includes:
- Icon with color coding (blue, green, purple, orange)
- Trend indicators (up/down arrows with percentage)
- Responsive design (1 col mobile, 2 tablet, 4 desktop)

### 2. Sales Chart
- Custom SVG bar chart showing sales over time
- Toggle between 7 days and 30 days view
- Interactive hover tooltips showing exact revenue
- Responsive design
- Automatic scaling based on data
- Y-axis with currency formatting
- X-axis with date labels

### 3. Recent Orders List
- Shows 10 most recent orders
- Displays:
  - Order number
  - Status badge with color coding
  - Customer name
  - Order date (relative time format)
  - Total amount
- Click to view order details
- Links to full orders page

### 4. Top Products List
- Shows 5 top-selling products
- Displays:
  - Product image (or placeholder)
  - Product name
  - Sales count
  - Total revenue
- Links to products page

### 5. Quick Actions
- Large, prominent action buttons:
  - **Create New Product** - Navigate to product creation form
  - **View All Orders** - Navigate to orders list
  - **Manage Store** - Navigate to store settings
- Hover effects with color transitions
- Icon indicators

### 6. Responsive Layout
- Mobile (< 768px):
  - Statistics cards: 1 column
  - Charts and lists: stacked vertically
- Tablet (768px - 1024px):
  - Statistics cards: 2 columns
  - Charts and lists: stacked vertically
- Desktop (> 1024px):
  - Statistics cards: 4 columns
  - Charts: full width
  - Recent orders and top products: side-by-side (2 columns)

## API Endpoints Used

The dashboard service expects the following endpoints:

### Dashboard Statistics
```
GET /api/dashboard/stats?storeId={storeId}
Response: DashboardStats {
  totalRevenue: Money,
  totalOrders: number,
  totalProducts: number,
  totalCustomers: number,
  revenueTrend: number,  // Percentage change
  ordersTrend: number    // Percentage change
}
```

### Sales Chart Data
```
GET /api/dashboard/sales-chart?storeId={storeId}&days={7|30}
Response: SalesChartData[] {
  date: string,
  revenue: number,
  orders: number
}
```

### Recent Orders
```
GET /api/dashboard/recent-orders?storeId={storeId}&limit=10&sort=recent
Response: RecentOrderSummary[] {
  id: string,
  orderNumber: string,
  customerName: string,
  status: string,
  total: Money,
  createdAt: string
}
```

### Top Products
```
GET /api/dashboard/top-products?storeId={storeId}&limit=5
Response: TopProduct[] {
  id: string,
  name: string,
  salesCount: number,
  revenue: Money,
  imageUrl?: string
}
```

## Components

### StatsCardComponent
Reusable component for displaying statistics with icons and trends.

**Inputs:**
- `title: string` - Card title
- `value: string | number` - Main value to display
- `trend?: number` - Trend percentage (positive/negative)
- `icon: 'revenue' | 'orders' | 'products' | 'customers'` - Icon type
- `color: 'blue' | 'green' | 'purple' | 'orange'` - Color scheme

### SalesChartComponent
Custom SVG bar chart for visualizing sales data.

**Inputs:**
- `data: SalesChartData[]` - Chart data points
- `period: 7 | 30` - Time period

**Outputs:**
- `periodChange: EventEmitter<7 | 30>` - Emits when period changes

### RecentOrdersComponent
Displays list of recent orders with quick navigation.

**Inputs:**
- `orders: RecentOrderSummary[]` - List of recent orders

### TopProductsComponent
Displays list of top-selling products.

**Inputs:**
- `products: TopProduct[]` - List of top products

### QuickActionsComponent
Displays quick action buttons for common tasks.

**Inputs:**
- `storeId?: string` - Current store ID for navigation

## Error Handling

The dashboard includes proper error handling:
- Loading states while fetching data
- Error messages if API calls fail
- Warning if no store is selected
- Empty states for sections with no data

## Usage

The dashboard is automatically loaded as the default landing page after login:
- Route: `/dashboard` or `/`
- Requires authentication (protected by authGuard)
- Automatically selects the merchant's first store
- Loads all data in parallel using `forkJoin`

## Future Enhancements

- Add date range filter for sales chart
- Add export functionality for reports
- Add store switcher for merchants with multiple stores
- Add customizable widgets
- Add real-time updates using WebSockets
- Add more detailed analytics (conversion rates, average order value, etc.)
- Implement Chart.js for more advanced visualizations
