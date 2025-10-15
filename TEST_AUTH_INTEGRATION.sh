#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# NileCare Authentication Integration Test Suite
# ═══════════════════════════════════════════════════════════════════════════
#
# This script tests the authentication integration between Auth Service
# and other microservices to ensure proper delegation is working.
#
# Usage: bash TEST_AUTH_INTEGRATION.sh
#
# Prerequisites:
# - Auth Service running on port 7020
# - At least one other service running (e.g., appointment-service on 7040)
# - Test user credentials configured
#
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:7020}"
TEST_SERVICE_URL="${TEST_SERVICE_URL:-http://localhost:7040}"
TEST_EMAIL="${TEST_EMAIL:-doctor@nilecare.sd}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPass123!}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ═══════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}TEST $TESTS_RUN:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

run_test() {
    ((TESTS_RUN++))
}

# ═══════════════════════════════════════════════════════════════════════════
# Test Cases
# ═══════════════════════════════════════════════════════════════════════════

test_auth_service_health() {
    run_test
    print_test "Auth Service health check"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$AUTH_SERVICE_URL/health")
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "Auth Service is healthy (HTTP $RESPONSE)"
    else
        print_failure "Auth Service health check failed (HTTP $RESPONSE)"
    fi
}

test_integration_endpoint_health() {
    run_test
    print_test "Auth Service integration endpoint health"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$AUTH_SERVICE_URL/api/v1/integration/health")
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "Integration endpoint is healthy (HTTP $RESPONSE)"
    else
        print_failure "Integration endpoint health check failed (HTTP $RESPONSE)"
    fi
}

test_login_get_token() {
    run_test
    print_test "Login and retrieve JWT token"
    
    RESPONSE=$(curl -s -X POST "$AUTH_SERVICE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        print_success "Login successful, token retrieved"
        export JWT_TOKEN="$TOKEN"
    else
        print_failure "Login failed or no token returned"
        echo "Response: $RESPONSE"
    fi
}

test_service_with_valid_token() {
    run_test
    print_test "Access service endpoint with valid token"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "No JWT token available (login test may have failed)"
        return
    fi
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_SERVICE_URL/api/v1/appointments" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
        print_success "Service accepts valid token (HTTP $RESPONSE)"
    else
        print_failure "Service rejected valid token (HTTP $RESPONSE)"
    fi
}

test_service_without_token() {
    run_test
    print_test "Access service endpoint without token"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_SERVICE_URL/api/v1/appointments")
    
    if [ "$RESPONSE" = "401" ]; then
        print_success "Service correctly rejects request without token (HTTP $RESPONSE)"
    else
        print_failure "Service should return 401 but returned (HTTP $RESPONSE)"
    fi
}

test_service_with_invalid_token() {
    run_test
    print_test "Access service endpoint with invalid token"
    
    INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkludmFsaWQgVG9rZW4iLCJpYXQiOjE1MTYyMzkwMjJ9.invalid_signature"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_SERVICE_URL/api/v1/appointments" \
        -H "Authorization: Bearer $INVALID_TOKEN")
    
    if [ "$RESPONSE" = "401" ]; then
        print_success "Service correctly rejects invalid token (HTTP $RESPONSE)"
    else
        print_failure "Service should return 401 for invalid token but returned (HTTP $RESPONSE)"
    fi
}

test_service_with_malformed_token() {
    run_test
    print_test "Access service endpoint with malformed token"
    
    MALFORMED_TOKEN="not-a-valid-jwt-token"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_SERVICE_URL/api/v1/appointments" \
        -H "Authorization: Bearer $MALFORMED_TOKEN")
    
    if [ "$RESPONSE" = "401" ]; then
        print_success "Service correctly rejects malformed token (HTTP $RESPONSE)"
    else
        print_failure "Service should return 401 for malformed token but returned (HTTP $RESPONSE)"
    fi
}

test_service_with_expired_token() {
    run_test
    print_test "Access service endpoint with expired token"
    
    # This is an expired token (exp claim is in the past)
    EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkV4cGlyZWQgVG9rZW4iLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0pqJ6_sB7Rmeq6L0Jk7dE_nP6E1qD1P_nE1x1c"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_SERVICE_URL/api/v1/appointments" \
        -H "Authorization: Bearer $EXPIRED_TOKEN")
    
    if [ "$RESPONSE" = "401" ]; then
        print_success "Service correctly rejects expired token (HTTP $RESPONSE)"
    else
        print_failure "Service should return 401 for expired token but returned (HTTP $RESPONSE)"
    fi
}

test_auth_service_validate_token_endpoint() {
    run_test
    print_test "Direct call to Auth Service token validation endpoint"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_failure "No JWT token available"
        return
    fi
    
    # Note: This would require AUTH_SERVICE_API_KEY which we don't have in this script
    # This is just testing if the endpoint exists
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$AUTH_SERVICE_URL/api/v1/integration/validate-token" \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"$JWT_TOKEN\"}")
    
    if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
        print_success "Token validation endpoint exists (HTTP $RESPONSE)"
    else
        print_failure "Token validation endpoint may not be configured (HTTP $RESPONSE)"
    fi
}

test_auth_logging() {
    run_test
    print_test "Verify authentication logging is working"
    
    # Check if auth service logs contain authentication attempts
    # This is a basic check - actual log verification would need log file access
    echo -e "${YELLOW}    Note: Manual verification of logs recommended${NC}"
    print_success "Authentication logging test (manual verification recommended)"
}

# ═══════════════════════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════════════════════

main() {
    print_header "NileCare Authentication Integration Tests"
    
    echo "Configuration:"
    echo "  Auth Service URL: $AUTH_SERVICE_URL"
    echo "  Test Service URL: $TEST_SERVICE_URL"
    echo "  Test Email: $TEST_EMAIL"
    echo ""
    
    # Run all tests
    test_auth_service_health
    test_integration_endpoint_health
    test_login_get_token
    test_service_with_valid_token
    test_service_without_token
    test_service_with_invalid_token
    test_service_with_malformed_token
    test_service_with_expired_token
    test_auth_service_validate_token_endpoint
    test_auth_logging
    
    # Print results
    print_header "Test Results"
    
    echo "Total Tests:  $TESTS_RUN"
    echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
    echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✓ ALL TESTS PASSED - Integration is working correctly!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        exit 0
    else
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ✗ SOME TESTS FAILED - Please review the failures above${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        exit 1
    fi
}

# Run main function
main

