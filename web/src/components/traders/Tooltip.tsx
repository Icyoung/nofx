import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      // 計算 tooltip 位置：在觸發元素上方居中
      setPosition({
        top: rect.top + window.scrollY - 8, // 8px 間距
        left: rect.left + rect.width / 2,
      })
    }
  }, [show])

  const tooltipContent = show && (
    <div
      className="fixed z-[9999] px-3 py-2 text-sm rounded-lg shadow-lg"
      style={{
        background: '#2B3139',
        color: '#EAECEF',
        border: '1px solid #474D57',
        maxWidth: '320px', // 增加最大寬度
        width: 'max-content',
        transform: 'translate(-50%, -100%)', // 在觸發元素上方居中
        top: position.top,
        left: position.left,
        wordWrap: 'break-word', // 確保長文本換行
        whiteSpace: 'pre-wrap', // 保留換行
      }}
    >
      {content}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 top-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #2B3139',
        }}
      />
    </div>
  )

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        {children}
      </div>
      {show && createPortal(tooltipContent, document.body)}
    </div>
  )
}
