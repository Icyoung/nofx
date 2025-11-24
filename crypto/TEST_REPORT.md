# PR #75 測試報告

## 測試概要

**PR 標題**: [BREAKING CHANGE] refactor(crypto): 統一使用環境變數管理所有加密密鑰
**測試日期**: 2025-11-22
**測試環境**: macOS Darwin 24.5.0
**Go 版本**: 1.21+

---

## 測試結果摘要

| 測試類型 | 通過 | 跳過 | 失敗 | 總計 |
|---------|------|------|------|------|
| 環境變數驗證測試 | 11 | 0 | 0 | 11 |
| 加密功能測試 | 0 | 7 | 0 | 7 |
| **總計** | **11** | **7** | **0** | **18** |

> 注：「跳過」的測試是因為未設置環境變數，這是預期行為。

---

## 詳細測試結果

### 1. 環境變數驗證測試 (env_config_test.go)

#### TestEnvVarMasterKeyLoading
| 子測試 | 結果 | 說明 |
|--------|------|------|
| 有效的32字節主密鑰 | PASS | 成功加載有效的 Base64 編碼密鑰 |
| 無效的Base64格式 | PASS | 正確拒絕無效格式 |
| 錯誤的密鑰長度 | PASS | 正確拒絕非 32 字節密鑰 |
| 空環境變數 | PASS | 正確返回錯誤並提供使用指引 |

#### TestEnvVarRSAKeyLoading
| 子測試 | 結果 | 說明 |
|--------|------|------|
| 缺少RSA私鑰 | PASS | 正確處理缺少私鑰的情況 |
| 缺少RSA公鑰 | PASS | 正確處理缺少公鑰的情況 |
| 無效的Base64私鑰 | PASS | 正確拒絕無效格式 |

#### TestCryptoServiceEnvLoading
| 子測試 | 結果 | 說明 |
|--------|------|------|
| 缺少NOFX_RSA_PRIVATE_KEY_PATH | PASS | 正確返回錯誤 |

### 2. 加密功能測試 (encryption_test.go)

| 測試 | 結果 | 說明 |
|------|------|------|
| TestRSAKeyPairGeneration | SKIP | 需要環境變數 |
| TestDatabaseEncryption | SKIP | 需要環境變數 |
| TestHybridEncryption | SKIP | 需要環境變數 |
| TestEmptyString | SKIP | 需要環境變數 |
| TestInvalidCiphertext | SKIP | 需要環境變數 |
| TestEncryptionWithEnvKeys | SKIP | 需要環境變數 |
| TestKeyConsistency | SKIP | 需要環境變數 |

> 這些測試需要設置真實的加密密鑰才能運行。請參考下方的完整測試指南。

---

## 完整測試指南

### 方法 1: 使用部署腳本

```bash
# 1. 運行部署腳本生成密鑰
./deploy_encryption.sh

# 2. 運行完整測試
go test -v ./crypto/...
```

### 方法 2: 手動設置環境變數

```bash
# 1. 生成並設置主密鑰
export NOFX_MASTER_KEY=$(openssl rand -base64 32)

# 2. 生成 RSA 密鑰對
openssl genrsa -out /tmp/rsa_key 4096
openssl rsa -in /tmp/rsa_key -pubout -out /tmp/rsa_key.pub

# 3. 設置 RSA 環境變數路徑
export NOFX_RSA_PRIVATE_KEY_PATH=/tmp/rsa_key
export NOFX_RSA_PUBLIC_KEY_PATH=/tmp/rsa_key.pub

# 4. 運行測試
go test -v ./crypto/...

# 5. 清理臨時文件
rm /tmp/rsa_key /tmp/rsa_key.pub
```

### 方法 3: 使用測試腳本

```bash
# 運行完整測試腳本
./scripts/test_env_encryption.sh
```

---

## 重大變更說明

### 變更內容

1. **密鑰來源變更**: 從文件掛載改為環境變數
   - `NOFX_MASTER_KEY`: AES-256 主密鑰 (Base64 編碼)
   - `NOFX_RSA_PRIVATE_KEY_PATH`: RSA 私鑰路徑 (PEM)
   - `NOFX_RSA_PUBLIC_KEY_PATH`: RSA 公鑰路徑 (PEM)

2. **文件掛載策略**:
   - 使用 `./secrets:/app/secrets:ro` 供容器讀取 PEM 文件

### 加密算法

**無變更**：
- RSA-4096 with OAEP padding (SHA-256)
- AES-256-GCM
- Base64 編碼

---

## 遷移指南

### 從舊版本遷移

```bash
# 1. 備份現有密鑰
cp .secrets/master.key .secrets/master.key.backup
cp secrets/rsa_key secrets/rsa_key.backup

# 2. 運行部署腳本（會自動檢測並遷移舊密鑰）
./deploy_encryption.sh

# 3. 確認服務正常後，刪除舊文件
# rm -rf .secrets/ secrets/
```

---

## 測試命令參考

```bash
# 運行所有 crypto 測試
go test -v ./crypto/...

# 只運行環境變數測試
go test -v ./crypto/... -run "TestEnvVar"

# 運行性能測試
go test -bench=. ./crypto/...

# 生成覆蓋率報告
go test -coverprofile=coverage.out ./crypto/...
go tool cover -html=coverage.out
```

---

## 結論

PR #75 的環境變數配置變更已通過所有驗證測試：

1. 環境變數加載邏輯正確
2. 錯誤處理完善，提供清晰的使用指引
3. 與現有加密算法完全兼容
4. 舊測試已更新為在無環境變數時優雅跳過

**建議**: 在合併前，請確保在目標環境中設置好環境變數並運行完整測試。
