package crypto

import (
	"encoding/base64"
	"os"
	"strings"
	"testing"
)

// TestEnvVarMasterKeyLoading 測試主密鑰環境變數加載
func TestEnvVarMasterKeyLoading(t *testing.T) {
	// 保存原始環境變數
	originalMasterKey := os.Getenv("NOFX_MASTER_KEY")
	originalRSAPrivPath := os.Getenv("NOFX_RSA_PRIVATE_KEY_PATH")
	originalRSAPubPath := os.Getenv("NOFX_RSA_PUBLIC_KEY_PATH")

	// 測試結束後恢復
	defer func() {
		os.Setenv("NOFX_MASTER_KEY", originalMasterKey)
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", originalRSAPrivPath)
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", originalRSAPubPath)
	}()

	t.Run("有效的32字節主密鑰", func(t *testing.T) {
		// 生成有效的 32 字節密鑰
		validKey := make([]byte, 32)
		for i := range validKey {
			validKey[i] = byte(i)
		}
		encodedKey := base64.StdEncoding.EncodeToString(validKey)
		os.Setenv("NOFX_MASTER_KEY", encodedKey)

		em := &EncryptionManager{}
		err := em.loadOrGenerateMasterKey()

		if err != nil {
			t.Fatalf("有效密鑰應該成功加載: %v", err)
		}

		if len(em.masterKey) != 32 {
			t.Fatalf("主密鑰長度應為 32 字節，實際: %d", len(em.masterKey))
		}

		t.Log("✅ 有效主密鑰加載成功")
	})

	t.Run("無效的Base64格式", func(t *testing.T) {
		os.Setenv("NOFX_MASTER_KEY", "not-valid-base64!!!")

		em := &EncryptionManager{}
		err := em.loadOrGenerateMasterKey()

		if err == nil {
			t.Fatal("無效 Base64 應該返回錯誤")
		}

		if !strings.Contains(err.Error(), "格式無效") {
			t.Fatalf("錯誤訊息應包含'格式無效': %v", err)
		}

		t.Log("✅ 正確拒絕無效 Base64 格式")
	})

	t.Run("錯誤的密鑰長度", func(t *testing.T) {
		// 16 字節密鑰（太短）
		shortKey := make([]byte, 16)
		encodedKey := base64.StdEncoding.EncodeToString(shortKey)
		os.Setenv("NOFX_MASTER_KEY", encodedKey)

		em := &EncryptionManager{}
		err := em.loadOrGenerateMasterKey()

		if err == nil {
			t.Fatal("錯誤長度的密鑰應該返回錯誤")
		}

		if !strings.Contains(err.Error(), "長度無效") {
			t.Fatalf("錯誤訊息應包含'長度無效': %v", err)
		}

		t.Log("✅ 正確拒絕錯誤長度的密鑰")
	})

	t.Run("空環境變數", func(t *testing.T) {
		os.Setenv("NOFX_MASTER_KEY", "")

		em := &EncryptionManager{}
		err := em.loadOrGenerateMasterKey()

		if err == nil {
			t.Fatal("空環境變數應該返回錯誤")
		}

		if !strings.Contains(err.Error(), "未設置") {
			t.Fatalf("錯誤訊息應包含'未設置': %v", err)
		}

		t.Log("✅ 正確處理空環境變數")
	})
}

// TestEnvVarRSAKeyLoading 測試 RSA 密鑰環境變數加載
func TestEnvVarRSAKeyLoading(t *testing.T) {
	// 保存原始環境變數
	originalRSAPrivPath := os.Getenv("NOFX_RSA_PRIVATE_KEY_PATH")
	originalRSAPubPath := os.Getenv("NOFX_RSA_PUBLIC_KEY_PATH")

	// 測試結束後恢復
	defer func() {
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", originalRSAPrivPath)
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", originalRSAPubPath)
	}()

	t.Run("缺少RSA私鑰", func(t *testing.T) {
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", "")
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", "")

		em := &EncryptionManager{}
		err := em.loadOrGenerateRSAKeyPair()

		if err == nil {
			t.Fatal("缺少 RSA 私鑰應該返回錯誤")
		}

		t.Log("✅ 正確處理缺少 RSA 私鑰")
	})

	t.Run("缺少RSA公鑰", func(t *testing.T) {
		tmpDir := t.TempDir()
		privPath := tmpDir + "/rsa_private.pem"
		os.WriteFile(privPath, []byte("dummy-priv"), 0600)
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", privPath)
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", "")

		em := &EncryptionManager{}
		err := em.loadOrGenerateRSAKeyPair()

		if err == nil {
			t.Fatal("缺少 RSA 公鑰應該返回錯誤")
		}

		t.Log("✅ 正確處理缺少 RSA 公鑰")
	})

	t.Run("無效的私鑰文件", func(t *testing.T) {
		tmpDir := t.TempDir()
		privPath := tmpDir + "/rsa_private.pem"
		pubPath := tmpDir + "/rsa_public.pem"
		os.WriteFile(privPath, []byte("not-valid-pem"), 0600)
		os.WriteFile(pubPath, []byte("dummy"), 0600)
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", privPath)
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", pubPath)

		em := &EncryptionManager{}
		err := em.loadOrGenerateRSAKeyPair()

		if err == nil {
			t.Fatal("無效密鑰應該返回錯誤")
		}

		t.Log("✅ 正確拒絕無效密鑰文件")
	})
}

