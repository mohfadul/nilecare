# 🖥️ NileCare Web Dashboard

**Version:** 2.0.0  
**Port:** 5173 (Development)  
**Framework:** React 18 + TypeScript + Vite

---

## 📋 Overview

The NileCare Web Dashboard is the primary frontend application for the NileCare Healthcare Platform. It provides role-based interfaces for healthcare professionals, administrators, and patients.

### Key Features

- ✅ **11 Role-Based Dashboards**: Tailored interfaces for each user role
- ✅ **Arabic RTL Support**: Complete right-to-left interface
- ✅ **Real-time Updates**: Socket.IO integration
- ✅ **Material-UI Components**: Modern, accessible UI
- ✅ **TypeScript**: Type-safe development
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Advanced Search**: Patient and appointment search
- ✅ **Data Visualization**: Charts and analytics with Recharts
- ✅ **Form Validation**: Formik + Yup
- ✅ **API Integration**: React Query for server state management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend services running (Auth, Main, Business, Appointment)

### Installation

```bash
cd clients/web-dashboard
npm install
```

### Environment Configuration

Create `.env` file:

```env
# API Endpoints
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_PAYMENT_SERVICE_URL=http://localhost:7030
VITE_APPOINTMENT_SERVICE_URL=http://localhost:7040
VITE_BUSINESS_SERVICE_URL=http://localhost:7010

# WebSocket (optional)
VITE_WS_URL=ws://localhost:7000

# Environment
VITE_APP_ENV=development
```

### Start Development Server

```bash
npm run dev
```

Visit: http://localhost:5173

### Login Credentials (Development)

```
Doctor:
  Email: doctor@nilecare.sd
  Password: TestPass123!

Admin:
  Email: admin@nilecare.sd
  Password: TestPass123!

Nurse:
  Email: nurse@nilecare.sd
  Password: TestPass123!
```

---

## 🎯 User Roles & Dashboards

### 1. Super Admin Dashboard
- **Access Level**: Full system access
- **Features**:
  - User management
  - System configuration
  - Audit logs
  - Security settings
  - Service monitoring

### 2. Medical Director Dashboard
- **Access Level**: Clinical oversight
- **Features**:
  - Clinical quality metrics
  - Staff performance
  - Department analytics
  - Resource allocation
  - Compliance reports

### 3. Doctor Dashboard
- **Access Level**: Patient care
- **Features**:
  - Patient list
  - Today's appointments
  - Clinical notes (SOAP)
  - Lab results
  - Prescriptions
  - Medical history

### 4. Nurse Dashboard
- **Access Level**: Patient care support
- **Features**:
  - Patient vitals
  - Medication administration
  - Care plans
  - Patient monitoring
  - Doctor handoffs

### 5. Receptionist Dashboard
- **Access Level**: Front desk operations
- **Features**:
  - Patient registration
  - Appointment scheduling
  - Check-in/Check-out
  - Payment collection
  - Insurance verification

### 6. Billing Clerk Dashboard
- **Access Level**: Financial operations
- **Features**:
  - Invoice management
  - Payment processing
  - Insurance claims
  - Financial reports
  - Collections

### 7. Pharmacist Dashboard
- **Access Level**: Pharmacy operations
- **Features**:
  - Prescription management
  - Drug inventory
  - Drug interactions check
  - Dispensing records
  - Stock alerts

### 8. Lab Technician Dashboard
- **Access Level**: Laboratory operations
- **Features**:
  - Lab orders
  - Sample tracking
  - Results entry
  - Quality control
  - Equipment management

### 9. Patient Portal
- **Access Level**: Personal health records
- **Features**:
  - View medical records
  - Book appointments
  - View lab results
  - Message providers
  - Pay bills

### 10. Compliance Officer Dashboard
- **Access Level**: Regulatory compliance
- **Features**:
  - Audit logs
  - Compliance reports
  - Policy management
  - Incident tracking
  - Training records

### 11. Sudan Health Inspector Dashboard
- **Access Level**: Government oversight
- **Features**:
  - Facility inspections
  - Compliance checks
  - Health metrics
  - Regulatory reports
  - Violation tracking

---

## 🗂️ Project Structure

