#!/bin/bash
# NOFX 加密系統部署腳本 (環境變數版本)
# 使用方式: chmod +x deploy_encryption.sh && ./deploy_encryption.sh

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 輔助函數
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查必要工具
check_dependencies() {
    log_info "檢查依賴工具..."

    if ! command -v openssl &> /dev/null; then
        log_error "openssl 未安裝"
        exit 1
    fi

    if ! command -v base64 &> /dev/null; then
        log_error "base64 未安裝"
        exit 1
    fi

    log_success "依賴檢查通過"
}

# 生成主密鑰
generate_master_key() {
    log_info "生成 AES-256 主密鑰..." >&2
    local key=$(openssl rand -base64 32)
    log_success "主密鑰已生成" >&2
    echo "$key"
}

# 生成 RSA 密鑰對
generate_rsa_keys() {
    log_info "生成 RSA-4096 密鑰對..."

    # 創建臨時目錄
    TEMP_DIR=$(mktemp -d)

    # 生成私鑰
    openssl genrsa -out "$TEMP_DIR/rsa_key" 4096 2>/dev/null

    # 生成公鑰
    openssl rsa -in "$TEMP_DIR/rsa_key" -pubout -out "$TEMP_DIR/rsa_key.pub" 2>/dev/null

    # 檢測是否是 macOS (macOS 的 base64 不需要 -w0)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        RSA_PRIVATE_KEY=$(base64 < "$TEMP_DIR/rsa_key")
        RSA_PUBLIC_KEY=$(base64 < "$TEMP_DIR/rsa_key.pub")
    else
        RSA_PRIVATE_KEY=$(base64 -w0 < "$TEMP_DIR/rsa_key")
        RSA_PUBLIC_KEY=$(base64 -w0 < "$TEMP_DIR/rsa_key.pub")
    fi

    # 清理臨時文件
    rm -rf "$TEMP_DIR"

    log_success "RSA 密鑰對已生成"
}

# 檢查現有環境變數
check_existing_env() {
    log_info "檢查現有環境變數配置..."

    local has_existing=false

    if [ -n "$NOFX_MASTER_KEY" ]; then
        log_warning "NOFX_MASTER_KEY 已設置"
        has_existing=true
    fi

    if [ -n "$NOFX_RSA_PRIVATE_KEY" ]; then
        log_warning "NOFX_RSA_PRIVATE_KEY 已設置"
        has_existing=true
    fi

    if [ -n "$NOFX_RSA_PUBLIC_KEY" ]; then
        log_warning "NOFX_RSA_PUBLIC_KEY 已設置"
        has_existing=true
    fi

    if [ "$has_existing" = true ]; then
        echo ""
        log_warning "檢測到已有密鑰配置！"
        log_warning "重新生成密鑰將導致現有加密數據無法解密！"
        echo ""
        read -p "確定要重新生成密鑰嗎？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消"
            exit 0
        fi
    fi
}

# 從舊版本遷移
migrate_from_old_version() {
    log_info "檢查舊版本密鑰文件..."

    local migrated=false

    # 檢查舊的主密鑰
    if [ -f ".secrets/master.key" ]; then
        log_warning "發現舊版本主密鑰: .secrets/master.key"
        MASTER_KEY=$(cat .secrets/master.key)
        log_success "已從舊文件讀取主密鑰"
        migrated=true
    fi

    # 檢查舊的 RSA 密鑰
    if [ -f "secrets/rsa_key" ] && [ -f "secrets/rsa_key.pub" ]; then
        log_warning "發現舊版本 RSA 密鑰: secrets/rsa_key"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            RSA_PRIVATE_KEY=$(base64 < "secrets/rsa_key")
            RSA_PUBLIC_KEY=$(base64 < "secrets/rsa_key.pub")
        else
            RSA_PRIVATE_KEY=$(base64 -w0 < "secrets/rsa_key")
            RSA_PUBLIC_KEY=$(base64 -w0 < "secrets/rsa_key.pub")
        fi

        log_success "已從舊文件讀取 RSA 密鑰"
        migrated=true
    fi

    # 檢查更舊的 RSA 密鑰路徑
    if [ -f ".secrets/rsa_private.pem" ] && [ -f ".secrets/rsa_public.pem" ]; then
        log_warning "發現舊版本 RSA 密鑰: .secrets/rsa_private.pem"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            RSA_PRIVATE_KEY=$(base64 < ".secrets/rsa_private.pem")
            RSA_PUBLIC_KEY=$(base64 < ".secrets/rsa_public.pem")
        else
            RSA_PRIVATE_KEY=$(base64 -w0 < ".secrets/rsa_private.pem")
            RSA_PUBLIC_KEY=$(base64 -w0 < ".secrets/rsa_public.pem")
        fi

        log_success "已從舊文件讀取 RSA 密鑰"
        migrated=true
    fi

    if [ "$migrated" = true ]; then
        echo ""
        log_success "已從舊版本遷移密鑰"
        log_warning "請在確認新配置正常工作後，刪除舊的密鑰文件"
        echo ""
    fi

    echo "$migrated"
}

