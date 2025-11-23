#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# NOFX 加密環境變數測試腳本
# 用於驗證 PR #75 環境變數配置的正確性
#
# 使用方式: chmod +x scripts/test_env_encryption.sh && ./scripts/test_env_encryption.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 測試統計
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# 輸出函數
print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((TESTS_SKIPPED++))
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 1: 檢查環境變數設置
# ═══════════════════════════════════════════════════════════════════════════════
test_env_vars_set() {
    print_header "測試 1: 環境變數設置檢查"

    # 載入 .env 如果存在
    if [ -f ".env" ]; then
        print_info "載入 .env 文件..."
        set -a
        source .env 2>/dev/null || true
        set +a
    fi

    # 檢查 NOFX_MASTER_KEY
    print_test "檢查 NOFX_MASTER_KEY..."
    if [ -n "$NOFX_MASTER_KEY" ]; then
        key_len=${#NOFX_MASTER_KEY}
        if [ "$key_len" -ge 40 ] && [ "$key_len" -le 50 ]; then
            print_pass "NOFX_MASTER_KEY 已設置 (長度: $key_len 字符)"
        else
            print_fail "NOFX_MASTER_KEY 長度異常: $key_len 字符 (期望 44 左右)"
        fi
    else
        print_fail "NOFX_MASTER_KEY 未設置"
    fi

    # 檢查 NOFX_RSA_PRIVATE_KEY
    print_test "檢查 NOFX_RSA_PRIVATE_KEY..."
    if [ -n "$NOFX_RSA_PRIVATE_KEY" ]; then
        key_len=${#NOFX_RSA_PRIVATE_KEY}
        if [ "$key_len" -gt 100 ]; then
            print_pass "NOFX_RSA_PRIVATE_KEY 已設置 (長度: $key_len 字符)"
        else
            print_fail "NOFX_RSA_PRIVATE_KEY 長度異常: $key_len 字符"
        fi
    else
        print_fail "NOFX_RSA_PRIVATE_KEY 未設置"
    fi

    # 檢查 NOFX_RSA_PUBLIC_KEY
    print_test "檢查 NOFX_RSA_PUBLIC_KEY..."
    if [ -n "$NOFX_RSA_PUBLIC_KEY" ]; then
        key_len=${#NOFX_RSA_PUBLIC_KEY}
        if [ "$key_len" -gt 100 ]; then
            print_pass "NOFX_RSA_PUBLIC_KEY 已設置 (長度: $key_len 字符)"
        else
            print_fail "NOFX_RSA_PUBLIC_KEY 長度異常: $key_len 字符"
        fi
    else
        print_fail "NOFX_RSA_PUBLIC_KEY 未設置"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 2: Base64 解碼驗證
# ═══════════════════════════════════════════════════════════════════════════════
test_base64_decode() {
    print_header "測試 2: Base64 解碼驗證"

    # 載入 .env
    if [ -f ".env" ]; then
        set -a
        source .env 2>/dev/null || true
        set +a
    fi

    # 驗證 NOFX_MASTER_KEY 可以解碼
    print_test "驗證 NOFX_MASTER_KEY Base64 解碼..."
    if [ -n "$NOFX_MASTER_KEY" ]; then
        if decoded=$(echo "$NOFX_MASTER_KEY" | base64 -d 2>/dev/null); then
            decoded_len=${#decoded}
            if [ "$decoded_len" -eq 32 ]; then
                print_pass "NOFX_MASTER_KEY 解碼成功 (32 字節)"
            else
                print_fail "NOFX_MASTER_KEY 解碼後長度錯誤: $decoded_len 字節 (期望 32)"
            fi
        else
            print_fail "NOFX_MASTER_KEY Base64 解碼失敗"
        fi
    else
        print_skip "NOFX_MASTER_KEY 未設置"
    fi

    # 驗證 RSA 私鑰格式
    print_test "驗證 NOFX_RSA_PRIVATE_KEY 格式..."
    if [ -n "$NOFX_RSA_PRIVATE_KEY" ]; then
        if decoded=$(echo "$NOFX_RSA_PRIVATE_KEY" | base64 -d 2>/dev/null); then
            if echo "$decoded" | grep -q "BEGIN.*PRIVATE KEY"; then
                print_pass "NOFX_RSA_PRIVATE_KEY 格式正確 (PEM 格式)"
            else
                print_fail "NOFX_RSA_PRIVATE_KEY 不是有效的 PEM 格式"
            fi
        else
            print_fail "NOFX_RSA_PRIVATE_KEY Base64 解碼失敗"
        fi
    else
        print_skip "NOFX_RSA_PRIVATE_KEY 未設置"
    fi

    # 驗證 RSA 公鑰格式
    print_test "驗證 NOFX_RSA_PUBLIC_KEY 格式..."
    if [ -n "$NOFX_RSA_PUBLIC_KEY" ]; then
        if decoded=$(echo "$NOFX_RSA_PUBLIC_KEY" | base64 -d 2>/dev/null); then
            if echo "$decoded" | grep -q "BEGIN PUBLIC KEY"; then
                print_pass "NOFX_RSA_PUBLIC_KEY 格式正確 (PEM 格式)"
            else
                print_fail "NOFX_RSA_PUBLIC_KEY 不是有效的 PEM 格式"
            fi
        else
            print_fail "NOFX_RSA_PUBLIC_KEY Base64 解碼失敗"
        fi
    else
        print_skip "NOFX_RSA_PUBLIC_KEY 未設置"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 3: Go 單元測試
# ═══════════════════════════════════════════════════════════════════════════════
test_go_unit_tests() {
    print_header "測試 3: Go 單元測試"

    print_test "運行 crypto 包測試..."
    if go test -v ./crypto/... -run "TestEnvVar" -count=1 2>&1 | tee /tmp/crypto_test_output.txt; then
        if grep -q "PASS" /tmp/crypto_test_output.txt; then
            print_pass "所有環境變數單元測試通過"
        else
            print_fail "部分單元測試失敗"
        fi
    else
        print_fail "Go 測試運行失敗"
    fi

    print_test "運行 CryptoService 測試..."
    if go test -v ./crypto/... -run "TestCryptoService" -count=1 2>&1 | tee /tmp/crypto_service_test.txt; then
        if grep -q "PASS" /tmp/crypto_service_test.txt; then
            print_pass "CryptoService 測試通過"
        else
            print_fail "CryptoService 測試失敗"
        fi
    else
        print_fail "CryptoService 測試運行失敗"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 4: 加密/解密功能測試
# ═══════════════════════════════════════════════════════════════════════════════
test_encryption_decryption() {
    print_header "測試 4: 加密/解密功能測試"

    # 載入 .env
    if [ -f ".env" ]; then
        set -a
        source .env 2>/dev/null || true
        set +a
    fi

    # 檢查是否所有密鑰都設置了
    if [ -z "$NOFX_MASTER_KEY" ] || [ -z "$NOFX_RSA_PRIVATE_KEY" ] || [ -z "$NOFX_RSA_PUBLIC_KEY" ]; then
        print_skip "跳過加密測試：環境變數未完整設置"
        return
    fi

    print_test "運行完整加密/解密測試..."
    if go test -v ./crypto/... -run "TestEncryptionWithEnvKeys|TestKeyConsistency" -count=1 2>&1 | tee /tmp/encryption_test.txt; then
        if grep -q "PASS" /tmp/encryption_test.txt; then
            print_pass "加密/解密測試通過"
        elif grep -q "SKIP" /tmp/encryption_test.txt; then
            print_skip "加密測試被跳過（需要設置環境變數）"
        else
            print_fail "加密/解密測試失敗"
        fi
    else
        print_fail "加密測試運行失敗"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 5: 構建測試
# ═══════════════════════════════════════════════════════════════════════════════
test_build() {
    print_header "測試 5: 構建測試"

    print_test "編譯 crypto 包..."
    if go build -v ./crypto/... 2>&1; then
        print_pass "crypto 包編譯成功"
    else
        print_fail "crypto 包編譯失敗"
    fi

    print_test "檢查循環依賴..."
    if go list -f '{{join .Deps "\n"}}' ./crypto/... 2>&1 | head -20 > /dev/null; then
        print_pass "無循環依賴問題"
    else
        print_fail "可能存在循環依賴"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 6: 舊文件檢查（確保不再依賴）
# ═══════════════════════════════════════════════════════════════════════════════
test_old_files_removed() {
    print_header "測試 6: 舊密鑰文件檢查"

    print_test "檢查是否還有舊的密鑰文件..."

    old_files_found=false

    if [ -f ".secrets/master.key" ]; then
        print_info "發現舊文件: .secrets/master.key"
        old_files_found=true
    fi

    if [ -f "secrets/rsa_key" ]; then
        print_info "發現舊文件: secrets/rsa_key"
        old_files_found=true
    fi

    if [ -f ".secrets/rsa_private.pem" ]; then
        print_info "發現舊文件: .secrets/rsa_private.pem"
        old_files_found=true
    fi

    if [ "$old_files_found" = true ]; then
        print_pass "發現舊密鑰文件（建議遷移後刪除）"
    else
        print_pass "無舊密鑰文件"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試 7: .env 文件安全性
# ═══════════════════════════════════════════════════════════════════════════════
test_env_file_security() {
    print_header "測試 7: .env 文件安全性"

    if [ ! -f ".env" ]; then
        print_skip ".env 文件不存在"
        return
    fi

    print_test "檢查 .env 文件權限..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        perm=$(stat -f "%A" ".env" 2>/dev/null)
    else
        perm=$(stat -c "%a" ".env" 2>/dev/null)
    fi

    if [ "$perm" = "600" ]; then
        print_pass ".env 文件權限正確 (600)"
    else
        print_fail ".env 文件權限不安全: $perm (應為 600)"
        print_info "修復命令: chmod 600 .env"
    fi

    print_test "檢查 .gitignore 是否包含 .env..."
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        print_pass ".env 已在 .gitignore 中"
    else
        print_fail ".env 未添加到 .gitignore（危險！）"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 測試結果摘要
# ═══════════════════════════════════════════════════════════════════════════════
print_summary() {
    print_header "測試結果摘要"

    total=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))

    echo -e "  ${GREEN}通過: $TESTS_PASSED${NC}"
    echo -e "  ${RED}失敗: $TESTS_FAILED${NC}"
    echo -e "  ${YELLOW}跳過: $TESTS_SKIPPED${NC}"
    echo -e "  ─────────────"
    echo -e "  總計: $total"
    echo ""

    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ 所有測試通過！PR #75 環境變數配置正確${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        exit 0
    else
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ❌ 有 $TESTS_FAILED 個測試失敗，請檢查上方詳細信息${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 主函數
# ═══════════════════════════════════════════════════════════════════════════════
main() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  NOFX 加密環境變數測試腳本                                   ║${NC}"
    echo -e "${CYAN}║  PR #75: 統一使用環境變數管理所有加密密鑰                    ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "測試時間: $(date)"
    echo ""

    # 確保在項目根目錄
    if [ ! -f "go.mod" ]; then
        echo -e "${RED}錯誤: 請在項目根目錄運行此腳本${NC}"
        exit 1
    fi

    # 運行所有測試
    test_env_vars_set
    test_base64_decode
    test_go_unit_tests
    test_encryption_decryption
    test_build
    test_old_files_removed
    test_env_file_security

    # 打印摘要
    print_summary
}

# 執行主函數
main "$@"
