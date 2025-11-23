import React, { useState, useEffect } from 'react'
import type { Exchange } from '../../types'
import { t, type Language } from '../../i18n/translations'
import { api } from '../../lib/api'
import { getExchangeIcon } from '../ExchangeIcons'
import {
  TwoStageKeyModal,
  type TwoStageKeyModalResult,
} from '../TwoStageKeyModal'
import {
  WebCryptoEnvironmentCheck,
  type WebCryptoCheckStatus,
} from '../WebCryptoEnvironmentCheck'
import { BookOpen, Trash2, HelpCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip } from './Tooltip'
import { getShortName } from './utils'
import { getAgentWallet, createAgentWallet, authorizeAgent, confirmBuilderFee, verifyAgentAuthorization, type AgentWallet } from '../../lib/agentWalletBackend'
import { useAccount, useWalletClient } from 'wagmi'
import { signApproveAgent } from '../../lib/hyperliquidApproveAgent'
import { approveHyperliquidBuilderFee } from '../../lib/hyperliquidBuilderFee'
import { ExternalLink } from 'lucide-react'

// NOFX Builder Address
const BUILDER_ADDRESS = '0x891dc6f05ad47a3c1a05da55e7a7517971faaf0d'

interface ExchangeConfigModalProps {
  allExchanges: Exchange[]
  editingExchangeId: string | null
  onSave: (
    exchangeId: string,
    apiKey: string,
    secretKey?: string,
    testnet?: boolean,
    hyperliquidWalletAddr?: string,
    asterUser?: string,
    asterSigner?: string,
    asterPrivateKey?: string
  ) => Promise<void>
  onDelete: (exchangeId: string) => void
  onClose: () => void
  language: Language
}

