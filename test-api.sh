#!/bin/bash

# AI Agent API Test Script
# Tests all major endpoints and functionality

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing AI Agent API${NC}"
echo "=================================="

# Test 1: Health Check
echo -e "\n${YELLOW}1. Health Check${NC}"
response=$(curl -s "${BASE_URL}/agent/health")
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$response"
fi

# Test 2: Agent Stats
echo -e "\n${YELLOW}2. Agent Stats${NC}"
response=$(curl -s "${BASE_URL}/agent/stats")
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Stats retrieved successfully${NC}"
    echo "   Documents: $(echo "$response" | jq '.data.vectorDB.count')"
    echo "   Sessions: $(echo "$response" | jq '.data.memory.totalSessions')"
else
    echo -e "${RED}❌ Stats retrieval failed${NC}"
fi

# Test 3: Knowledge Query (RAG)
echo -e "\n${YELLOW}3. Knowledge Query (RAG)${NC}"
response=$(curl -s -X POST "${BASE_URL}/agent/message" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is markdown?", "session_id": "test_knowledge"}')
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Knowledge query successful${NC}"
    echo "   Response: $(echo "$response" | jq -r '.data.response' | cut -c1-100)..."
else
    echo -e "${RED}❌ Knowledge query failed${NC}"
fi

# Test 4: Math Plugin
echo -e "\n${YELLOW}4. Math Plugin${NC}"
response=$(curl -s -X POST "${BASE_URL}/agent/message" \
    -H "Content-Type: application/json" \
    -d '{"message": "Calculate 15 * 8 + 3", "session_id": "test_math"}')
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Math plugin successful${NC}"
    echo "   Response: $(echo "$response" | jq -r '.data.response')"
else
    echo -e "${RED}❌ Math plugin failed${NC}"
fi

# Test 5: Weather Plugin
echo -e "\n${YELLOW}5. Weather Plugin${NC}"
response=$(curl -s -X POST "${BASE_URL}/agent/message" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is the weather in London?", "session_id": "test_weather"}')
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Weather plugin successful${NC}"
    echo "   Response: $(echo "$response" | jq -r '.data.response' | cut -c1-100)..."
else
    echo -e "${RED}❌ Weather plugin failed${NC}"
fi

# Test 6: Session Memory
echo -e "\n${YELLOW}6. Session Memory${NC}"
response=$(curl -s -X POST "${BASE_URL}/agent/message" \
    -H "Content-Type: application/json" \
    -d '{"message": "What did we just talk about?", "session_id": "test_weather"}')
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Session memory working${NC}"
    echo "   Response: $(echo "$response" | jq -r '.data.response' | cut -c1-100)..."
else
    echo -e "${RED}❌ Session memory failed${NC}"
fi

# Test 7: Clear Session
echo -e "\n${YELLOW}7. Clear Session${NC}"
response=$(curl -s -X POST "${BASE_URL}/agent/clear" \
    -H "Content-Type: application/json" \
    -d '{"session_id": "test_weather"}')
if echo "$response" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Session cleared successfully${NC}"
else
    echo -e "${RED}❌ Session clear failed${NC}"
fi

echo -e "\n${YELLOW}🎉 All tests completed!${NC}" 