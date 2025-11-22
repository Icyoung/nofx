/**
 * Hyperliquid Deposit Card Component
 *
 * Allows users to deposit USDC from Arbitrum to Hyperliquid
 * without leaving the application.
 *
 * Features:
 * - Shows Arbitrum USDC balance
 * - Network detection and switching
 * - Amount input with validation
 * - One-click deposit with status tracking
 */

import { useState, useEffect } from 'react'
import { ArrowDownCircle, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useAccount, useWalletClient } from 'wagmi'
import { useSwitchChain } from 'wagmi'
import {
  depositToHyperliquid,
  getArbitrumUSDCBalance,
  isCorrectArbitrumNetwork,
  getRequiredArbitrumChain,
  getMinimumDeposit,
} from '../lib/hyperliquidDeposit'
import { useLanguage } from '../contexts/LanguageContext'

interface HyperliquidDepositCardProps {
  hyperliquidChain: 'Mainnet' | 'Testnet'
  onDepositSuccess?: () => void
}

export function HyperliquidDepositCard({
  hyperliquidChain,
  onDepositSuccess,
}: HyperliquidDepositCardProps) {
  const { language } = useLanguage()
  const { address, isConnected, chain } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()

  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [depositing, setDepositing] = useState(false)
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error'
    message: string
  }>({ type: 'idle', message: '' })

  const minDeposit = getMinimumDeposit()
  const requiredChain = getRequiredArbitrumChain(hyperliquidChain)
  const isCorrectNetwork = chain && isCorrectArbitrumNetwork(chain.id, hyperliquidChain)

  // Load balance
  useEffect(() => {
    if (walletClient && isCorrectNetwork) {
      loadBalance()
    }
  }, [walletClient, isCorrectNetwork])

  const loadBalance = async () => {
    if (!walletClient) return

    try {
      setBalanceLoading(true)
      const result = await getArbitrumUSDCBalance(walletClient, hyperliquidChain)

      if (result.success && result.balance !== undefined) {
        setBalance(result.balance)
      } else {
        setBalance(null)
      }
    } catch (err) {
      console.error('Failed to load balance:', err)
      setBalance(null)
    } finally {
      setBalanceLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!walletClient || !amount) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < minDeposit) {
      setStatus({
        type: 'error',
        message: language === 'zh'
          ? `最小存款金額為 ${minDeposit} USDC`
          : `Minimum deposit is ${minDeposit} USDC`,
      })
      return
    }

    try {
      setDepositing(true)
      setStatus({ type: 'idle', message: '' })

      const result = await depositToHyperliquid(walletClient, {
        amount: amountNum,
        hyperliquidChain,
      })

      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message,
        })
        setAmount('')

        // Wait 2 seconds before reloading balance and triggering callback
        setTimeout(() => {
          loadBalance()
          onDepositSuccess?.()
        }, 2000)
      } else {
        setStatus({
          type: 'error',
          message: result.message,
        })
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Deposit failed',
      })
    } finally {
      setDepositing(false)
    }
  }

  const handleSwitchNetwork = async () => {
    if (!switchChain) return

    try {
      await switchChain({ chainId: requiredChain.id })
    } catch (err) {
      console.error('Failed to switch network:', err)
    }
  }

  if (!isConnected || !address) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: '#0a0a0a', border: '1px solid #2b3139' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <ArrowDownCircle className="h-5 w-5" style={{ color: '#F0B90B' }} />
          <h3 className="text-lg font-semibold" style={{ color: '#EAECEF' }}>
            {language === 'zh' ? '存入 USDC' : 'Deposit USDC'}
          </h3>
        </div>
        <p className="text-sm" style={{ color: '#848E9C' }}>
          {language === 'zh' ? '請先連接錢包' : 'Please connect your wallet'}
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: '#0a0a0a', border: '1px solid #2b3139' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ArrowDownCircle className="h-5 w-5" style={{ color: '#F0B90B' }} />
          <h3 className="text-lg font-semibold" style={{ color: '#EAECEF' }}>
            {language === 'zh' ? '快速存款' : 'Quick Deposit'}
          </h3>
        </div>
        {isCorrectNetwork && (
          <button
            onClick={loadBalance}
            disabled={balanceLoading}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ color: '#848E9C' }}
          >
            <RefreshCw className={`h-3 w-3 ${balanceLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Wrong Network Warning */}
      {!isCorrectNetwork && (
        <div
          className="rounded-lg p-4 mb-4"
          style={{
            background: 'rgba(246, 70, 93, 0.1)',
            border: '1px solid rgba(246, 70, 93, 0.3)',
          }}
        >
          <p className="text-sm mb-2" style={{ color: '#F6465D' }}>
            <strong>⚠️ {language === 'zh' ? '網絡錯誤' : 'Wrong Network'}</strong>
          </p>
          <p className="text-sm mb-3" style={{ color: '#848E9C' }}>
            {language === 'zh'
              ? `請切換到 ${requiredChain.name} 網絡以存入 USDC`
              : `Please switch to ${requiredChain.name} to deposit USDC`}
          </p>
          <button
            onClick={handleSwitchNetwork}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'linear-gradient(135deg, #F0B90B 0%, #d9a309 100%)',
              color: '#000000',
            }}
          >
            {language === 'zh' ? `切換到 ${requiredChain.name}` : `Switch to ${requiredChain.name}`}
          </button>
        </div>
      )}

      {/* Balance Display */}
      {isCorrectNetwork && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: '#848E9C' }}>
              {language === 'zh' ? 'Arbitrum USDC 餘額' : 'Arbitrum USDC Balance'}
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: balanceLoading ? '#848E9C' : balance !== null ? '#0ECB81' : '#F6465D',
              }}
            >
              {balanceLoading ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {language === 'zh' ? '查詢中...' : 'Loading...'}
                </span>
              ) : balance !== null ? (
                `${balance.toFixed(2)} USDC`
              ) : (
                language === 'zh' ? '查詢失敗' : 'Failed to load'
              )}
            </span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      {isCorrectNetwork && (
        <div className="mb-4">
          <label className="block text-sm mb-2" style={{ color: '#EAECEF' }}>
            {language === 'zh' ? '存款金額' : 'Deposit Amount'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`${language === 'zh' ? '最少' : 'Min'} ${minDeposit} USDC`}
              min={minDeposit}
              step="1"
              disabled={depositing}
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{
                background: '#0B0E11',
                border: '1px solid #2B3139',
                color: '#EAECEF',
              }}
            />
            {balance !== null && (
              <button
                onClick={() => setAmount(balance.toString())}
                disabled={depositing}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: '#2b3139',
                  color: '#EAECEF',
                }}
              >
                {language === 'zh' ? '最大' : 'MAX'}
              </button>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: '#848E9C' }}>
            {language === 'zh'
              ? `最小存款：${minDeposit} USDC，處理時間 < 1 分鐘`
              : `Minimum deposit: ${minDeposit} USDC, processing time < 1 minute`}
          </p>
        </div>
      )}

      {/* Deposit Button */}
      {isCorrectNetwork && (
        <button
          onClick={handleDeposit}
          disabled={!amount || depositing || parseFloat(amount) < minDeposit}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: depositing
              ? 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
              : 'linear-gradient(135deg, #F0B90B 0%, #d9a309 100%)',
            color: '#000000',
          }}
        >
          {depositing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {language === 'zh' ? '處理中...' : 'Processing...'}
            </>
          ) : (
            <>
              <ArrowDownCircle className="h-4 w-4" />
              {language === 'zh' ? '存入到 Hyperliquid' : 'Deposit to Hyperliquid'}
            </>
          )}
        </button>
      )}

      {/* Status Message */}
      {status.type !== 'idle' && (
        <div
          className="mt-4 rounded-lg p-3 flex items-start gap-2"
          style={{
            background:
              status.type === 'success'
                ? 'rgba(14, 203, 129, 0.1)'
                : 'rgba(246, 70, 93, 0.1)',
            border:
              status.type === 'success'
                ? '1px solid rgba(14, 203, 129, 0.3)'
                : '1px solid rgba(246, 70, 93, 0.3)',
          }}
        >
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4 mt-0.5" style={{ color: '#0ECB81' }} />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: '#F6465D' }} />
          )}
          <p
            className="text-sm"
            style={{ color: status.type === 'success' ? '#0ECB81' : '#F6465D' }}
          >
            {status.message}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div
        className="mt-4 rounded-lg p-3"
        style={{ background: '#0B0E11', border: '1px solid #2B3139' }}
      >
        <p className="text-xs" style={{ color: '#848E9C' }}>
          {language === 'zh' ? (
            <>
              💡 <strong>說明：</strong>USDC 將從你的 Arbitrum 錢包橋接到
              Hyperliquid。存款會在 1 分鐘內到賬。
            </>
          ) : (
            <>
              💡 <strong>Info:</strong> USDC will be bridged from your Arbitrum wallet to
              Hyperliquid. Deposits arrive within 1 minute.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
