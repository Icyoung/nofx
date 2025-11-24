package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"sync"
)

// EncryptionManager 加密管理器（單例模式）
type EncryptionManager struct {
	privateKey   *rsa.PrivateKey
	publicKeyPEM string
	masterKey    []byte // 用於數據庫加密的主密鑰
	mu           sync.RWMutex
}

// AgentWalletStore 抽象 Agent Wallet 数据源，提供加密私钥读取能力
type AgentWalletStore interface {
	GetAgentWalletEncryptedKey(agentAddress string) (string, error)
}

var (
	instance *EncryptionManager
	once     sync.Once
	initErr  error
)

// GetEncryptionManager 獲取加密管理器實例
func GetEncryptionManager() (*EncryptionManager, error) {
	once.Do(func() {
		instance, initErr = newEncryptionManager()
	})
	if instance == nil {
		if initErr == nil {
			initErr = errors.New("encryption manager instance is nil")
		}
		return nil, initErr
	}
	return instance, initErr
}

// newEncryptionManager 初始化加密管理器
func newEncryptionManager() (*EncryptionManager, error) {
	em := &EncryptionManager{}

	// 1. 加載或生成 RSA 密鑰對
	if err := em.loadOrGenerateRSAKeyPair(); err != nil {
		return nil, fmt.Errorf("初始化 RSA 密鑰失敗: %w", err)
	}

	// 2. 加載或生成數據庫主密鑰
	if err := em.loadOrGenerateMasterKey(); err != nil {
		return nil, fmt.Errorf("初始化主密鑰失敗: %w", err)
	}

	log.Println("🔐 加密管理器初始化成功")
	return em, nil
}

// ==================== RSA 密鑰管理 ====================

const (
	rsaKeySize = 4096
	// 注意：所有密鑰現在都從環境變數加載，不再使用文件
	// RSA: NOFX_RSA_PRIVATE_KEY_PATH, NOFX_RSA_PUBLIC_KEY_PATH (PEM 路徑)
	// Master Key: NOFX_MASTER_KEY (base64 encoded 32-byte key)
)

// loadOrGenerateRSAKeyPair 加載 RSA 密鑰對（僅從環境變數加載）
func (em *EncryptionManager) loadOrGenerateRSAKeyPair() error {
	privateKeyPEM, err := loadRSAPrivateKeyBytes()
	if err != nil {
		log.Println("❌ 嚴重錯誤：RSA 私鑰無法加載")
		log.Println("")
		log.Println("🔧 請設置以下環境變數：")
		log.Println("   NOFX_RSA_PRIVATE_KEY_PATH=<path to PEM file>")
		log.Println("   NOFX_RSA_PUBLIC_KEY_PATH=<path to PEM file>")
		log.Println("")
		log.Println("📝 生成方法：")
		log.Println("   openssl genrsa -out secrets/rsa_private.pem 4096")
		log.Println("   openssl rsa -in secrets/rsa_private.pem -pubout -out secrets/rsa_public.pem")
		log.Println("")
		return fmt.Errorf("RSA 私鑰加載失敗: %w", err)
	}

	publicKeyPEM, err := loadRSAPublicKeyBytes()
	if err != nil {
		log.Println("❌ 嚴重錯誤：RSA 公鑰無法加載")
		log.Println("")
		log.Println("🔧 請設置以下環境變數：")
		log.Println("   NOFX_RSA_PRIVATE_KEY_PATH=<path to PEM file>")
		log.Println("   NOFX_RSA_PUBLIC_KEY_PATH=<path to PEM file>")
		log.Println("")
		return fmt.Errorf("RSA 公鑰加載失敗: %w", err)
	}

	return em.loadRSAKeyPairFromPEM(privateKeyPEM, publicKeyPEM)
}

// loadRSAKeyPairFromPEM 從 PEM 字節加載 RSA 密鑰對
func (em *EncryptionManager) loadRSAKeyPairFromPEM(privateKeyPEM, publicKeyPEM []byte) error {
	// 解析私鑰
	privateKey, err := ParseRSAPrivateKeyFromPEM(privateKeyPEM)
	if err != nil {
		return fmt.Errorf("無效的 RSA 私鑰 PEM 格式: %w", err)
	}
	em.privateKey = privateKey
	em.publicKeyPEM = string(publicKeyPEM)

	log.Println("✅ RSA 密鑰對已從配置加載")
	return nil
}

// GetPublicKeyPEM 獲取公鑰 (PEM 格式)
func (em *EncryptionManager) GetPublicKeyPEM() string {
	em.mu.RLock()
	defer em.mu.RUnlock()
	return em.publicKeyPEM
}

// ==================== 混合解密 (RSA + AES) ====================