export function ExchangeConfigModal({
  allExchanges,
  editingExchangeId,
  onSave,
  onDelete,
  onClose,
  language,
}: ExchangeConfigModalProps) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [selectedExchangeId, setSelectedExchangeId] = useState(
    editingExchangeId || ''
  )
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [testnet, setTestnet] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [serverIP, setServerIP] = useState<{
    public_ip: string
    message: string
  } | null>(null)
  const [loadingIP, setLoadingIP] = useState(false)
  const [copiedIP, setCopiedIP] = useState(false)
  const [webCryptoStatus, setWebCryptoStatus] =
    useState<WebCryptoCheckStatus>('idle')

  // 币安配置指南展开状态
  const [showBinanceGuide, setShowBinanceGuide] = useState(false)

  // Aster 特定字段
  const [asterUser, setAsterUser] = useState('')
  const [asterSigner, setAsterSigner] = useState('')
  const [asterPrivateKey, setAsterPrivateKey] = useState('')

  // Hyperliquid 特定字段 - 后端生成的 Agent Wallet
  const [backendAgentWallet, setBackendAgentWallet] =
    useState<AgentWallet | null>(null)
  const [loadingAgentWallet, setLoadingAgentWallet] = useState(false)
  const [authorizingAgent, setAuthorizingAgent] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(false)
  const [regeneratingWallet, setRegeneratingWallet] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [authInvalid, setAuthInvalid] = useState(false) // 授权已失效的标记

  // 安全输入状态
  const [secureInputTarget, setSecureInputTarget] = useState<
    null | 'hyperliquid' | 'aster'
  >(null)

  // 获取当前编辑的交易所信息
  const selectedExchange = allExchanges?.find(
    (e) => e.id === selectedExchangeId
  )

  // 如果是编辑现有交易所，初始化表单数据
  useEffect(() => {
    if (editingExchangeId && selectedExchange) {
      setApiKey(selectedExchange.apiKey || '')
      setSecretKey(selectedExchange.secretKey || '')
      setPassphrase('') // Don't load existing passphrase for security
      setTestnet(selectedExchange.testnet || false)

      // Aster 字段
      setAsterUser(selectedExchange.asterUser || '')
      setAsterSigner(selectedExchange.asterSigner || '')
      setAsterPrivateKey('') // Don't load existing private key for security
    }
  }, [editingExchangeId, selectedExchange])

  // 加载服务器IP（当选择binance时）
  useEffect(() => {
    if (selectedExchangeId === 'binance' && !serverIP) {
      setLoadingIP(true)
      api
        .getServerIP()
        .then((data) => {
          setServerIP(data)
        })
        .catch((err) => {
          console.error('Failed to load server IP:', err)
        })
        .finally(() => {
          setLoadingIP(false)
        })
    }
  }, [selectedExchangeId])

  // 加载后端 Agent Wallet（当选择 Hyperliquid 且连接了钱包时）
  // 无论是创建还是编辑模式都需要加载
  useEffect(() => {
    if (selectedExchangeId === 'hyperliquid' && address) {
      setLoadingAgentWallet(true)
      getAgentWallet(address)
        .then((response) => {
          if (response.success && response.data) {
            setBackendAgentWallet(response.data)
          } else {
            setBackendAgentWallet(null)
          }
        })
        .catch((err) => {
          // 404 means no agent wallet exists, which is fine
          if (!err.message.includes('404')) {
            console.error('Failed to load agent wallet:', err)
          }
          setBackendAgentWallet(null)
        })
        .finally(() => {
          setLoadingAgentWallet(false)
        })
    }
  }, [selectedExchangeId, address])

  const handleCopyIP = async (ip: string) => {
    try {
      // 优先使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(ip)
        setCopiedIP(true)
        setTimeout(() => setCopiedIP(false), 2000)
        toast.success(t('ipCopied', language))
      } else {
        // 降级方案: 使用传统的 execCommand 方法
        const textArea = document.createElement('textarea')
        textArea.value = ip
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          const successful = document.execCommand('copy')
          if (successful) {
            setCopiedIP(true)
            setTimeout(() => setCopiedIP(false), 2000)
            toast.success(t('ipCopied', language))
          } else {
            throw new Error('复制命令执行失败')
          }
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('复制失败:', err)
      // 显示错误提示
      toast.error(
        t('copyIPFailed', language) || `复制失败: ${ip}\n请手动复制此IP地址`
      )
    }
  }

  // 刷新 Agent Wallet 授权状态
  const handleRefreshAuthStatus = async () => {
    if (!address || !backendAgentWallet) return

    setCheckingAuth(true)
    try {
      const result = await verifyAgentAuthorization(address)
      if (result.success) {
        // 检查授权是否有效
        if (!result.authorized) {
          setAuthInvalid(true)
          toast.warning(
            language === 'zh'
              ? '授权已失效！可能已在 Hyperliquid 网站移除。请重新生成 Agent Wallet。'
              : 'Authorization invalid! May have been removed on Hyperliquid. Please regenerate Agent Wallet.'
          )
        } else {
          setAuthInvalid(false)
          toast.success(language === 'zh' ? '授权状态有效' : 'Authorization is valid')
        }
        // 重新获取 Agent Wallet 信息
        const response = await getAgentWallet(address)
        if (response.success && response.data) {
          setBackendAgentWallet(response.data)
        }
      }
    } catch (err) {
      console.error('Failed to check authorization:', err)
      toast.error(language === 'zh' ? '检查授权状态失败' : 'Failed to check authorization')
    } finally {
      setCheckingAuth(false)
    }
  }

  // 重新生成 Agent Wallet（新地址、新私钥）
  const handleRegenerateAgentWallet = async () => {
    if (!address || !isConnected || !walletClient) {
      toast.error(language === 'zh' ? '请先连接钱包' : 'Please connect wallet first')
      return
    }

    setRegeneratingWallet(true)
    try {
      // 步骤 1: 创建新的 Agent Wallet（强制重新生成）
      toast.info(language === 'zh' ? '正在生成新的 Agent Wallet...' : 'Creating new Agent Wallet...')
      const createResponse = await createAgentWallet(address, 'Mainnet', true) // regenerate=true

      if (!createResponse.success) {
        throw new Error(createResponse.message || 'Failed to create agent wallet')
      }

      // 等待数据库事务完成
      await new Promise(resolve => setTimeout(resolve, 800))

      // 重新获取新的 Agent Wallet
      const response = await getAgentWallet(address)
      if (!response.success || !response.data) {
        throw new Error('Failed to load new agent wallet')
      }

      const newAgentWallet = response.data
      setBackendAgentWallet(newAgentWallet)

      // 步骤 2: 立即授权新的 Agent Wallet
      toast.info(language === 'zh' ? '请在钱包中签名授权...' : 'Please sign in wallet...')

      const { signature, signatureHex, nonce } = await signApproveAgent(
        walletClient,
        {
          agentAddress: newAgentWallet.agent_address,
          agentName: 'NOFX',
          hyperliquidChain: (newAgentWallet.hyperliquid_chain || 'Mainnet') as 'Mainnet' | 'Testnet',
        }
      )

      const authResponse = await authorizeAgent({
        main_wallet: address,
        signature: signatureHex,
        agent_name: 'NOFX',
        nonce,
        signature_rsv: signature,
      })

      if (!authResponse.success) {
        throw new Error(authResponse.message || 'Authorization failed')
      }

      // 步骤 3: 完成配置
      toast.info(language === 'zh' ? '请签名完成配置...' : 'Please sign to complete setup...')

      const builderFeeResult = await approveHyperliquidBuilderFee(
        walletClient,
        {
          builderAddress: BUILDER_ADDRESS,
          maxFeeRate: 100,
          hyperliquidChain: (newAgentWallet.hyperliquid_chain || 'Mainnet') as 'Mainnet' | 'Testnet',
        }
      )

      if (builderFeeResult.success) {
        await confirmBuilderFee(address, 100)
      }

      // 刷新状态
      const refreshed = await getAgentWallet(address)
      if (refreshed.success && refreshed.data) {
        setBackendAgentWallet(refreshed.data)
      }

      setAuthInvalid(false)
      setShowRegenerateConfirm(false)
      toast.success(language === 'zh' ? '新 Agent Wallet 已创建并授权成功！' : 'New Agent Wallet created and authorized!')
    } catch (err: any) {
      console.error('Regenerate agent wallet failed:', err)
      toast.error(err.message || (language === 'zh' ? '重新生成失败' : 'Regeneration failed'))
    } finally {
      setRegeneratingWallet(false)
    }
  }

  // 在 Modal 中重新授权 Agent Wallet
  const handleReauthorizeAgent = async () => {
    if (!address || !isConnected || !walletClient || !backendAgentWallet) {
      toast.error(language === 'zh' ? '请先连接钱包' : 'Please connect wallet first')
      return
    }

    setAuthorizingAgent(true)
    try {
      // 步骤 1: 签名 ApproveAgent 消息
      toast.info(language === 'zh' ? '请在钱包中签名授权...' : 'Please sign in wallet...')

      const { signature, signatureHex, nonce } = await signApproveAgent(
        walletClient,
        {
          agentAddress: backendAgentWallet.agent_address,
          agentName: 'NOFX',
          hyperliquidChain: (backendAgentWallet.hyperliquid_chain || 'Mainnet') as 'Mainnet' | 'Testnet',
        }
      )

      // 提交到后端
      const response = await authorizeAgent({
        main_wallet: address,
        signature: signatureHex,
        agent_name: 'NOFX',
        nonce,
        signature_rsv: signature,
      })

      if (!response.success) {
        throw new Error(response.message || 'Authorization failed')
      }

      // 步骤 2: 完成配置
      toast.info(language === 'zh' ? '请签名完成配置...' : 'Please sign to complete setup...')

      const builderFeeResult = await approveHyperliquidBuilderFee(
        walletClient,
        {
          builderAddress: BUILDER_ADDRESS,
          maxFeeRate: 100,
          hyperliquidChain: (backendAgentWallet.hyperliquid_chain || 'Mainnet') as 'Mainnet' | 'Testnet',
        }
      )

      if (builderFeeResult.success) {
        await confirmBuilderFee(address, 100)
      }

      // 刷新状态
      const refreshed = await getAgentWallet(address)
      if (refreshed.success && refreshed.data) {
        setBackendAgentWallet(refreshed.data)
      }

      toast.success(language === 'zh' ? '授权成功！' : 'Authorization successful!')
    } catch (err: any) {
      console.error('Authorization failed:', err)
      toast.error(err.message || (language === 'zh' ? '授权失败' : 'Authorization failed'))
    } finally {
      setAuthorizingAgent(false)
    }
  }

  // 安全输入处理函数
  const secureInputContextLabel =
    secureInputTarget === 'aster'
      ? t('asterExchangeName', language)
      : secureInputTarget === 'hyperliquid'
        ? t('hyperliquidExchangeName', language)
        : undefined

  const handleSecureInputCancel = () => {
    setSecureInputTarget(null)
  }

  const handleSecureInputComplete = ({
    value,
    obfuscationLog,
  }: TwoStageKeyModalResult) => {
    const trimmed = value.trim()
    if (secureInputTarget === 'hyperliquid') {
      setApiKey(trimmed)
    }
    if (secureInputTarget === 'aster') {
      setAsterPrivateKey(trimmed)
    }
    console.log('Secure input obfuscation log:', obfuscationLog)
    setSecureInputTarget(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExchangeId) return

    // 根据交易所类型验证不同字段
    if (selectedExchange?.id === 'binance') {
      if (!apiKey.trim() || !secretKey.trim()) return
      await onSave(selectedExchangeId, apiKey.trim(), secretKey.trim(), testnet)
    } else if (selectedExchange?.id === 'hyperliquid') {
      // 使用后端生成的 Agent Wallet（使用特殊标识 "BACKEND_AGENT"）
      if (!backendAgentWallet) {
        toast.error(t('pleaseCreateAgentWallet', language))
        return
      }
      await onSave(
        selectedExchangeId,
        'BACKEND_AGENT:' + backendAgentWallet.agent_address,
        '',
        testnet,
        backendAgentWallet.main_wallet
      )
    } else if (selectedExchange?.id === 'aster') {
      if (!asterUser.trim() || !asterSigner.trim() || !asterPrivateKey.trim())
        return
      await onSave(
        selectedExchangeId,
        '',
        '',
        testnet,
        undefined,
        asterUser.trim(),
        asterSigner.trim(),
        asterPrivateKey.trim()
      )
    } else if (selectedExchange?.id === 'okx') {
      if (!apiKey.trim() || !secretKey.trim() || !passphrase.trim()) return
      await onSave(selectedExchangeId, apiKey.trim(), secretKey.trim(), testnet)
    } else {
      // 默认情况（其他CEX交易所）
      if (!apiKey.trim() || !secretKey.trim()) return
      await onSave(selectedExchangeId, apiKey.trim(), secretKey.trim(), testnet)
    }
  }

  // 可选择的交易所列表（所有支持的交易所）
  const availableExchanges = allExchanges || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className="bg-gray-800 rounded-lg w-full max-w-lg relative my-8"
        style={{
          background: '#1E2329',
          maxHeight: 'calc(100vh - 4rem)',
        }}
      >
        <div
          className="flex items-center justify-between p-6 pb-4 sticky top-0 z-10"
          style={{ background: '#1E2329' }}
        >
          <h3 className="text-xl font-bold" style={{ color: '#EAECEF' }}>
            {editingExchangeId
              ? t('editExchange', language)
              : t('addExchange', language)}
          </h3>
          <div className="flex items-center gap-2">
            {selectedExchange?.id === 'binance' && (
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="px-3 py-2 rounded text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
                style={{
                  background: 'rgba(240, 185, 11, 0.1)',
                  color: '#F0B90B',
                }}
              >
                <BookOpen className="w-4 h-4" />
                {t('viewGuide', language)}
              </button>
            )}
            {editingExchangeId && (
              <button
                type="button"
                onClick={() => onDelete(editingExchangeId)}
                className="p-2 rounded hover:bg-red-100 transition-colors"
                style={{
                  background: 'rgba(246, 70, 93, 0.1)',
                  color: '#F6465D',
                }}
                title={t('delete', language)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div
            className="space-y-4 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 16rem)' }}
          >
            {!editingExchangeId && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#F0B90B' }}
                  >
                    {t('environmentSteps.checkTitle', language)}
                  </div>
                  <WebCryptoEnvironmentCheck
                    language={language}
                    variant="card"
                    onStatusChange={setWebCryptoStatus}
                  />
                </div>
                <div className="space-y-2">
                  <div
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#F0B90B' }}
                  >
                    {t('environmentSteps.selectTitle', language)}
                  </div>
                  <select
                    value={selectedExchangeId}
                    onChange={(e) => setSelectedExchangeId(e.target.value)}
                    className="w-full px-3 py-2 rounded"
                    style={{
                      background: '#0B0E11',
                      border: '1px solid #2B3139',
                      color: '#EAECEF',
                    }}
                    aria-label={t('selectExchange', language)}
                    disabled={webCryptoStatus !== 'secure'}
                    required
                  >
                    <option value="">
                      {t('pleaseSelectExchange', language)}
                    </option>
                    {availableExchanges.map((exchange) => (
                      <option key={exchange.id} value={exchange.id}>
                        {getShortName(exchange.name)} (
                        {exchange.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedExchange && (
              <div
                className="p-4 rounded"
                style={{ background: '#0B0E11', border: '1px solid #2B3139' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getExchangeIcon(selectedExchange.id, {
                      width: 32,
                      height: 32,
                    })}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: '#EAECEF' }}>
                      {getShortName(selectedExchange.name)}
                    </div>
                    <div className="text-xs" style={{ color: '#848E9C' }}>
                      {selectedExchange.type.toUpperCase()} •{' '}
                      {selectedExchange.id}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedExchange && (
              <>
                {/* Binance 和其他 CEX 交易所的字段 */}
                {(selectedExchange.id === 'binance' ||
                  selectedExchange.type === 'cex') &&
                  selectedExchange.id !== 'hyperliquid' &&
                  selectedExchange.id !== 'aster' && (
                    <>
                      {/* 币安用户配置提示 (D1 方案) */}
                      {selectedExchange.id === 'binance' && (
                        <div
                          className="mb-4 p-3 rounded cursor-pointer transition-colors"
                          style={{
                            background: '#1a3a52',
                            border: '1px solid #2b5278',
                          }}
                          onClick={() => setShowBinanceGuide(!showBinanceGuide)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span style={{ color: '#58a6ff' }}>ℹ️</span>
                              <span
                                className="text-sm font-medium"
                                style={{ color: '#EAECEF' }}
                              >
                                <strong>
                                  {t('binanceUserMustRead', language)}
                                </strong>{' '}
                                {t('binanceApiTypeWarning', language)}
                              </span>
                            </div>
                            <span style={{ color: '#8b949e' }}>
                              {showBinanceGuide ? '▲' : '▼'}
                            </span>
                          </div>

                          {/* 展开的详细说明 */}
                          {showBinanceGuide && (
                            <div
                              className="mt-3 pt-3"
                              style={{
                                borderTop: '1px solid #2b5278',
                                fontSize: '0.875rem',
                                color: '#c9d1d9',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="mb-2" style={{ color: '#8b949e' }}>
                                {t('binanceApiTypeReason', language)}
                              </p>

                              <p
                                className="font-semibold mb-1"
                                style={{ color: '#EAECEF' }}
                              >
                                {t('binanceConfigSteps', language)}
                              </p>
                              <ol
                                className="list-decimal list-inside space-y-1 mb-3"
                                style={{ paddingLeft: '0.5rem' }}
                              >
                                <li>{t('binanceStep1', language)}</li>
                                <li>{t('binanceStep2', language)}</li>
                                <li>{t('binanceStep3', language)}</li>
                                <li>{t('binanceStep4', language)}</li>
                              </ol>

                              <p
                                className="mb-2 p-2 rounded"
                                style={{
                                  background: '#3d2a00',
                                  border: '1px solid #9e6a03',
                                }}
                              >
                                💡{' '}
                                <strong>
                                  {t('binanceMultiAssetNote', language)}
                                </strong>{' '}
                                {t('binanceMultiAssetWarning', language)}
                              </p>

                              <a
                                href={
                                  language === 'zh'
                                    ? 'https://www.binance.com/zh-CN/support/faq/how-to-create-api-keys-on-binance-360002502072'
                                    : 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm hover:underline"
                                style={{ color: '#58a6ff' }}
                              >
                                📖 {t('viewBinanceGuide', language)} ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: '#EAECEF' }}
                        >
                          {t('apiKey', language)}
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={t('enterAPIKey', language)}
                          className="w-full px-3 py-2 rounded"
                          style={{
                            background: '#0B0E11',
                            border: '1px solid #2B3139',
                            color: '#EAECEF',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: '#EAECEF' }}
                        >
                          {t('secretKey', language)}
                        </label>
                        <input
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder={t('enterSecretKey', language)}
                          className="w-full px-3 py-2 rounded"
                          style={{
                            background: '#0B0E11',
                            border: '1px solid #2B3139',
                            color: '#EAECEF',
                          }}
                          required
                        />
                      </div>

                      {selectedExchange.id === 'okx' && (
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: '#EAECEF' }}
                          >
                            {t('passphrase', language)}
                          </label>
                          <input
                            type="password"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder={t('enterPassphrase', language)}
                            className="w-full px-3 py-2 rounded"
                            style={{
                              background: '#0B0E11',
                              border: '1px solid #2B3139',
                              color: '#EAECEF',
                            }}
                            required
                          />
                        </div>
                      )}

                      {/* Binance 白名单IP提示 */}
                      {selectedExchange.id === 'binance' && (
                        <div
                          className="p-4 rounded"
                          style={{
                            background: 'rgba(240, 185, 11, 0.1)',
                            border: '1px solid rgba(240, 185, 11, 0.2)',
                          }}
                        >
                          <div
                            className="text-sm font-semibold mb-2"
                            style={{ color: '#F0B90B' }}
                          >
                            {t('whitelistIP', language)}
                          </div>
                          <div
                            className="text-xs mb-3"
                            style={{ color: '#848E9C' }}
                          >
                            {t('whitelistIPDesc', language)}
                          </div>

                          {loadingIP ? (
                            <div
                              className="text-xs"
                              style={{ color: '#848E9C' }}
                            >
                              {t('loadingServerIP', language)}
                            </div>
                          ) : serverIP && serverIP.public_ip ? (
                            <div
                              className="flex items-center gap-2 p-2 rounded"
                              style={{ background: '#0B0E11' }}
                            >
                              <code
                                className="flex-1 text-sm font-mono"
                                style={{ color: '#F0B90B' }}
                              >
                                {serverIP.public_ip}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyIP(serverIP.public_ip)}
                                className="px-3 py-1 rounded text-xs font-semibold transition-all hover:scale-105"
                                style={{
                                  background: 'rgba(240, 185, 11, 0.2)',
                                  color: '#F0B90B',
                                }}
                              >
                                {copiedIP
                                  ? t('ipCopied', language)
                                  : t('copyIP', language)}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </>
                  )}

                {/* Aster 交易所的字段 */}
                {selectedExchange.id === 'aster' && (
                  <>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2 flex items-center gap-2"
                        style={{ color: '#EAECEF' }}
                      >
                        {t('user', language)}
                        <Tooltip content={t('asterUserDesc', language)}>
                          <HelpCircle
                            className="w-4 h-4 cursor-help"
                            style={{ color: '#F0B90B' }}
                          />
                        </Tooltip>
                      </label>
                      <input
                        type="text"
                        value={asterUser}
                        onChange={(e) => setAsterUser(e.target.value)}
                        placeholder={t('enterUser', language)}
                        className="w-full px-3 py-2 rounded"
                        style={{
                          background: '#0B0E11',
                          border: '1px solid #2B3139',
                          color: '#EAECEF',
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-semibold mb-2 flex items-center gap-2"
                        style={{ color: '#EAECEF' }}
                      >
                        {t('signer', language)}
                        <Tooltip content={t('asterSignerDesc', language)}>
                          <HelpCircle
                            className="w-4 h-4 cursor-help"
                            style={{ color: '#F0B90B' }}
                          />
                        </Tooltip>
                      </label>
                      <input
                        type="text"
                        value={asterSigner}
                        onChange={(e) => setAsterSigner(e.target.value)}
                        placeholder={t('enterSigner', language)}
                        className="w-full px-3 py-2 rounded"
                        style={{
                          background: '#0B0E11',
                          border: '1px solid #2B3139',
                          color: '#EAECEF',
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-semibold mb-2 flex items-center gap-2"
                        style={{ color: '#EAECEF' }}
                      >
                        {t('privateKey', language)}
                        <Tooltip content={t('asterPrivateKeyDesc', language)}>
                          <HelpCircle
                            className="w-4 h-4 cursor-help"
                            style={{ color: '#F0B90B' }}
                          />
                        </Tooltip>
                      </label>
                      <input
                        type="password"
                        value={asterPrivateKey}
                        onChange={(e) => setAsterPrivateKey(e.target.value)}
                        placeholder={t('enterPrivateKey', language)}
                        className="w-full px-3 py-2 rounded"
                        style={{
                          background: '#0B0E11',
                          border: '1px solid #2B3139',
                          color: '#EAECEF',
                        }}
                        required
                      />
                    </div>
                  </>
                )}

                {/* Hyperliquid 交易所的字段 */}
                {selectedExchange.id === 'hyperliquid' && (
                  <>
                    {/* 安全提示 banner */}
                    <div
                      className="p-3 rounded mb-4"
                      style={{
                        background: 'rgba(240, 185, 11, 0.1)',
                        border: '1px solid rgba(240, 185, 11, 0.3)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span style={{ color: '#F0B90B', fontSize: '16px' }}>
                          🔐
                        </span>
                        <div className="flex-1">
                          <div
                            className="text-sm font-semibold mb-1"
                            style={{ color: '#F0B90B' }}
                          >
                            {t('hyperliquidAgentWalletTitle', language)}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: '#848E9C', lineHeight: '1.5' }}
                          >
                            {t('hyperliquidAgentWalletDesc', language)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 后端 Agent Wallet 状态 */}
                    {!editingExchangeId && (
                      <>
                        {/* 未连接钱包提示 */}
                        {!address && (
                          <div
                            className="p-4 rounded mb-4"
                            style={{
                              background: 'rgba(248, 81, 73, 0.1)',
                              border: '1px solid rgba(248, 81, 73, 0.3)',
                            }}
                          >
                            <div
                              className="text-sm font-semibold mb-2"
                              style={{ color: '#F85149' }}
                            >
                              ⚠️ {t('walletConnectionRequired', language)}
                            </div>
                            <div
                              className="text-xs mb-3"
                              style={{ color: '#848E9C' }}
                            >
                              {t('walletConnectionRequiredDesc', language)}
                            </div>
                            <a
                              href="/agent-wallet"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-2 rounded text-sm font-semibold transition-all hover:scale-105"
                              style={{
                                background: '#F85149',
                                color: '#FFF',
                              }}
                            >
                              {t('goToAgentWallet', language)} →
                            </a>
                          </div>
                        )}

                        {loadingAgentWallet && (
                          <div
                            className="flex items-center gap-2 mb-4 text-xs"
                            style={{ color: '#848E9C' }}
                          >
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            {t('loadingAgentWallet', language)}
                          </div>
                        )}
                        {!loadingAgentWallet &&
                          !backendAgentWallet &&
                          address && (
                            <div
                              className="p-4 rounded mb-4"
                              style={{
                                background: 'rgba(240, 185, 11, 0.1)',
                                border: '1px solid rgba(240, 185, 11, 0.3)',
                              }}
                            >
                              <div
                                className="text-sm font-semibold mb-2"
                                style={{ color: '#F0B90B' }}
                              >
                                ⚠️ {t('agentWalletRequired', language)}
                              </div>
                              <div
                                className="text-xs mb-3"
                                style={{ color: '#848E9C' }}
                              >
                                {t('agentWalletRequiredDesc', language)}
                              </div>
                              <a
                                href="/agent-wallet"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-3 py-2 rounded text-sm font-semibold transition-all hover:scale-105"
                                style={{
                                  background: '#F0B90B',
                                  color: '#000',
                                }}
                              >
                                {t('goToCreateAgentWallet', language)} →
                              </a>
                            </div>
                          )}
                      </>
                    )}

                    {/* 显示 Agent Wallet 信息 */}
                    {backendAgentWallet ? (
                      /* 使用后端生成的 Agent Wallet */
                      <>
                        <div
                          className="p-4 rounded mb-4"
                          style={{
                            background: 'rgba(14, 203, 129, 0.1)',
                            border: '1px solid rgba(14, 203, 129, 0.2)',
                          }}
                        >
                          <div className="space-y-2">
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: '#848E9C' }}
                              >
                                {t('agentAddress', language)}
                              </span>
                              <code
                                className="block mt-1 px-2 py-1 rounded font-mono text-xs"
                                style={{
                                  background: '#0B0E11',
                                  color: '#0ECB81',
                                }}
                              >
                                {backendAgentWallet.agent_address}
                              </code>
                            </div>
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: '#848E9C' }}
                              >
                                {t('mainWallet', language)}
                              </span>
                              <code
                                className="block mt-1 px-2 py-1 rounded font-mono text-xs"
                                style={{
                                  background: '#0B0E11',
                                  color: '#0ECB81',
                                }}
                              >
                                {backendAgentWallet.main_wallet}
                              </code>
                            </div>
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: '#848E9C' }}
                              >
                                {t('agentWalletStatus', language)}
                              </span>
                              <span
                                className="ml-2 px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  background:
                                    backendAgentWallet.status === 'ACTIVE'
                                      ? 'rgba(14, 203, 129, 0.2)'
                                      : 'rgba(240, 185, 11, 0.2)',
                                  color:
                                    backendAgentWallet.status === 'ACTIVE'
                                      ? '#0ECB81'
                                      : '#F0B90B',
                                }}
                              >
                                {backendAgentWallet.status}
                              </span>
                            </div>
                          </div>

                          {/* 授权失效警告 */}
                          {authInvalid && (
                            <div
                              className="mt-3 p-3 rounded"
                              style={{
                                background: 'rgba(246, 70, 93, 0.1)',
                                border: '1px solid rgba(246, 70, 93, 0.3)',
                              }}
                            >
                              <p className="text-xs font-semibold mb-2" style={{ color: '#F6465D' }}>
                                ⚠️ {language === 'zh' ? '授权已失效' : 'Authorization Invalid'}
                              </p>
                              <p className="text-xs mb-3" style={{ color: '#848E9C' }}>
                                {language === 'zh'
                                  ? '检测到您的 Agent Wallet 授权已在 Hyperliquid 上被移除。当前的 Agent Wallet 无法使用，需要生成新的 Agent Wallet 并重新授权。'
                                  : 'Your Agent Wallet authorization has been removed on Hyperliquid. The current Agent Wallet cannot be used. You need to generate a new Agent Wallet and re-authorize.'}
                              </p>
                              {!showRegenerateConfirm ? (
                                <button
                                  type="button"
                                  onClick={() => setShowRegenerateConfirm(true)}
                                  className="px-3 py-1.5 rounded text-xs font-semibold"
                                  style={{
                                    background: '#F6465D',
                                    color: '#FFF',
                                  }}
                                >
                                  🔄 {language === 'zh' ? '重新生成 Agent Wallet' : 'Regenerate Agent Wallet'}
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs" style={{ color: '#F0B90B' }}>
                                    {language === 'zh'
                                      ? '确认要生成新的 Agent Wallet 吗？这将创建新的地址和私钥，并需要重新签名授权（2次签名）。'
                                      : 'Confirm generating a new Agent Wallet? This will create a new address and private key, requiring re-authorization (2 signatures).'}
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleRegenerateAgentWallet}
                                      disabled={regeneratingWallet}
                                      className="px-3 py-1.5 rounded text-xs font-semibold"
                                      style={{
                                        background: regeneratingWallet ? '#666' : '#F6465D',
                                        color: '#FFF',
                                      }}
                                    >
                                      {regeneratingWallet
                                        ? (language === 'zh' ? '生成中...' : 'Generating...')
                                        : (language === 'zh' ? '确认生成' : 'Confirm')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowRegenerateConfirm(false)}
                                      disabled={regeneratingWallet}
                                      className="px-3 py-1.5 rounded text-xs font-semibold"
                                      style={{
                                        background: '#2B3139',
                                        color: '#848E9C',
                                      }}
                                    >
                                      {language === 'zh' ? '取消' : 'Cancel'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 操作按钮区 */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {/* 刷新授权状态 */}
                            <button
                              type="button"
                              onClick={handleRefreshAuthStatus}
                              disabled={checkingAuth}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all"
                              style={{
                                background: '#2B3139',
                                color: '#EAECEF',
                                border: '1px solid #3B4149',
                              }}
                            >
                              <RefreshCw size={12} className={checkingAuth ? 'animate-spin' : ''} />
                              {checkingAuth
                                ? (language === 'zh' ? '检查中...' : 'Checking...')
                                : (language === 'zh' ? '检查授权' : 'Check Auth')}
                            </button>

                            {/* 重新授权 - 仅在授权未失效时显示 */}
                            {!authInvalid && (
                              <button
                                type="button"
                                onClick={handleReauthorizeAgent}
                                disabled={authorizingAgent || !isConnected}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all"
                                style={{
                                  background: backendAgentWallet.status === 'ACTIVE' ? '#2B3139' : '#F0B90B',
                                  color: backendAgentWallet.status === 'ACTIVE' ? '#EAECEF' : '#000',
                                  border: backendAgentWallet.status === 'ACTIVE' ? '1px solid #3B4149' : 'none',
                                }}
                              >
                                🔐 {authorizingAgent
                                  ? (language === 'zh' ? '授权中...' : 'Authorizing...')
                                  : (language === 'zh' ? '重新授权' : 'Re-authorize')}
                              </button>
                            )}

                            {/* Hyperliquid API 管理连结 */}
                            <a
                              href="https://app.hyperliquid.xyz/API"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all"
                              style={{
                                background: 'transparent',
                                color: '#848E9C',
                                border: '1px solid #3B4149',
                                textDecoration: 'none',
                              }}
                            >
                              <ExternalLink size={12} />
                              {language === 'zh' ? 'API 管理' : 'API Management'}
                            </a>
                          </div>

                          {/* 如果状态不是 ACTIVE，显示警告提示 */}
                          {backendAgentWallet.status !== 'ACTIVE' && (
                            <div
                              className="mt-3 p-3 rounded"
                              style={{
                                background: 'rgba(240, 185, 11, 0.1)',
                                border: '1px solid rgba(240, 185, 11, 0.3)',
                              }}
                            >
                              <p
                                className="text-xs"
                                style={{ color: '#F0B90B' }}
                              >
                                ⚠️ {t('authorizationRequired', language)} - {t('authorizationRequiredDesc', language)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Main Wallet Address (自动填充) */}
                        <div>
                          <label
                            className="block text-sm font-semibold mb-2"
                            style={{ color: '#EAECEF' }}
                          >
                            {t('hyperliquidMainWalletAddress', language)}
                          </label>
                          <input
                            type="text"
                            value={backendAgentWallet.main_wallet}
                            readOnly
                            className="w-full px-3 py-2 rounded"
                            style={{
                              background: '#0B0E11',
                              border: '1px solid #2B3139',
                              color: '#848E9C',
                              cursor: 'not-allowed',
                            }}
                          />
                          <div
                            className="text-xs mt-1"
                            style={{ color: '#848E9C' }}
                          >
                            {t('backendAgentWalletDesc', language)}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </>
                )}
              </>
            )}
          </div>

          <div
            className="flex gap-3 mt-6 pt-4 sticky bottom-0"
            style={{ background: '#1E2329' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded text-sm font-semibold"
              style={{ background: '#2B3139', color: '#848E9C' }}
            >
              {t('cancel', language)}
            </button>
            <button
              type="submit"
              disabled={
                !selectedExchange ||
                (selectedExchange.id === 'binance' &&
                  (!apiKey.trim() || !secretKey.trim())) ||
                (selectedExchange.id === 'okx' &&
                  (!apiKey.trim() ||
                    !secretKey.trim() ||
                    !passphrase.trim())) ||
                (selectedExchange.id === 'hyperliquid' &&
                  (!backendAgentWallet ||
                    backendAgentWallet.status !== 'ACTIVE' ||
                    authInvalid)) || // 验证后端 Agent Wallet 存在且已授权，且授权未失效
                (selectedExchange.id === 'aster' &&
                  (!asterUser.trim() ||
                    !asterSigner.trim() ||
                    !asterPrivateKey.trim())) ||
                (selectedExchange.type === 'cex' &&
                  selectedExchange.id !== 'hyperliquid' &&
                  selectedExchange.id !== 'aster' &&
                  selectedExchange.id !== 'binance' &&
                  selectedExchange.id !== 'okx' &&
                  (!apiKey.trim() || !secretKey.trim()))
              }
              className="flex-1 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
              style={{ background: '#F0B90B', color: '#000' }}
            >
              {t('saveConfig', language)}
            </button>
          </div>
        </form>
      </div>

      {/* Binance Setup Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl relative"
            style={{ background: '#1E2329' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: '#EAECEF' }}
              >
                <BookOpen className="w-6 h-6" style={{ color: '#F0B90B' }} />
                {t('binanceSetupGuide', language)}
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105"
                style={{ background: '#2B3139', color: '#848E9C' }}
              >
                {t('closeGuide', language)}
              </button>
            </div>
            <div className="overflow-y-auto max-h-[80vh]">
              <img
                src="/images/guide.png"
                alt={t('binanceSetupGuide', language)}
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Two Stage Key Modal */}
      <TwoStageKeyModal
        isOpen={secureInputTarget !== null}
        language={language}
        contextLabel={secureInputContextLabel}
        expectedLength={64}
        onCancel={handleSecureInputCancel}
        onComplete={handleSecureInputComplete}
      />
    </div>
  )
}
