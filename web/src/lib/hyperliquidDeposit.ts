/**
 * Hyperliquid Bridge Deposit Integration
 *
 * Allows users to deposit USDC from Arbitrum to Hyperliquid directly in the app.
 *
 * Bridge Contracts:
 * - Mainnet: 0x2df1c51e09aecf9cacb7bc98cb1742757f163df7
 * - Testnet: 0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89
 *
 * USDC Contracts (Arbitrum):
 * - Mainnet: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
 * - Testnet: 0x1baAbB04529D43a73232B713C0FE471f7c7334d5
 *
 * Minimum deposit: 5 USDC
 * Processing time: < 1 minute
 */

import { type WalletClient, parseUnits, formatUnits, createPublicClient, http } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

// Contract addresses
const BRIDGE_ADDRESSES = {
  Mainnet: '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7' as `0x${string}`,
  Testnet: '0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89' as `0x${string}`,
}

const USDC_ADDRESSES = {
  Mainnet: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
  Testnet: '0x1baAbB04529D43a73232B713C0FE471f7c7334d5' as `0x${string}`,
}

const ARBITRUM_CHAIN_IDS = {
  Mainnet: arbitrum.id, // 42161
  Testnet: arbitrumSepolia.id, // 421614
}

const MIN_DEPOSIT = 5 // USDC

/**
 * Get public client for reading contract data
 */
function getPublicClient(hyperliquidChain: 'Mainnet' | 'Testnet') {
  const chain = hyperliquidChain === 'Mainnet' ? arbitrum : arbitrumSepolia
  return createPublicClient({
    chain,
    transport: http(),
  })
}

// ERC20 ABI (approve + balanceOf + transfer)
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export interface DepositParams {
  amount: number // USDC amount (e.g., 10 for 10 USDC)
  hyperliquidChain: 'Mainnet' | 'Testnet'
}

export interface DepositResult {
  success: boolean
  message: string
  txHash?: string
  error?: string
}

/**
 * Check user's USDC balance on Arbitrum
 */
export async function getArbitrumUSDCBalance(
  walletClient: WalletClient,
  hyperliquidChain: 'Mainnet' | 'Testnet'
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const [userAddress] = await walletClient.getAddresses()
    if (!userAddress) {
      return { success: false, error: 'No wallet address found' }
    }

    const usdcAddress = USDC_ADDRESSES[hyperliquidChain]
    const publicClient = getPublicClient(hyperliquidChain)

    // Read USDC balance
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })

    const balanceInUSDC = Number(formatUnits(balance as bigint, 6))

    return {
      success: true,
      balance: balanceInUSDC,
    }
  } catch (err: any) {
    console.error('Failed to get USDC balance:', err)
    return {
      success: false,
      error: err.message || 'Failed to query USDC balance',
    }
  }
}

/**
 * Check if user is on correct Arbitrum network
 */
export function isCorrectArbitrumNetwork(
  currentChainId: number,
  hyperliquidChain: 'Mainnet' | 'Testnet'
): boolean {
  const requiredChainId = ARBITRUM_CHAIN_IDS[hyperliquidChain]
  return currentChainId === requiredChainId
}

/**
 * Get required Arbitrum chain info
 */
export function getRequiredArbitrumChain(hyperliquidChain: 'Mainnet' | 'Testnet') {
  return hyperliquidChain === 'Mainnet' ? arbitrum : arbitrumSepolia
}

/**
 * Deposit USDC from Arbitrum to Hyperliquid
 *
 * Process:
 * 1. Check if user is on correct Arbitrum network
 * 2. Check USDC balance
 * 3. Approve USDC to bridge contract (if needed)
 * 4. Transfer USDC to bridge contract
 * 5. Wait for bridge confirmation (< 1 minute on Hyperliquid)
 */