```
web-dashboard/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout/
│   │   │   └── DashboardLayout.tsx
│   │   ├── AdvancedSearch/
│   │   ├── Payment/
│   │   └── ...
│   ├── pages/           # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── Dashboards/  # Role-specific dashboards
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ...
│   │   ├── Patients/
│   │   │   ├── PatientList.tsx
│   │   │   └── PatientForm.tsx
│   │   ├── Appointments/
│   │   ├── Billing/
│   │   └── ...
│   ├── services/        # API services
│   │   ├── api.client.ts
│   │   ├── appointment.api.ts
│   │   ├── business.service.ts
│   │   └── analytics.ts
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useAppointments.ts
│   │   └── useWebSocket.ts
│   ├── utils/           # Utility functions
│   │   ├── exportUtils.ts
│   │   └── sanitize.ts
│   ├── config/          # Configuration
│   │   └── api.config.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite configuration
└── README.md            # This file
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development server (with hot reload)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Code Style

```typescript
// Use TypeScript interfaces
interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Use functional components with TypeScript
const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Component logic
  
  return (
    // JSX
  );
};
```

### API Integration

```typescript
// Using React Query
import { useQuery, useMutation } from '@tanstack/react-query';

function usePatients() {
  return useQuery(['patients'], async () => {
    const response = await axios.get('/api/patients');
    return response.data;
  });
}

function useCreatePatient() {
  return useMutation(async (patient: Patient) => {
    const response = await axios.post('/api/patients', patient);
    return response.data;
  });
}
```

### Authentication

```typescript
// AuthContext usage
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) {
    return <LoginForm onLogin={login} />;
  }
  
  return <Dashboard user={user} />;
}
```

---

## 🎨 Styling

### Material-UI Theme

```typescript
// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  direction: 'rtl', // RTL support for Arabic
});
```

### CSS Modules

```typescript
import styles from './PatientCard.module.css';

function PatientCard() {
  return <div className={styles.card}>...</div>;
}
```

---

## 🌐 Internationalization (i18n)

### Arabic RTL Support

```typescript
import { createTheme, ThemeProvider } from '@mui/material';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// RTL theme
const theme = createTheme({
  direction: 'rtl',
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        {/* App content */}
      </ThemeProvider>
    </CacheProvider>
  );
}
```

---

## 📦 Build & Deployment

### Production Build

```bash
# Build for production
npm run build

# Output directory: dist/
```

### Environment Variables (Production)

```env
VITE_API_URL=https://api.nilecare.sd
VITE_AUTH_SERVICE_URL=https://api.nilecare.sd/auth
VITE_PAYMENT_SERVICE_URL=https://api.nilecare.sd/payments
VITE_APPOINTMENT_SERVICE_URL=https://api.nilecare.sd/appointments
VITE_BUSINESS_SERVICE_URL=https://api.nilecare.sd/business
VITE_APP_ENV=production
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t nilecare/web-dashboard:2.0.0 .
docker run -p 80:80 nilecare/web-dashboard:2.0.0
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name nilecare.sd;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:7000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 🧪 Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import PatientCard from './PatientCard';

test('renders patient name', () => {
  const patient = {
    id: 1,
    firstName: 'Ahmed',
    lastName: 'Mohamed',
  };
  
  render(<PatientCard patient={patient} />);
  
  expect(screen.getByText('Ahmed Mohamed')).toBeInTheDocument();
});
```

### Run Tests

```bash
npm test
```

---

## 🐛 Troubleshooting

### "Network Error" when calling API

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:7000/health

# 2. Verify VITE_API_URL in .env
echo $VITE_API_URL

# 3. Check CORS settings on backend
CORS_ORIGIN=http://localhost:5173
```

### Build fails

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

### Page not found after deployment

**Solution:**
- Ensure nginx configuration includes SPA routing
- Check `try_files $uri $uri/ /index.html;` in nginx.conf

---

## 📚 Related Documentation

- [Quick Start Guide](../../QUICKSTART.md)
- [Authentication Guide](../../AUTHENTICATION.md)
- [API Documentation](../../API_REFERENCE.md)
- [Main README](../../README.md)

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Run linting
5. Submit pull request

---

## 📞 Support

- 📧 Email: frontend@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd
- 🐛 Issues: https://github.com/your-org/nilecare/issues

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Port:** 5173 (Development)  
**Maintained by:** NileCare Frontend Team


