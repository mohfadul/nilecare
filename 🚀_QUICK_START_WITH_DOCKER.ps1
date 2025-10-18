# Quick Start NileCare Platform with Docker
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  NILECARE QUICK START WITH DOCKER" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (!$dockerInstalled) {
    Write-Host "Docker not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "Step 1: Starting MySQL, PostgreSQL, and Redis..." -ForegroundColor Yellow
Write-Host ""

# Start only databases from docker-compose
docker-compose up -d mysql postgres redis

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Databases starting..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting 30 seconds for databases to initialize..." -ForegroundColor Yellow
    timeout /t 30 /nobreak
    
    Write-Host ""
    Write-Host "Step 2: Creating database schemas..." -ForegroundColor Yellow
    
    # Wait for MySQL to be ready
    Write-Host "Checking MySQL connection..." -ForegroundColor Gray
    docker exec nilecare-mysql mysqladmin ping -h localhost -u root -prootpass
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL is ready" -ForegroundColor Green
        Write-Host ""
        
        # Create all service databases
        Write-Host "Creating service databases..." -ForegroundColor Yellow
        docker exec -i nilecare-mysql mysql -u root -prootpass < database/create-service-databases.sql
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Databases created!" -ForegroundColor Green
            Write-Host ""
            
            # Seed test data
            Write-Host "Seeding test data..." -ForegroundColor Yellow
            docker exec -i nilecare-mysql mysql -u root -prootpass < database/SEED_DATABASE.sql
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Test data seeded!" -ForegroundColor Green
            }
        }
    }
    
    Write-Host ""
    Write-Host "Step 3: Services status..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "RUNNING:" -ForegroundColor Green
    Write-Host "  - MySQL (port 3306)" -ForegroundColor White
    Write-Host "  - PostgreSQL (port 5432)" -ForegroundColor White
    Write-Host "  - Redis (port 6379)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Step 4: Start NileCare services..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run in separate terminals:" -ForegroundColor Cyan
    Write-Host "  Terminal 1: cd microservices\main-nilecare ; npm run dev" -ForegroundColor White
    Write-Host "  Terminal 2: cd microservices\auth-service ; npm run dev" -ForegroundColor White
    Write-Host "  Terminal 3: cd nilecare-frontend ; npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the automated script:" -ForegroundColor Cyan
    Write-Host "  .\START_ALL_SERVICES_MANUAL.ps1" -ForegroundColor White
    Write-Host ""
    
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  INFRASTRUCTURE READY!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "MySQL:      localhost:3306" -ForegroundColor Cyan
    Write-Host "PostgreSQL: localhost:5432" -ForegroundColor Cyan
    Write-Host "Redis:      localhost:6379" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host "Failed to start databases" -ForegroundColor Red
    Write-Host "Check Docker Desktop is running" -ForegroundColor Yellow
}

