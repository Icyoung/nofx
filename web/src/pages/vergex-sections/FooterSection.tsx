import React from 'react'
import { useNavigate } from 'react-router-dom'

export const FooterSection: React.FC = () => {
  const navigate = useNavigate()

  const handleInternalLink = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(path)
  }

  return (
    <footer className="border-t border-vergex-border-light bg-vergex-bg-secondary w-full">
      <div className="w-[1440px] mx-auto">
        <div className="px-[64px] py-[48px]">
          <div className="flex justify-between mb-[32px]">
            {/* Products */}
            <div className="flex flex-col gap-[12px]">
              <p className="font-vergex-body font-normal text-[14px] leading-[21px] text-vergex-text-primary/40">
                Products
              </p>
              <a
                href="/competition"
                onClick={handleInternalLink('/competition')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                AI Competition
              </a>
              <a
                href="/traders"
                onClick={handleInternalLink('/traders')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                AI Trader
              </a>
              <a
                href="/dashboard"
                onClick={handleInternalLink('/dashboard')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Performance Dashboard
              </a>
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-[12px]">
              <p className="font-vergex-body font-normal text-[14px] leading-[21px] text-vergex-text-primary/40">
                Resources
              </p>
              <a
                href="/faq"
                onClick={handleInternalLink('/faq')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                FAQ
              </a>
              <a
                href="/docs"
                onClick={handleInternalLink('/docs')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Docs
              </a>
              <a
                href="https://github.com/tinkle-community/nofx"
                target="_blank"
                rel="noopener noreferrer"
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Github
              </a>
              <a
                href="/security"
                onClick={handleInternalLink('/security')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Security
              </a>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-[12px]">
              <p className="font-vergex-body font-normal text-[14px] leading-[21px] text-vergex-text-primary/40">
                Company
              </p>
              <a
                href="/about"
                onClick={handleInternalLink('/about')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                About
              </a>
              <a
                href="/contact"
                onClick={handleInternalLink('/contact')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/privacy"
                onClick={handleInternalLink('/privacy')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={handleInternalLink('/terms')}
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Terms of Use
              </a>
            </div>

            {/* Supporters */}
            <div className="flex flex-col gap-[12px]">
              <p className="font-vergex-body font-normal text-[14px] leading-[21px] text-vergex-text-primary/40">
                Supporters
              </p>
              <a
                href="https://amber.ac"
                target="_blank"
                rel="noopener noreferrer"
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Amber.ac (Strategic Investment)
              </a>
              <a
                href="https://aster.finance"
                target="_blank"
                rel="noopener noreferrer"
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Aster DEX
              </a>
              <a
                href="https://hyperliquid.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Hyperliquid
              </a>
              <a
                href="https://binance.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-vergex-body font-normal text-[16px] leading-[24px] text-vergex-text-primary hover:text-vergex-primary transition-colors cursor-pointer no-underline"
              >
                Binance
              </a>
            </div>

            {/* Follow us */}
            <div className="w-[192px] flex flex-col gap-[12px]">
              <p className="font-vergex-body font-normal text-[14px] leading-[21px] text-vergex-text-primary/40">
                Follow us
              </p>
              <div className="flex gap-[24px] items-center justify-center">
                <a
                  href="https://github.com/tinkle-community/nofx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[36px] h-[36px] hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/vergex/social-icons/github-footer.svg"
                    alt="GitHub"
                    className="block max-w-none w-full h-full"
                  />
                </a>
                <a
                  href="https://x.com/nofx_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[36px] h-[36px] hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/vergex/social-icons/twitter-footer.svg"
                    alt="Twitter"
                    className="block max-w-none w-full h-full"
                  />
                </a>
                <a
                  href="https://t.me/nofx_dev_community"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[36px] h-[36px] hover:opacity-80 transition-opacity"
                >
                  <img
                    src="/vergex/social-icons/telegram-footer.svg"
                    alt="Telegram"
                    className="block max-w-none w-full h-full"
                  />
                </a>
              </div>
            </div>
          </div>

          <p className="font-vergex-body font-normal text-[12px] leading-[18px] text-vergex-text-primary/40">
            DISCLAIMER: Vergex does not custody user funds and operates only
            with trade-only API permissions. Cryptocurrency trading carries
            risk. Please assess carefully before participating.
            <br />
            <br />© 2025 Vergex. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
