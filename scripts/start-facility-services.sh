#!/bin/bash

# Start NileCare Services with Multi-Facility Support
# Bash script for Linux/Mac

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   NILECARE MULTI-FACILITY SERVICES STARTUP               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
FACILITY_ID=${FACILITY_ID:-"facility-local-001"}
ORGANIZATION_ID=${ORGANIZATION_ID:-"org-nilecare-001"}

if [ -z "$FACILITY_ID" ]; then
    echo -e "${YELLOW}⚠️  FACILITY_ID not set in environment${NC}"
    echo -e "${YELLOW}Using default: facility-local-001${NC}"
fi

if [ -z "$ORGANIZATION_ID" ]; then
    echo -e "${YELLOW}⚠️  ORGANIZATION_ID not set in environment${NC}"
    echo -e "${YELLOW}Using default: org-nilecare-001${NC}"
fi

echo -e "${GREEN}🏥 Facility ID: $FACILITY_ID${NC}"
echo -e "${GREEN}🏢 Organization ID: $ORGANIZATION_ID${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Function to start a service
start_service() {
    local SERVICE_NAME=$1
    local SERVICE_PATH=$2
    local PORT=$3
    local LOG_FILE="logs/${SERVICE_NAME,,}.log"

    echo -e "${BLUE}🚀 Starting $SERVICE_NAME on port $PORT...${NC}"
    
    # Check if port is already in use
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $PORT already in use - skipping $SERVICE_NAME${NC}"
        return 1
    fi

    # Start service in background
    cd "$SERVICE_PATH" || exit 1
    nohup npm run dev > "../../$LOG_FILE" 2>&1 &
    local PID=$!
    cd - > /dev/null || exit 1

    # Save PID
    echo $PID > "logs/${SERVICE_NAME,,}.pid"

    sleep 2
    
    # Check if process is still running
    if ps -p $PID > /dev/null; then
        echo -e "${GREEN}✅ $SERVICE_NAME started (PID: $PID)${NC}"
        return 0
    else
        echo -e "${RED}❌ $SERVICE_NAME failed to start${NC}"
        return 1
    fi
}

# Check dependencies
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} CHECKING DEPENDENCIES${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql not found (PostgreSQL client)${NC}"
else
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL: $PSQL_VERSION${NC}"
fi

echo ""

# Start services
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} STARTING CORE SERVICES${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Start Auth Service (required first)
start_service "Auth-Service" "microservices/auth-service" 7020

echo -e "${YELLOW}⏳ Waiting for Auth Service to initialize (5 seconds)...${NC}"
sleep 5

# Check Auth Service health
AUTH_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7020/health 2>/dev/null || echo "000")

if [ "$AUTH_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Auth Service is healthy${NC}"
else
    echo -e "${RED}❌ Auth Service failed to start properly (HTTP $AUTH_HEALTH)${NC}"
    echo -e "${YELLOW}Check logs/auth-service.log for errors${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} STARTING HEALTHCARE SERVICES (MULTI-FACILITY ENABLED)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Start CDS Service
start_service "CDS-Service" "microservices/cds-service" 4002
sleep 3

# Start EHR Service
start_service "EHR-Service" "microservices/ehr-service" 4001
sleep 3

# Start Clinical Service
start_service "Clinical-Service" "microservices/clinical" 3004
sleep 3

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} SERVICE HEALTH CHECKS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⏳ Waiting for services to initialize (15 seconds)...${NC}"
sleep 15

# Check all service health
SERVICES=(
    "Auth Service:http://localhost:7020/health"
    "CDS Service:http://localhost:4002/health"
    "EHR Service:http://localhost:4001/health"
    "Clinical Service:http://localhost:3004/health"
)

ALL_HEALTHY=true

for SERVICE_INFO in "${SERVICES[@]}"; do
    IFS=':' read -r SERVICE_NAME SERVICE_URL <<< "$SERVICE_INFO"
    
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL" 2>/dev/null || echo "000")
    
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ $SERVICE_NAME: Healthy${NC}"
    else
        echo -e "${RED}❌ $SERVICE_NAME: Not responding (HTTP $HEALTH_STATUS)${NC}"
        ALL_HEALTHY=false
    fi
done

echo ""

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║     ✅ ALL SERVICES STARTED SUCCESSFULLY! ✅              ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║     Multi-Facility Support: ENABLED                       ║${NC}"
    echo -e "${GREEN}║     Facility ID: $FACILITY_ID                     ║${NC}"
    echo -e "${GREEN}║     Organization ID: $ORGANIZATION_ID            ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║     ⚠️  SOME SERVICES FAILED TO START ⚠️                 ║${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║     Check the log files in logs/ directory               ║${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "   - API Docs (CDS):  http://localhost:4002/api-docs"
echo -e "   - API Docs (EHR):  http://localhost:4001/api-docs"
echo -e "   - API Docs (Clinical): http://localhost:3004/api-docs"
echo ""
echo -e "${CYAN}🧪 Test the System:${NC}"
echo -e "   See: MULTI_FACILITY_SETUP_GUIDE.md"
echo ""
echo -e "${CYAN}📊 Monitor Sync Status:${NC}"
echo -e "   curl http://localhost:4002/api/v1/sync/status?facilityId=$FACILITY_ID"
echo ""
echo -e "${YELLOW}⏹️  To stop all services, run: ./scripts/stop-facility-services.sh${NC}"
echo ""

# Create stop script
cat > scripts/stop-facility-services.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping NileCare services..."

# Kill services by PID files
for PID_FILE in logs/*.pid; do
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        SERVICE_NAME=$(basename "$PID_FILE" .pid)
        
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo "✅ Stopped $SERVICE_NAME (PID: $PID)"
        else
            echo "⚠️  $SERVICE_NAME not running"
        fi
        
        rm "$PID_FILE"
    fi
done

echo "✅ All services stopped"
EOF

chmod +x scripts/stop-facility-services.sh

# Show sync status
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} SYNC STATUS (Multi-Facility)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

SYNC_STATUS=$(curl -s "http://localhost:4002/api/v1/sync/status?facilityId=$FACILITY_ID" 2>/dev/null || echo "{}")

if [ "$SYNC_STATUS" != "{}" ]; then
    echo "$SYNC_STATUS" | jq . 2>/dev/null || echo "$SYNC_STATUS"
else
    echo -e "${YELLOW}ℹ️  Sync status not available (may not be configured yet)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Startup complete!${NC}"

