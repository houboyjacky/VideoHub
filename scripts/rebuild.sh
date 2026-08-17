#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}        VideoHub 快速測試與重建腳本        ${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}[1/3] 執行自動化測試套件 (npm test)...${NC}"
if npm test; then
  echo -e "${GREEN}✓ 所有測試通過！${NC}"
else
  echo -e "${RED}✗ 測試失敗，中止重建以保護線上環境。請先修復錯誤。${NC}"
  exit 1
fi

echo -e "\n${YELLOW}[2/3] 重建並部署 Docker 容器 (docker compose --env-file .env.local up -d --build)...${NC}"
docker compose --env-file .env.local up -d --build

echo -e "\n${YELLOW}[3/3] 檢查容器運行狀態...${NC}"
sleep 3
docker compose --env-file .env.local ps

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 重建與部署完成！服務已正常運行。${NC}"
echo -e "${GREEN}========================================${NC}"