# 寫入 .env 文件
write_env_file() {
    log_info "寫入 .env 文件..."

    # 備份現有 .env
    if [ -f ".env" ]; then
        cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
        log_success "已備份現有 .env 文件"
    fi

    # 檢查是否已有這些變數
    if [ -f ".env" ]; then
        # 移除舊的密鑰配置
        grep -v "^NOFX_MASTER_KEY=" .env | grep -v "^NOFX_RSA_PRIVATE_KEY=" | grep -v "^NOFX_RSA_PUBLIC_KEY=" > .env.tmp || true
        mv .env.tmp .env
    fi

    # 添加新的密鑰配置
    cat >> .env << EOF

# ===========================================
# 加密密鑰配置（自動生成於 $(date))
# ===========================================
NOFX_MASTER_KEY=$MASTER_KEY
NOFX_RSA_PRIVATE_KEY=$RSA_PRIVATE_KEY
NOFX_RSA_PUBLIC_KEY=$RSA_PUBLIC_KEY
EOF

    log_success ".env 文件已更新"
}

# 更新 .gitignore
update_gitignore() {
    log_info "更新 .gitignore..."

    if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo ".env" >> .gitignore
        log_success "已添加 .env 到 .gitignore"
    fi

    if ! grep -q "^\.env\.backup" .gitignore 2>/dev/null; then
        echo ".env.backup*" >> .gitignore
        log_success "已添加 .env.backup* 到 .gitignore"
    fi
}

# 驗證配置
verify_config() {
    log_info "驗證配置..."

    # 檢查 .env 文件
    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在"
        return 1
    fi

    # 檢查環境變數
    source .env 2>/dev/null || true

    if [ -z "$NOFX_MASTER_KEY" ]; then
        log_error "NOFX_MASTER_KEY 未設置"
        return 1
    fi

    if [ -z "$NOFX_RSA_PRIVATE_KEY" ]; then
        log_error "NOFX_RSA_PRIVATE_KEY 未設置"
        return 1
    fi

    if [ -z "$NOFX_RSA_PUBLIC_KEY" ]; then
        log_error "NOFX_RSA_PUBLIC_KEY 未設置"
        return 1
    fi

    # 驗證主密鑰長度 (base64 編碼的 32 字節應該是 44 字符)
    local key_len=${#NOFX_MASTER_KEY}
    if [ "$key_len" -lt 40 ] || [ "$key_len" -gt 50 ]; then
        log_warning "主密鑰長度可能不正確: $key_len 字符"
    fi

    log_success "配置驗證通過"
}

# 打印後續步驟
print_next_steps() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 加密系統配置完成！${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 後續步驟:"
    echo ""
    echo "  1️⃣  加載環境變數到當前 shell:"
    echo "     $ source .env"
    echo ""
    echo "  2️⃣  使用 Docker Compose 啟動服務:"
    echo "     $ docker-compose up -d"
    echo ""
    echo "  3️⃣  驗證服務健康:"
    echo "     $ curl http://localhost:8080/api/health"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${RED}⚠️  重要警告:${NC}"
    echo ""
    echo "  • 密鑰已保存到 .env 文件，請妥善保管！"
    echo "  • 丟失主密鑰將導致所有加密數據無法恢復！"
    echo "  • .env 文件已添加到 .gitignore，切勿手動提交到 Git"
    echo "  • 建議將密鑰備份到安全的密鑰管理系統（如 HashiCorp Vault）"
    echo ""
    echo "📋 生成的環境變數:"
    echo ""
    echo "  NOFX_MASTER_KEY=${MASTER_KEY:0:20}..."
    echo "  NOFX_RSA_PRIVATE_KEY=${RSA_PRIVATE_KEY:0:30}..."
    echo "  NOFX_RSA_PUBLIC_KEY=${RSA_PUBLIC_KEY:0:30}..."
    echo ""
}

# 主函數
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🔐 NOFX 加密系統部署腳本 (v2.0 - 環境變數版本)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 檢查依賴
    check_dependencies

    # 檢查現有配置
    check_existing_env

    # 嘗試從舊版本遷移
    local migrated=$(migrate_from_old_version)

    # 如果沒有遷移，則生成新密鑰
    if [ -z "$MASTER_KEY" ]; then
        MASTER_KEY=$(generate_master_key)
    fi

    if [ -z "$RSA_PRIVATE_KEY" ] || [ -z "$RSA_PUBLIC_KEY" ]; then
        generate_rsa_keys
    fi

    # 寫入 .env 文件
    write_env_file

    # 更新 .gitignore
    update_gitignore

    # 驗證配置
    verify_config

    # 打印後續步驟
    print_next_steps
}

# 執行主函數
main "$@"
