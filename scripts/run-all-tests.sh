#!/bin/bash

# Run All Tests for NileCare Healthcare Services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   NILECARE TEST SUITE - RUNNING ALL TESTS                ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

ERROR_COUNT=0
SUCCESS_COUNT=0

# Function to run tests for a service
run_service_tests() {
    local SERVICE_NAME=$1
    local SERVICE_PATH=$2

    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} Testing: $SERVICE_NAME${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    cd "$SERVICE_PATH" || return 1

    # Check if tests exist
    if [ ! -d "tests" ] && [ ! -f "src/**/*.test.ts" ]; then
        echo -e "${YELLOW}⚠️  No tests found for $SERVICE_NAME - skipping${NC}"
        cd - > /dev/null
        return 0
    fi

    # Run tests
    echo -e "${BLUE}🧪 Running unit tests for $SERVICE_NAME...${NC}"
    
    if npm test; then
        echo -e "${GREEN}✅ $SERVICE_NAME tests PASSED${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ $SERVICE_NAME tests FAILED${NC}"
        ((ERROR_COUNT++))
    fi

    cd - > /dev/null
    echo ""
}

# Run unit tests
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA} PHASE 1: UNIT TESTS${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
echo ""

run_service_tests "CDS Service" "microservices/cds-service"
run_service_tests "EHR Service" "microservices/ehr-service"
run_service_tests "Clinical Service" "microservices/clinical"

# Run integration tests
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA} PHASE 2: INTEGRATION TESTS${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}🔍 Checking if services are running...${NC}"

SERVICES_RUNNING=true

if curl -s -f http://localhost:7020/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth Service is running${NC}"
else
    echo -e "${RED}❌ Auth Service is NOT running${NC}"
    SERVICES_RUNNING=false
fi

if curl -s -f http://localhost:4002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CDS Service is running${NC}"
else
    echo -e "${RED}❌ CDS Service is NOT running${NC}"
    SERVICES_RUNNING=false
fi

if curl -s -f http://localhost:4001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ EHR Service is running${NC}"
else
    echo -e "${RED}❌ EHR Service is NOT running${NC}"
    SERVICES_RUNNING=false
fi

if curl -s -f http://localhost:3004/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Clinical Service is running${NC}"
else
    echo -e "${RED}❌ Clinical Service is NOT running${NC}"
    SERVICES_RUNNING=false
fi

echo ""

if [ "$SERVICES_RUNNING" = true ]; then
    echo -e "${GREEN}🚀 All services running - proceeding with integration tests${NC}"
    echo ""

    cd tests/integration || exit 1

    echo -e "${BLUE}🧪 Running integration tests...${NC}"
    
    if npm test; then
        echo -e "${GREEN}✅ Integration tests PASSED${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ Integration tests FAILED${NC}"
        ((ERROR_COUNT++))
    fi

    cd - > /dev/null
else
    echo -e "${YELLOW}⚠️  Skipping integration tests - services not running${NC}"
    echo -e "${YELLOW}   Start services with: bash start-all-healthcare-services.sh${NC}"
fi

echo ""

# Summary
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} TEST SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((SUCCESS_COUNT + ERROR_COUNT))

if [ $TOTAL_TESTS -gt 0 ]; then
    echo -e "Total Test Suites: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $SUCCESS_COUNT${NC}"
    echo -e "${RED}Failed: $ERROR_COUNT${NC}"
    echo ""

    if [ $ERROR_COUNT -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                           ║${NC}"
        echo -e "${GREEN}║              ✅ ALL TESTS PASSED! ✅                       ║${NC}"
        echo -e "${GREEN}║                                                           ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║                                                           ║${NC}"
        echo -e "${YELLOW}║              ⚠️  SOME TESTS FAILED ⚠️                     ║${NC}"
        echo -e "${YELLOW}║                                                           ║${NC}"
        echo -e "${YELLOW}║     Review the test output above for details             ║${NC}"
        echo -e "${YELLOW}║                                                           ║${NC}"
        echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No tests were run${NC}"
fi

echo ""

# Coverage reports
echo -e "${CYAN}📊 Coverage Reports:${NC}"

if [ -f "microservices/cds-service/coverage/index.html" ]; then
    echo -e "   CDS Service: file://$(pwd)/microservices/cds-service/coverage/index.html"
fi

if [ -f "microservices/ehr-service/coverage/index.html" ]; then
    echo -e "   EHR Service: file://$(pwd)/microservices/ehr-service/coverage/index.html"
fi

if [ -f "tests/integration/coverage/index.html" ]; then
    echo -e "   Integration: file://$(pwd)/tests/integration/coverage/index.html"
fi

echo ""

# Exit with error code if tests failed
if [ $ERROR_COUNT -gt 0 ]; then
    exit 1
fi

exit 0