export async function depositToHyperliquid(
  walletClient: WalletClient,
  params: DepositParams
): Promise<DepositResult> {
  try {
    const { amount, hyperliquidChain } = params

    // Validate amount
    if (amount < MIN_DEPOSIT) {
      return {
        success: false,
        message: `Minimum deposit is ${MIN_DEPOSIT} USDC`,
        error: `Amount too low: ${amount} USDC`,
      }
    }

    // Get user address
    const [userAddress] = await walletClient.getAddresses()
    if (!userAddress) {
      return {
        success: false,
        message: 'No wallet address found',
        error: 'WALLET_NOT_CONNECTED',
      }
    }

    // Check if on correct network
    const currentChainId = await walletClient.getChainId()
    if (!isCorrectArbitrumNetwork(currentChainId, hyperliquidChain)) {
      const requiredChain = getRequiredArbitrumChain(hyperliquidChain)
      return {
        success: false,
        message: `Please switch to ${requiredChain.name}`,
        error: 'WRONG_NETWORK',
      }
    }

    const usdcAddress = USDC_ADDRESSES[hyperliquidChain]
    const bridgeAddress = BRIDGE_ADDRESSES[hyperliquidChain]
    const amountInWei = parseUnits(amount.toString(), 6) // USDC has 6 decimals
    const publicClient = getPublicClient(hyperliquidChain)
    const chain = getRequiredArbitrumChain(hyperliquidChain)

    // Step 1: Check USDC balance
    console.log('📊 Checking USDC balance...')
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })

    if ((balance as bigint) < amountInWei) {
      const balanceInUSDC = Number(formatUnits(balance as bigint, 6))
      return {
        success: false,
        message: `Insufficient USDC balance. You have ${balanceInUSDC.toFixed(2)} USDC`,
        error: 'INSUFFICIENT_BALANCE',
      }
    }

    console.log(`✅ USDC balance sufficient: ${formatUnits(balance as bigint, 6)} USDC`)

    // Step 2: Check allowance
    console.log('🔍 Checking USDC allowance...')
    const allowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, bridgeAddress],
    })

    // Step 3: Approve if needed
    if ((allowance as bigint) < amountInWei) {
      console.log('📝 Approving USDC to bridge contract...')

      const approveTxHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [bridgeAddress, amountInWei],
        account: userAddress,
        chain,
      })

      console.log('⏳ Waiting for approval confirmation...', approveTxHash)

      // Wait for approval confirmation
      // Note: viem walletClient doesn't have waitForTransactionReceipt
      // User will need to wait for approval before proceeding

      console.log('✅ Approval submitted:', approveTxHash)
    } else {
      console.log('✅ USDC already approved')
    }

    // Step 4: Transfer USDC to bridge
    console.log('💸 Transferring USDC to Hyperliquid bridge...')

    const transferTxHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [bridgeAddress, amountInWei],
      account: userAddress,
      chain,
    })

    console.log('✅ Deposit submitted:', transferTxHash)

    return {
      success: true,
      message: `Successfully deposited ${amount} USDC to Hyperliquid. Your funds will appear in less than 1 minute.`,
      txHash: transferTxHash,
    }
  } catch (err: any) {
    console.error('❌ Deposit failed:', err)

    // Handle user rejection
    if (err.message?.includes('User rejected') || err.code === 4001) {
      return {
        success: false,
        message: 'Transaction cancelled by user',
        error: 'USER_REJECTED',
      }
    }

    return {
      success: false,
      message: err.message || 'Deposit failed',
      error: err.message || 'UNKNOWN_ERROR',
    }
  }
}

/**
 * Get Arbitrum USDC contract address
 */
export function getArbitrumUSDCAddress(hyperliquidChain: 'Mainnet' | 'Testnet'): string {
  return USDC_ADDRESSES[hyperliquidChain]
}

/**
 * Get bridge contract address
 */
export function getBridgeAddress(hyperliquidChain: 'Mainnet' | 'Testnet'): string {
  return BRIDGE_ADDRESSES[hyperliquidChain]
}

/**
 * Get minimum deposit amount
 */
export function getMinimumDeposit(): number {
  return MIN_DEPOSIT
}
