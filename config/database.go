package config

import (
	"fmt"
	"time"
	"nofx/crypto"
)

// DatabaseInterface 定义了数据库实现需要提供的方法集合
type DatabaseInterface interface {
	SetCryptoService(cs *crypto.CryptoService)
	CreateUser(user *User) error
	GetUserByEmail(email string) (*User, error)
	GetUserByID(userID string) (*User, error)
	GetAllUsers() ([]string, error)
	UpdateUserOTPVerified(userID string, verified bool) error
	UpdateUserPassword(userID, newPasswordHash string) error
	GetAIModels(userID string) ([]*AIModelConfig, error)
	UpdateAIModel(userID, id string, enabled bool, apiKey, customAPIURL, customModelName string) error
	GetExchanges(userID string) ([]*ExchangeConfig, error)
	UpdateExchange(userID, id string, enabled bool, apiKey, secretKey string, testnet bool, hyperliquidWalletAddr, asterUser, asterSigner, asterPrivateKey string) error
	CreateAIModel(userID, id, name, provider string, enabled bool, apiKey, customAPIURL string) error
	CreateExchange(userID, id, name, typ string, enabled bool, apiKey, secretKey string, testnet bool, hyperliquidWalletAddr, asterUser, asterSigner, asterPrivateKey string) error
	CreateTrader(trader *TraderRecord) error
	GetTraders(userID string) ([]*TraderRecord, error)
	UpdateTraderStatus(userID, id string, isRunning bool) error
	UpdateTrader(trader *TraderRecord) error
	UpdateTraderInitialBalance(userID, id string, newBalance float64) error
	UpdateTraderCustomPrompt(userID, id string, customPrompt string, overrideBase bool) error
	DeleteTrader(userID, id string) error
	GetTraderConfig(userID, traderID string) (*TraderRecord, *AIModelConfig, *ExchangeConfig, error)
	GetSystemConfig(key string) (string, error)
	SetSystemConfig(key, value string) error
	CreateUserSignalSource(userID, coinPoolURL, oiTopURL string) error
	GetUserSignalSource(userID string) (*UserSignalSource, error)
	UpdateUserSignalSource(userID, coinPoolURL, oiTopURL string) error
	GetCustomCoins() []string
	LoadBetaCodesFromFile(filePath string) error
	ValidateBetaCode(code string) (bool, error)
	UseBetaCode(code, userEmail string) error
	GetBetaCodeStats() (total, used int, err error)
	Close() error
}

// User 用户配置
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	OTPSecret    string    `json:"-"`
	OTPVerified  bool      `json:"otp_verified"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// AIModelConfig AI模型配置
type AIModelConfig struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	Name            string    `json:"name"`
	Provider        string    `json:"provider"`
	Enabled         bool      `json:"enabled"`
	APIKey          string    `json:"apiKey"`
	CustomAPIURL    string    `json:"customApiUrl"`
	CustomModelName string    `json:"customModelName"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// ExchangeConfig 交易所配置
type ExchangeConfig struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"user_id"`
	Name                  string    `json:"name"`
	Type                  string    `json:"type"`
	Enabled               bool      `json:"enabled"`
	APIKey                string    `json:"apiKey"`
	SecretKey             string    `json:"secretKey"`
	Testnet               bool      `json:"testnet"`
	HyperliquidWalletAddr string    `json:"hyperliquidWalletAddr"`
	AsterUser             string    `json:"asterUser"`
	AsterSigner           string    `json:"asterSigner"`
	AsterPrivateKey       string    `json:"asterPrivateKey"`
	DEXWalletPrivateKey   string    `json:"dexWalletPrivateKey"` // 统一的DEX私钥字段
	Deleted               bool      `json:"deleted"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// TraderRecord 交易员配置
type TraderRecord struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"user_id"`
	Name                 string    `json:"name"`
	AIModelID            string    `json:"ai_model_id"`
	ExchangeID           string    `json:"exchange_id"`
	InitialBalance       float64   `json:"initial_balance"`
	ScanIntervalMinutes  int       `json:"scan_interval_minutes"`
	IsRunning            bool      `json:"is_running"`
	BTCETHLeverage       int       `json:"btc_eth_leverage"`
	AltcoinLeverage      int       `json:"altcoin_leverage"`
	TradingSymbols       string    `json:"trading_symbols"`
	CustomPrompt         string    `json:"custom_prompt"`
	OverrideBasePrompt   bool      `json:"override_base_prompt"`
	SystemPromptTemplate string    `json:"system_prompt_template"`
	IsCrossMargin        bool      `json:"is_cross_margin"`
	UseCoinPool          bool      `json:"use_coin_pool"`
	UseOITop             bool      `json:"use_oi_top"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// UserSignalSource 用户信号源配置
type UserSignalSource struct {
	ID          int       `json:"id"`
	UserID      string    `json:"user_id"`
	CoinPoolURL string    `json:"coin_pool_url"`
	OITopURL    string    `json:"oi_top_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BetaCode 内测码配置
type BetaCode struct {
	Code      string    `json:"code"`
	Used      bool      `json:"used"`
	UsedBy    string    `json:"used_by"`
	UsedAt    time.Time `json:"used_at"`
	CreatedAt time.Time `json:"created_at"`
}

// DatabaseConfig 数据库连接配置
type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
}

// NewDatabaseConfig 创建数据库配置
func NewDatabaseConfig(host string, port int, user, password, database string) *DatabaseConfig {
	return &DatabaseConfig{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		Database: database,
	}
}

// FormatDSN 格式化数据库连接字符串
func (c *DatabaseConfig) FormatDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		c.Host, c.Port, c.User, c.Password, c.Database)
}

// NewDatabase 创建数据库连接（仅支持 PostgreSQL）
func NewDatabase() (DatabaseInterface, error) {
	pgDB, err := NewPostgreSQLDatabase()
	if err != nil {
		return nil, fmt.Errorf("创建PostgreSQL数据库失败: %w", err)
	}
	return pgDB, nil
}