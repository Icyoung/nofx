export default function FooterSection() {
  return (
    <footer className="bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.1)] w-full">
      <div className="box-border flex flex-col gap-[32px] items-start px-[64px] py-[48px]">
        {/* Main Content */}
        <div className="flex items-start justify-between w-full">
          {/* Products */}
          <div className="flex flex-col font-vergex-body font-normal gap-[12px] items-start shrink-0">
            <p className="text-[14px] leading-[21px] text-[rgba(255,255,255,0.4)]">
              Products
            </p>
            <a
              href="/competition"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              AI Competition
            </a>
            <a
              href="/traders"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              AI Trader
            </a>
            <a
              href="/dashboard"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Performance Dashboard
            </a>
          </div>

          {/* Resources */}
          <div className="flex flex-col font-vergex-body font-normal gap-[12px] items-start shrink-0">
            <p className="text-[14px] leading-[21px] text-[rgba(255,255,255,0.4)]">
              Resources
            </p>
            <a
              href="/faq"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              FAQ
            </a>
            <a
              href="https://github.com/tinkle-community/nofx/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Docs
            </a>
            <a
              href="https://github.com/tinkle-community/nofx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Github
            </a>
            <a
              href="/security"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Security
            </a>
          </div>

          {/* Company */}
          <div className="flex flex-col font-vergex-body font-normal gap-[12px] items-start shrink-0">
            <p className="text-[14px] leading-[21px] text-[rgba(255,255,255,0.4)]">
              Company
            </p>
            <a
              href="/about"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              About
            </a>
            <a
              href="/contact"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Contact
            </a>
            <a
              href="/privacy"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Terms of Use
            </a>
          </div>

          {/* Supporters */}
          <div className="flex flex-col font-vergex-body font-normal gap-[12px] items-start shrink-0">
            <p className="text-[14px] leading-[21px] text-[rgba(255,255,255,0.4)]">
              Supporters
            </p>
            <a
              href="https://amber.ac/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Amber.ac (Strategic Investment)
            </a>
            <a
              href="https://www.asterdex.com/en/referral/fdfc0e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Aster DEX
            </a>
            <a
              href="https://hyperliquid.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Hyperliquid
            </a>
            <a
              href="https://www.maxweb.red/join?ref=NOFXAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] leading-[24px] text-white hover:text-[#998cff] transition-colors no-underline"
            >
              Binance
            </a>
          </div>

          {/* Follow us */}
          <div className="flex flex-col gap-[12px] items-start w-[192px] shrink-0">
            <p className="font-vergex-body font-normal text-[14px] leading-[21px] text-[rgba(255,255,255,0.4)]">
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

        {/* Disclaimer */}
        <div className="font-vergex-body font-normal text-[12px] leading-[18px] text-[rgba(255,255,255,0.4)] shrink-0">
          <p className="mb-0">
            DISCLAIMER: Vergex does not custody user funds and operates only
            with trade-only API permissions. Cryptocurrency trading carries
            risk. Please assess carefully before participating.
          </p>
          <p className="mb-0">&nbsp;</p>
          <p className="mb-0">© 2025 Vergex. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