// TestCryptoServiceEnvLoading 測試 CryptoService 環境變數加載
func TestCryptoServiceEnvLoading(t *testing.T) {
	// 保存原始環境變數
	originalMasterKey := os.Getenv("NOFX_MASTER_KEY")
	originalRSAPrivatePath := os.Getenv("NOFX_RSA_PRIVATE_KEY_PATH")
	originalRSAPublicPath := os.Getenv("NOFX_RSA_PUBLIC_KEY_PATH")

	// 測試結束後恢復
	defer func() {
		os.Setenv("NOFX_MASTER_KEY", originalMasterKey)
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", originalRSAPrivatePath)
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", originalRSAPublicPath)
	}()

	t.Run("缺少NOFX_RSA_PRIVATE_KEY_PATH", func(t *testing.T) {
		os.Setenv("NOFX_RSA_PRIVATE_KEY_PATH", "")
		os.Setenv("NOFX_RSA_PUBLIC_KEY_PATH", "")
		os.Setenv("NOFX_MASTER_KEY", base64.StdEncoding.EncodeToString([]byte("1234567890abcdef1234567890abcdef")))

		_, err := NewCryptoService()

		if err == nil {
			t.Fatal("缺少 NOFX_RSA_PRIVATE_KEY_PATH 應該返回錯誤")
		}

		if !strings.Contains(err.Error(), "RSA") {
			t.Fatalf("錯誤訊息應提及 RSA 密鑰: %v", err)
		}

		t.Log("✅ 正確處理缺少 NOFX_RSA_PRIVATE_KEY_PATH")
	})
}

// TestEncryptionWithEnvKeys 測試使用環境變數密鑰的加密/解密
func TestEncryptionWithEnvKeys(t *testing.T) {
	// 這個測試需要有效的環境變數設置
	// 如果環境變數未設置，跳過此測試
	if os.Getenv("NOFX_MASTER_KEY") == "" {
		t.Skip("跳過：NOFX_MASTER_KEY 未設置")
	}

	hasRSAPriv := os.Getenv("NOFX_RSA_PRIVATE_KEY_PATH") != ""
	hasRSAPub := os.Getenv("NOFX_RSA_PUBLIC_KEY_PATH") != ""
	if !hasRSAPriv || !hasRSAPub {
		t.Skip("跳過：RSA 密鑰未設置")
	}

	em, err := GetEncryptionManager()
	if err != nil {
		t.Fatalf("初始化加密管理器失敗: %v", err)
	}

	testData := []string{
		"test_api_key",
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		"中文測試數據",
		"Special chars: !@#$%^&*()",
	}

	for _, plaintext := range testData {
		encrypted, err := em.EncryptForDatabase(plaintext)
		if err != nil {
			t.Fatalf("加密失敗: %v", err)
		}

		decrypted, err := em.DecryptFromDatabase(encrypted)
		if err != nil {
			t.Fatalf("解密失敗: %v", err)
		}

		if decrypted != plaintext {
			t.Fatalf("解密結果不匹配: 期望 %s, 得到 %s", plaintext, decrypted)
		}
	}

	t.Log("✅ 使用環境變數密鑰的加密/解密測試通過")
}

// TestKeyConsistency 測試密鑰一致性（同一密鑰應該能解密之前加密的數據）
func TestKeyConsistency(t *testing.T) {
	if os.Getenv("NOFX_MASTER_KEY") == "" {
		t.Skip("跳過：NOFX_MASTER_KEY 未設置")
	}

	em, err := GetEncryptionManager()
	if err != nil {
		t.Fatalf("初始化加密管理器失敗: %v", err)
	}

	// 加密多次，驗證每次都能解密
	plaintext := "consistency_test_data"

	for i := 0; i < 10; i++ {
		encrypted, err := em.EncryptForDatabase(plaintext)
		if err != nil {
			t.Fatalf("第 %d 次加密失敗: %v", i+1, err)
		}

		decrypted, err := em.DecryptFromDatabase(encrypted)
		if err != nil {
			t.Fatalf("第 %d 次解密失敗: %v", i+1, err)
		}

		if decrypted != plaintext {
			t.Fatalf("第 %d 次解密結果不匹配", i+1)
		}
	}

	t.Log("✅ 密鑰一致性測試通過（10 次加密/解密）")
}