// DecryptWithPrivateKey 使用私鑰解密數據
// 數據格式: [加密的 AES 密鑰長度(4字節)] + [加密的 AES 密鑰] + [IV(12字節)] + [加密數據]
func (em *EncryptionManager) DecryptWithPrivateKey(encryptedBase64 string) (string, error) {
	em.mu.RLock()
	defer em.mu.RUnlock()

	// Base64 解碼
	encryptedData, err := base64.StdEncoding.DecodeString(encryptedBase64)
	if err != nil {
		return "", fmt.Errorf("Base64 解碼失敗: %w", err)
	}

	if len(encryptedData) < 4+256+12 { // 最小長度檢查
		return "", errors.New("加密數據長度不足")
	}

	// 1. 讀取加密的 AES 密鑰長度
	aesKeyLen := binary.BigEndian.Uint32(encryptedData[:4])
	if aesKeyLen > 1024 { // 防止過大的長度值
		return "", errors.New("無效的 AES 密鑰長度")
	}

	offset := 4
	// 2. 提取加密的 AES 密鑰
	encryptedAESKey := encryptedData[offset : offset+int(aesKeyLen)]
	offset += int(aesKeyLen)

	// 3. 使用 RSA 私鑰解密 AES 密鑰
	aesKey, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, em.privateKey, encryptedAESKey, nil)
	if err != nil {
		return "", fmt.Errorf("RSA 解密失敗: %w", err)
	}

	// 4. 提取 IV
	iv := encryptedData[offset : offset+12]
	offset += 12

	// 5. 提取加密數據
	ciphertext := encryptedData[offset:]

	// 6. 使用 AES-GCM 解密
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plaintext, err := aesGCM.Open(nil, iv, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("AES 解密失敗: %w", err)
	}

	// 清除敏感數據
	for i := range aesKey {
		aesKey[i] = 0
	}

	return string(plaintext), nil
}

// ==================== 數據庫加密 (AES-256-GCM) ====================

// loadOrGenerateMasterKey 加載數據庫主密鑰（僅從環境變數加載）
func (em *EncryptionManager) loadOrGenerateMasterKey() error {
	envKey := os.Getenv("NOFX_MASTER_KEY")
	if envKey == "" {
		log.Println("❌ 嚴重錯誤：主密鑰環境變數未設置")
		log.Println("")
		log.Println("🔧 請設置以下環境變數：")
		log.Println("   NOFX_MASTER_KEY=<base64 encoded 32-byte key>")
		log.Println("")
		log.Println("📝 生成方法：")
		log.Println("   # 生成 32 字節隨機密鑰並 base64 編碼：")
		log.Println("   openssl rand -base64 32")
		log.Println("")
		log.Println("   # 或使用以下命令：")
		log.Println("   head -c 32 /dev/urandom | base64")
		log.Println("")
		log.Println("⚠️  警告：主密鑰一旦設置，請妥善保管！")
		log.Println("   丟失主密鑰將導致所有加密數據無法恢復！")
		return fmt.Errorf("主密鑰環境變數未設置: NOFX_MASTER_KEY 必須設置")
	}

	decoded, err := base64.StdEncoding.DecodeString(envKey)
	if err != nil {
		log.Println("❌ 主密鑰 base64 解碼失敗")
		return fmt.Errorf("主密鑰格式無效: %w", err)
	}

	// 驗證密鑰長度 (AES-256 需要 32 字節)
	if len(decoded) != 32 {
		log.Printf("❌ 主密鑰長度錯誤：期望 32 字節，實際 %d 字節", len(decoded))
		return fmt.Errorf("主密鑰長度無效: 期望 32 字節，實際 %d 字節", len(decoded))
	}

	em.masterKey = decoded
	log.Println("✅ 從環境變數加載主密鑰成功")
	return nil
}

