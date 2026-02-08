# Qaflaty Angular Workspace

This workspace contains three Angular applications for the Qaflaty multi-tenant e-commerce platform.

## Applications

### 1. Landing App (Port 4200)
The marketing landing page for Qaflaty platform.

**Run:**
```bash
ng serve landing
```

Access at: http://localhost:4200

### 2. Merchant App (Port 4201)
The merchant dashboard for store owners to manage their stores, products, orders, and customers.

**Run:**
```bash
ng serve merchant
```

Access at: http://localhost:4201

### 3. Store App (Port 4202)
The customer-facing storefront application (multi-tenant).

**Run:**
```bash
ng serve store
```

Access at: http://localhost:4202

## Shared Library

The `shared` library contains common code used across all applications:
- Models and DTOs
- Services
- Components
- Guards
- Interceptors
- Utilities

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 19+

### Installation
```bash
npm install
```

### Running Applications
```bash
# Run individual applications
ng serve landing    # Port 4200
ng serve merchant   # Port 4201
ng serve store      # Port 4202
```

### Building Applications
```bash
# Build for production
ng build landing --configuration production
ng build merchant --configuration production
ng build store --configuration production
```

### Running Tests
```bash
# Run tests for all projects
npm test

# Run tests for specific project
ng test merchant
ng test store
ng test landing
ng test shared
```

## Technology Stack

- **Angular 20** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **RxJS** - Reactive programming
- **SCSS** - CSS preprocessor

## API Configuration

All applications are configured to proxy API requests to `http://localhost:5000` in development mode via `proxy.conf.json`.

The API base URL can be configured in the environment files:
- `projects/{app}/src/environments/environment.ts` - Development
- `projects/{app}/src/environments/environment.prod.ts` - Production

## Project Structure

```
qaflaty-workspace/
├── projects/
│   ├── landing/          # Marketing landing page
│   │   └── src/
│   │       ├── app/
│   │       ├── assets/
│   │       └── environments/
│   ├── merchant/         # Merchant dashboard
│   │   └── src/
│   │       ├── app/
│   │       ├── assets/
│   │       └── environments/
│   ├── store/            # Customer storefront
│   │   └── src/
│   │       ├── app/
│   │       ├── assets/
│   │       └── environments/
│   └── shared/           # Shared library
│       └── src/
│           └── lib/
│               ├── models/
│               ├── services/
│               ├── components/
│               ├── guards/
│               ├── interceptors/
│               └── utils/
├── angular.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── proxy.conf.json
```

## Coding Standards

- Use Angular standalone components
- Follow reactive programming patterns with RxJS
- Use TypeScript strict mode
- Use Tailwind CSS for styling
- Follow Angular style guide
- Write unit tests for components and services

## Environment Variables

Each application has two environment files:
- `environment.ts` - Development configuration
- `environment.prod.ts` - Production configuration

## Notes

- All applications use SCSS for styling
- Tailwind CSS is configured and ready to use
- Proxy configuration routes `/api` requests to the backend
- Shared library provides common models and utilities

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
