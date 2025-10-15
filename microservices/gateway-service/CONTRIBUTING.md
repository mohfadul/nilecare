# Contributing to Gateway Service

Thank you for your interest in contributing to the NileCare Gateway Service!

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to backend microservices
- Auth service API key

### Setup Steps

1. **Clone and install**:
   ```bash
   cd microservices/gateway-service
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start in development mode**:
   ```bash
   npm run dev
   ```

## Code Style

### TypeScript Guidelines
- Use TypeScript strict mode
- Provide type annotations for function parameters
- Avoid `any` type when possible
- Use interfaces for data structures

### Naming Conventions
- **Files**: camelCase for files, PascalCase for classes
- **Functions**: camelCase
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with `I` prefix (optional)

### Example
```typescript
// Good
export class ProxyService {
  private serviceRegistry: Map<string, string>;
  
  async makeRequest(url: string, config: RequestConfig): Promise<Response> {
    // implementation
  }
}

// Bad
export class proxy_service {
  private ServiceRegistry: any;
  
  async MakeRequest(url, config) {
    // implementation
  }
}
```

## Testing

### Unit Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Writing Tests
```typescript
import { GatewayService } from '../services/GatewayService';

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(() => {
    service = new GatewayService();
  });

  test('should register services on initialization', () => {
    const serviceUrl = service.getServiceUrl('auth-service');
    expect(serviceUrl).toBeDefined();
  });
});
```

## Adding New Features

### 1. Adding a New Route

**Example**: Add support for a new "Pharmacy Service"

1. **Add environment variable** to `.env.example`:
   ```env
   PHARMACY_SERVICE_URL=http://localhost:7012
   ```

2. **Register service** in `GatewayService.ts`:
   ```typescript
   private initializeServiceRegistry(): void {
     const services = {
       // ... existing services
       'pharmacy-service': process.env.PHARMACY_SERVICE_URL || 'http://localhost:7012',
     };
   }
   ```

3. **Add route** in `index.ts`:
   ```typescript
   app.use('/api/v1/pharmacy', 
     authMiddleware, 
     responseTransformer, 
     proxyService.createProxy('/api/v1/pharmacy', {
       target: process.env.PHARMACY_SERVICE_URL,
       changeOrigin: true,
       pathRewrite: { '^/api/v1/pharmacy': '/api/v1/pharmacy' }
     })
   );
   ```

4. **Update Swagger service** in `SwaggerService.ts`:
   ```typescript
   private initializeServiceUrls(): void {
     const services = {
       // ... existing services
       'pharmacy-service': process.env.PHARMACY_SERVICE_URL || 'http://localhost:7012',
     };
   }
   ```

5. **Update documentation**:
   - Add route to README.md
   - Add route to ARCHITECTURE.md
   - Update Swagger documentation

### 2. Adding New Middleware

**Example**: Add request validation middleware

1. **Create middleware file** `src/middleware/requestValidator.ts`:
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import Joi from 'joi';

   export const validateRequest = (schema: Joi.Schema) => {
     return (req: Request, res: Response, next: NextFunction): void => {
       const { error } = schema.validate(req.body);
       
       if (error) {
         res.status(400).json({
           success: false,
           error: {
             code: 'VALIDATION_ERROR',
             message: error.details[0].message,
           },
         });
         return;
       }
       
       next();
     };
   };
   ```

2. **Use in routes**:
   ```typescript
   import { validateRequest } from './middleware/requestValidator';
   
   const appointmentSchema = Joi.object({
     patientId: Joi.string().required(),
     date: Joi.date().required(),
   });
   
   app.post('/api/v1/appointments', 
     authMiddleware,
     validateRequest(appointmentSchema),
     proxyService.createProxy(...)
   );
   ```

### 3. Adding New Service

**Example**: Add cache service

1. **Create service file** `src/services/CacheService.ts`:
   ```typescript
   import Redis from 'ioredis';
   import { logger } from '../utils/logger';

   export class CacheService {
     private client: Redis;

     constructor() {
       this.client = new Redis({
         host: process.env.REDIS_HOST,
         port: parseInt(process.env.REDIS_PORT || '6379'),
       });
     }

     async get(key: string): Promise<any> {
       const value = await this.client.get(key);
       return value ? JSON.parse(value) : null;
     }

     async set(key: string, value: any, ttl: number = 300): Promise<void> {
       await this.client.setex(key, ttl, JSON.stringify(value));
     }
   }
   ```

2. **Initialize in index.ts**:
   ```typescript
   import { CacheService } from './services/CacheService';
   
   const cacheService = new CacheService();
   ```

3. **Use in middleware or routes**:
   ```typescript
   const cachedData = await cacheService.get('patients:list');
   if (cachedData) {
     return res.json(cachedData);
   }
   ```

## Pull Request Process

### 1. Create Feature Branch
```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes
- Write code
- Add tests
- Update documentation

### 3. Test Changes
```bash
npm run lint
npm test
npm run build
```

### 4. Commit Changes
Use conventional commit format:
```bash
git commit -m "feat: add pharmacy service routing"
git commit -m "fix: correct CORS header handling"
git commit -m "docs: update API documentation"
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Add/update tests
- `chore`: Maintenance tasks

### 5. Push and Create PR
```bash
git push origin feature/my-new-feature
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Reference to related issues
- Screenshots (if UI changes)
- Test results

## Code Review Guidelines

### As a Reviewer
- Check code quality and style
- Verify tests are included
- Ensure documentation is updated
- Test functionality locally
- Provide constructive feedback

### As an Author
- Respond to feedback promptly
- Make requested changes
- Keep PR scope focused
- Update PR description if scope changes

## Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Creating a Release
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.2.3`
4. Push tag: `git push origin v1.2.3`
5. GitHub Actions will build and deploy

## Questions?

- **Slack**: #gateway-service channel
- **Email**: dev@nilecare.com
- **Issues**: GitHub Issues

Thank you for contributing! 🎉