// EncryptForDatabase 使用主密鑰加密數據（用於數據庫存儲）
func (em *EncryptionManager) EncryptForDatabase(plaintext string) (string, error) {
	em.mu.RLock()
	defer em.mu.RUnlock()
	block, err := aes.NewCipher(em.masterKey)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptFromDatabase 使用主密鑰解密數據（從數據庫讀取）
func (em *EncryptionManager) DecryptFromDatabase(encryptedBase64 string) (string, error) {
	em.mu.RLock()
	defer em.mu.RUnlock()

	// 處理空字符串（未加密的舊數據）
	if encryptedBase64 == "" {
		return "", nil
	}

	ciphertext, err := base64.StdEncoding.DecodeString(encryptedBase64)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(em.masterKey)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("加密數據過短")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// ==================== 密鑰輪換 ====================

// RotateMasterKey 輪換主密鑰（需要重新加密所有數據）
// 注意：此方法只在內存中更新密鑰，用戶需要手動更新環境變數
func (em *EncryptionManager) RotateMasterKey() error {
	em.mu.Lock()
	defer em.mu.Unlock()

	log.Println("🔄 開始輪換主密鑰...")

	// 生成新主密鑰
	newMasterKey := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, newMasterKey); err != nil {
		return err
	}

	// 備份舊密鑰（用於日誌）
	oldMasterKeyEncoded := base64.StdEncoding.EncodeToString(em.masterKey)

	// 更新密鑰
	em.masterKey = newMasterKey

	// 輸出新密鑰供用戶更新環境變數
	newMasterKeyEncoded := base64.StdEncoding.EncodeToString(newMasterKey)

	log.Println("✅ 主密鑰已在內存中輪換")
	log.Println("")
	log.Println("⚠️  重要：請立即更新環境變數！")
	log.Println("")
	log.Printf("📦 舊密鑰（請備份）: %s", oldMasterKeyEncoded)
	log.Printf("🔐 新密鑰: %s", newMasterKeyEncoded)
	log.Println("")
	log.Println("🔧 更新方法：")
	log.Printf("   export NOFX_MASTER_KEY=%s", newMasterKeyEncoded)
	log.Println("")
	log.Println("⚠️  注意：重啟服務前必須更新環境變數，否則將無法解密數據！")

	return nil
}

// ResolveHyperliquidPrivateKey 解析 Hyperliquid 私钥
// 支持三种格式：
// 1. BACKEND_AGENT: 前缀 - 从数据库查询后端托管的 Agent Wallet 私钥
// 2. ENC:v1: 前缀 - 加密格式，需要解密
// 3. 原始十六进制字符串 - 直接使用
func ResolveHyperliquidPrivateKey(store AgentWalletStore, apiKey string) (string, error) {
	// 情况1: BACKEND_AGENT: 前缀
	if strings.HasPrefix(apiKey, "BACKEND_AGENT:") {
		// 提取 agent address
		agentAddress := strings.ToLower(strings.TrimPrefix(apiKey, "BACKEND_AGENT:"))

		encryptedPrivateKey, err := store.GetAgentWalletEncryptedKey(agentAddress)
		if err != nil {
			if err == sql.ErrNoRows {
				return "", fmt.Errorf("未找到激活的 Agent Wallet: %s", agentAddress)
			}
			return "", fmt.Errorf("查询 Agent Wallet 失败: %w", err)
		}

		// 获取加密管理器
		em, err := GetEncryptionManager()
		if err != nil {
			return "", fmt.Errorf("获取加密管理器失败: %w", err)
		}

		// 解密私钥
		privateKeyHex, err := em.DecryptFromDatabase(encryptedPrivateKey)
		if err != nil {
			return "", fmt.Errorf("解密私钥失败: %w", err)
		}

		// 清理并验证私钥
		cleanedKey := cleanAndValidatePrivateKey(privateKeyHex)
		if len(cleanedKey) != 64 || !isHexString(cleanedKey) {
			return "", fmt.Errorf("私钥格式无效: 期望 64 个十六进制字符，实际长度: %d", len(cleanedKey))
		}
		return cleanedKey, nil
	}

	// 情况2: 加密格式 (ENC:v1:...)
	if strings.HasPrefix(apiKey, "ENC:v1:") {
		// 获取加密管理器
		em, err := GetEncryptionManager()
		if err != nil {
			return "", fmt.Errorf("获取加密管理器失败: %w", err)
		}

		// 尝试解密
		decryptedKey, decryptErr := em.DecryptFromDatabase(apiKey)
		if decryptErr != nil {
			return "", fmt.Errorf("解密私钥失败: %w", decryptErr)
		}

		// 解密后可能是 BACKEND_AGENT: 格式，需要递归处理
		if strings.HasPrefix(decryptedKey, "BACKEND_AGENT:") {
			return ResolveHyperliquidPrivateKey(store, decryptedKey)
		}

		// 清理并验证私钥
		cleanedKey := cleanAndValidatePrivateKey(decryptedKey)
		if len(cleanedKey) != 64 || !isHexString(cleanedKey) {
			return "", fmt.Errorf("解密后的私钥格式无效: 期望 64 个十六进制字符，实际长度: %d", len(cleanedKey))
		}
		return cleanedKey, nil
	}

	// 情况3: 原始十六进制字符串
	cleanedKey := cleanAndValidatePrivateKey(apiKey)
	if len(cleanedKey) != 64 || !isHexString(cleanedKey) {
		previewLen := 10
		if len(apiKey) < previewLen {
			previewLen = len(apiKey)
		}
		return "", fmt.Errorf("私钥格式无效: 期望 64 个十六进制字符，或 BACKEND_AGENT: 格式，或有效的加密格式。实际长度: %d, 前10字符: %s", len(apiKey), apiKey[:previewLen])
	}
	return cleanedKey, nil
}

// cleanAndValidatePrivateKey 清理私钥字符串（去除空白字符和0x前缀）
func cleanAndValidatePrivateKey(key string) string {
	cleanedKey := strings.TrimSpace(key)
	cleanedKey = strings.TrimPrefix(strings.ToLower(cleanedKey), "0x")
	cleanedKey = strings.ReplaceAll(cleanedKey, " ", "")
	cleanedKey = strings.ReplaceAll(cleanedKey, "\n", "")
	cleanedKey = strings.ReplaceAll(cleanedKey, "\r", "")
	cleanedKey = strings.ReplaceAll(cleanedKey, "\t", "")
	return cleanedKey
}

// isHexString 检查字符串是否为有效的十六进制字符串
func isHexString(s string) bool {
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}
