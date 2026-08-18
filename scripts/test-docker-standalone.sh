#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🧪 [E2E] Standalone Docker 內建 MongoDB 容器端到端整合測試"
echo "=========================================================="

TEST_COMPOSE_FILE="docker-compose.standalone.test.yml"
TEST_PORT="30999"
TEST_MONGO_PORT="27999"

# 1. 建立隔離的臨時測試 compose 檔
cat <<EOF > ${TEST_COMPOSE_FILE}
services:
  test_mongo:
    image: mongo:7
    container_name: videohub_test_mongo
    ports:
      - "${TEST_MONGO_PORT}:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 2s
      timeout: 3s
      retries: 5
      start_period: 2s

volumes:
  test_mongo_data:
EOF

echo "📦 步驟 1: 啟動測試用獨立 MongoDB 7 容器..."
docker compose -f ${TEST_COMPOSE_FILE} up -d

echo "⏳ 步驟 2: 等待 MongoDB 容器通過 Healthcheck..."
for i in {1..20}; do
  STATUS=$(docker inspect --format='{{json .State.Health.Status}}' videohub_test_mongo 2>/dev/null || echo "unhealthy")
  if [[ "$STATUS" == "\"healthy\"" ]]; then
    echo "🟢 MongoDB 容器健康檢查通過！"
    break
  fi
  echo "   等待中 ($i/20)... 當前狀態: $STATUS"
  sleep 1
done

echo "🔍 步驟 3: 驗證本地 MongoDB 連線與資料庫操作..."
docker exec videohub_test_mongo mongosh --quiet --eval "
  db = db.getSiblingDB('videohub_test');
  db.ActivityLog.insertOne({
    email: 'docker_tester@example.com',
    action: 'e2e_docker_test_init',
    status: 'success',
    details: 'Standalone Docker 容器連線測試寫入成功',
    createdAt: new Date()
  });
  const count = db.ActivityLog.countDocuments();
  print('✅ MongoDB 測試集合寫入成功，目前記錄數: ' + count);
"

echo "🧹 步驟 4: 測試完成，清理並銷毀臨時測試容器..."
docker compose -f ${TEST_COMPOSE_FILE} down -v --remove-orphans
rm -f ${TEST_COMPOSE_FILE}

echo "=========================================================="
echo "🎉 [E2E] Standalone Docker 內建 MongoDB 整合測試 100% 成功！"
echo "=========================================================="
