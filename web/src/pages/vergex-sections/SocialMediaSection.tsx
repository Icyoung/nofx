import React, { useEffect, useState } from 'react'
import { GithubIcon } from '../../components/vergex/svg-assets'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n/translations'
import ScrollReveal from '../../../@/components/ScrollReveal'
import CountUp from '../../../@/components/CountUp'
import { api, type GitHubStats } from '../../lib/api'

export const SocialMediaSection: React.FC = () => {
  const { language } = useLanguage()
  const [githubStats, setGithubStats] = useState<GitHubStats>({
    stars: 0,
    forks: 0,
    contributors: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGitHubStats = async () => {
      try {
        const stats = await api.getGitHubStats()
        setGithubStats(stats)
      } catch (error) {
        console.error('Failed to load GitHub stats:', error)
        // Fallback to default values
        setGithubStats({
          stars: 7859,
          forks: 1985,
          contributors: 44,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGitHubStats()
  }, [])

  return (
    <section className="w-full">
      <div className="w-[1440px] mx-auto px-[64px] py-[100px]">
        <h2 className="font-vergex-body font-semibold text-[48px] leading-[72px] text-vergex-text-primary mb-[64px]">
          {t('vergex.socialMedia', language)}
        </h2>

        <div className="flex items-center justify-between mb-[64px]">
          {/* GitHub Card */}
          <div className="w-[864px] border-[1.5px] border-vergex-border-light rounded-[12px] p-[48px] bg-vergex-bg-secondary relative overflow-hidden">
            {/* Background Decorative SVG */}
            <div className="absolute bottom-[-0.27px] right-[-320.1px] w-[877.097px] h-[735.273px] opacity-5">
              <svg width="877" height="735" viewBox="0 0 877 735" fill="none">
                <circle
                  cx="438"
                  cy="367"
                  r="300"
                  stroke="#998cff"
                  strokeWidth="1"
                />
                <circle
                  cx="438"
                  cy="367"
                  r="250"
                  stroke="#998cff"
                  strokeWidth="1"
                />
              </svg>
            </div>

            <div className="relative z-10">
              <GithubIcon />

              <div className="flex gap-[48px] mt-[48px] mb-[48px]">
                <div>
                  <p className="font-vergex-body font-semibold text-[40px] leading-[60px] text-vergex-text-primary">
                    {!isLoading && (
                      <CountUp
                        to={githubStats.stars}
                        from={0}
                        duration={2.5}
                        separator=","
                        className="font-vergex-body font-semibold text-[40px] leading-[60px] text-vergex-text-primary"
                      />
                    )}
                    {isLoading && <span>...</span>}
                  </p>
                  <p className="font-vergex-body font-light text-[18px] leading-[28px] text-vergex-text-tertiary">
                    Stars
                  </p>
                </div>
                <div>
                  <p className="font-vergex-body font-semibold text-[40px] leading-[60px] text-vergex-text-primary">
                    {!isLoading && (
                      <CountUp
                        to={githubStats.forks}
                        from={0}
                        duration={2.5}
                        separator=","
                        className="font-vergex-body font-semibold text-[40px] leading-[60px] text-vergex-text-primary"
                      />
                    )}
                    {isLoading && <span>...</span>}
                  </p>
                  <p className="font-vergex-body font-light text-[18px] leading-[28px] text-vergex-text-tertiary">
                    Forks
                  </p>
                </div>
                <div>
                  <p className="font-vergex-body font-semibold text-[40px] leading-[60px] text-vergex-text-primary">
                    {!isLoading && (
                      <CountUp
                        to={githubStats.contributors}
                        from={0}
                        duration={2}
                        className="font-vergex-body font-semibold text-[40px] leading-[60px] text-vergex-text-primary"
                      />
                    )}
                    {isLoading && <span>...</span>}
                  </p>
                  <p className="font-vergex-body font-light text-[18px] leading-[28px] text-vergex-text-tertiary">
                    Contributors
                  </p>
                </div>
              </div>

              <button className="bg-[#998cff] rounded-[32px] h-[60px] px-[32px] py-[12px] flex items-center gap-[8px] hover:bg-vergex-primary-light transition-colors">
                <span className="font-vergex-body font-medium text-[20px] leading-[30px] text-black">
                  Contribute on GitHub
                </span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="rotate-90 scale-y-[-1]"
                >
                  <path
                    d="M12 5L12 19M12 5L7 10M12 5L17 10"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="w-[416px] border-[1.5px] border-vergex-border-light rounded-[12px] px-[48px] py-[56px] flex flex-col gap-[80px]">
            {/* Twitter */}
            <a
              href="https://x.com/nofx_official"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[24px] group hover:opacity-80 transition-opacity no-underline"
            >
              <div className="w-[56px] h-[56px] shrink-0">
                <img
                  src="/vergex/social-icons/twitter-icon.svg"
                  alt="Twitter"
                  className="block max-w-none w-full h-full"
                />
              </div>
              <span className="flex-1 font-vergex-body font-medium text-[28px] leading-[42px] text-white whitespace-pre-wrap">
                Twitter
              </span>
              <div className="w-[24px] h-[24px] shrink-0">
                <img
                  src="/vergex/social-icons/arrow-icon.svg"
                  alt=""
                  className="block max-w-none w-full h-full"
                />
              </div>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/nofx_dev_community"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[24px] group hover:opacity-80 transition-opacity no-underline"
            >
              <div className="w-[56px] h-[56px] shrink-0">
                <img
                  src="/vergex/social-icons/telegram-icon.svg"
                  alt="Telegram"
                  className="block max-w-none w-full h-full"
                />
              </div>
              <span className="flex-1 font-vergex-body font-medium text-[28px] leading-[42px] text-white whitespace-pre-wrap">
                Telegram
              </span>
              <div className="w-[24px] h-[24px] shrink-0">
                <img
                  src="/vergex/social-icons/arrow-icon.svg"
                  alt=""
                  className="block max-w-none w-full h-full"
                />
              </div>
            </a>

            {/* Discord */}
            <a
              href="#"
              className="flex items-center gap-[24px] group hover:opacity-80 transition-opacity no-underline"
            >
              <div className="w-[56px] h-[56px] shrink-0">
                <img
                  src="/vergex/social-icons/discord-icon.svg"
                  alt="Discord"
                  className="block max-w-none w-full h-full"
                />
              </div>
              <span className="flex-1 font-vergex-body font-medium text-[28px] leading-[42px] text-white whitespace-pre-wrap">
                Discord
              </span>
              <div className="w-[24px] h-[24px] shrink-0">
                <img
                  src="/vergex/social-icons/arrow-icon.svg"
                  alt=""
                  className="block max-w-none w-full h-full"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Community Posts */}
        <div className="pt-[64px] flex flex-col gap-[80px]">
          {/* Post 1 */}
          <div className="flex gap-[48px] items-start">
            <div className="w-[384px] flex items-center gap-[16px]">
              <div className="w-[80px] h-[80px] rounded-[42px] overflow-hidden">
                <img
                  src="/vergex/avatar-1.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <ScrollReveal
                  containerClassName="my-0"
                  textClassName="font-vergex-body font-semibold text-[20px] leading-[30px] text-vergex-text-primary"
                  enableBlur={false}
                  baseOpacity={0.1}
                  baseRotation={0}
                  blurStrength={0}
                >
                  John Techson
                </ScrollReveal>
                <ScrollReveal
                  containerClassName="my-0"
                  textClassName="font-vergex-body font-light text-[18px] leading-[27px] text-vergex-text-primary/60"
                  enableBlur={false}
                  baseOpacity={0.1}
                  baseRotation={0}
                  blurStrength={0}
                >
                  Quantum Computing
                </ScrollReveal>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-[8px]">
              <ScrollReveal
                containerClassName="my-0"
                textClassName="font-vergex-body font-normal text-[20px] leading-[30px] text-vergex-text-primary/60"
                enableBlur={false}
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={0}
              >
                October 15, 2025
              </ScrollReveal>
              <ScrollReveal
                containerClassName="my-0"
                textClassName="font-vergex-body font-normal text-[20px] leading-[36px] text-vergex-text-primary"
                enableBlur={false}
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={0}
              >
                "Open-source NOFX revives the legendary Alpha Arena, an
                AI-powered crypto futures battleground. Built on DeepSeek/Qwen
                AI, it trades live on Binance, Hyperliquid, and Aster DEX,
                featuring multi-AI battles and self-learning bots"
              </ScrollReveal>
            </div>

            <button className="bg-vergex-bg-secondary border border-white/[0.06] rounded-[12px] h-[64px] px-[24px] flex items-center gap-[10px] hover:bg-vergex-bg-tertiary transition-colors">
              <span className="font-vergex-body font-normal text-[18px] leading-[27px] text-vergex-text-primary">
                View Blog
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          <div className="h-[1px] bg-vergex-border-light" />

          {/* Post 2 */}
          <div className="flex gap-[48px] items-start">
            <div className="w-[384px] flex items-center gap-[16px]">
              <div className="w-[80px] h-[80px] rounded-[42px] overflow-hidden">
                <img
                  src="/vergex/avatar-2.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <ScrollReveal
                  containerClassName="my-0"
                  textClassName="font-vergex-body font-semibold text-[20px] leading-[30px] text-vergex-text-primary"
                  enableBlur={false}
                  baseOpacity={0.1}
                  baseRotation={0}
                  blurStrength={0}
                >
                  Sarah Ethicist
                </ScrollReveal>
                <ScrollReveal
                  containerClassName="my-0"
                  textClassName="font-vergex-body font-light text-[18px] leading-[27px] text-vergex-text-primary/60"
                  enableBlur={false}
                  baseOpacity={0.1}
                  baseRotation={0}
                  blurStrength={0}
                >
                  AI Ethics
                </ScrollReveal>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-[8px]">
              <ScrollReveal
                containerClassName="my-0"
                textClassName="font-vergex-body font-normal text-[20px] leading-[30px] text-vergex-text-primary/60"
                enableBlur={false}
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={0}
              >
                October 16, 2025
              </ScrollReveal>
              <ScrollReveal
                containerClassName="my-0"
                textClassName="font-vergex-body font-normal text-[20px] leading-[36px] text-vergex-text-primary"
                enableBlur={false}
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={0}
              >
                "跑了一晚上 @nofx_ai 开源的 AI 自动交易,太有意思了,就看 AI
                在那一会开空一会开多,一顿操作,虽然看不懂为什么,但是一晚上帮我赚了
                6% 收益"
              </ScrollReveal>
            </div>

            <button className="bg-vergex-bg-secondary border border-white/[0.06] rounded-[12px] h-[64px] px-[24px] flex items-center gap-[10px] hover:bg-vergex-bg-tertiary transition-colors">
              <span className="font-vergex-body font-normal text-[18px] leading-[27px] text-vergex-text-primary">
                View Blog
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          <div className="h-[1px] bg-vergex-border-light" />

          {/* Post 3 */}
          <div className="flex gap-[48px] items-start">
            <div className="w-[384px] flex items-center gap-[16px]">
              <div className="w-[80px] h-[80px] rounded-[42px] overflow-hidden">
                <img
                  src="/vergex/avatar-3.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <ScrollReveal
                  containerClassName="my-0"
                  textClassName="font-vergex-body font-semibold text-[20px] leading-[30px] text-vergex-text-primary"
                  enableBlur={false}
                  baseOpacity={0.1}
                  baseRotation={0}
                  blurStrength={0}
                >
                  Astronomer X
                </ScrollReveal>
                <ScrollReveal
                  containerClassName="my-0"
                  textClassName="font-vergex-body font-light text-[18px] leading-[27px] text-vergex-text-primary/60"
                  enableBlur={false}
                  baseOpacity={0.1}
                  baseRotation={0}
                  blurStrength={0}
                >
                  Space Exploration
                </ScrollReveal>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-[8px]">
              <ScrollReveal
                containerClassName="my-0"
                textClassName="font-vergex-body font-normal text-[20px] leading-[30px] text-vergex-text-primary/60"
                enableBlur={false}
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={0}
              >
                October 30, 2025
              </ScrollReveal>
              <ScrollReveal
                containerClassName="my-0"
                textClassName="font-vergex-body font-normal text-[20px] leading-[36px] text-vergex-text-primary"
                enableBlur={false}
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={0}
              >
                "前不久非常火的 AI 量化交易系统 NOF1,在 GitHub
                上有人将其复刻并开源,这就是 NOFX 项目。基于 DeepSeek、Qwen
                等大语言模型,打造的通用架构 AI
                交易操作系统,完成了从决策、到交易、再到复盘的闭环。GitHub:
                https://github.com/NoFxAiOS/nofx"
              </ScrollReveal>
            </div>

            <button className="bg-vergex-bg-secondary border border-white/[0.06] rounded-[12px] h-[64px] px-[24px] flex items-center gap-[10px] hover:bg-vergex-bg-tertiary transition-colors">
              <span className="font-vergex-body font-normal text-[18px] leading-[27px] text-vergex-text-primary">
                View Blog
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
