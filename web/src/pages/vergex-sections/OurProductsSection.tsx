import React from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n/translations'

export const OurProductsSection: React.FC = () => {
  const { language } = useLanguage()

  return (
    <section className="w-full relative">
      <div className="w-[1440px] mx-auto px-[64px] py-[100px] relative">
        {/* Background Blur */}
        <div
          className="absolute left-1/2 top-[302px] -translate-x-1/2 w-[676px] h-[676px] rounded-[500px] overflow-hidden"
          style={{ filter: 'blur(300px)' }}
        >
          <img
            src="/vergex/blur-center.png"
            alt=""
            className="absolute w-[277.94%] h-[208.13%] max-w-none"
            style={{ left: '-21.97%', top: '-53.66%' }}
          />
        </div>

        {/* Title */}
        <h2 className="font-vergex-body font-semibold text-[48px] leading-[72px] text-white mb-[64px] relative z-10 whitespace-pre-wrap">
          {t('vergex.ourProducts', language)}
        </h2>

        {/* Main Content */}
        <div className="flex items-center justify-between relative z-10">
          {/* Architecture Diagram */}
          <div className="w-[588.897px] h-[620px] relative shrink-0">
            {/* Exchange Layer - Bottom */}
            <div className="absolute left-0 top-[280px] w-[588.897px] h-[340px]">
              <img
                src="/vergex/our-products/exchange-layer.svg"
                alt=""
                className="block max-w-none w-full h-full"
              />
            </div>

            {/* VergeX Layer - Middle */}
            <div className="absolute left-0 top-[140px] w-[588.897px] h-[340px]">
              <img
                src="/vergex/our-products/vergex-layer.svg"
                alt=""
                className="block max-w-none w-full h-full"
              />
            </div>

            {/* User Layer - Top */}
            <div className="absolute left-0 top-0 w-[588.897px] h-[340px]">
              <img
                src="/vergex/our-products/user-layer.svg"
                alt=""
                className="block max-w-none w-full h-full"
              />
            </div>

            {/* USER Text - Top layer */}
            <div
              className="absolute flex items-center justify-center h-[57.5px] w-[47.631px] left-[421px]"
              style={{ top: '253.75px', transform: 'translateY(-50%)' }}
            >
              <div
                className="flex-none"
                style={{ transform: 'rotate(330deg) skewX(333.435deg)' }}
              >
                <p className="font-vergex-body font-normal text-[20px] leading-[30px] text-white tracking-[0.8px] whitespace-nowrap">
                  USER
                </p>
              </div>
            </div>

            {/* VergeX Text - Middle layer */}
            <div
              className="absolute flex items-center justify-center h-[72px] w-[72.746px] left-[408px]"
              style={{ top: '394px', transform: 'translateY(-50%)' }}
            >
              <div
                className="flex-none"
                style={{ transform: 'rotate(330deg) skewX(333.435deg)' }}
              >
                <p className="font-vergex-body font-normal text-[20px] leading-[30px] text-white tracking-[0.8px] uppercase whitespace-nowrap">
                  VergeX
                </p>
              </div>
            </div>

            {/* Exchange Text - Bottom layer */}
            <div
              className="absolute flex items-center justify-center h-[88.5px] w-[101.325px] left-[394px]"
              style={{ top: '534.25px', transform: 'translateY(-50%)' }}
            >
              <div
                className="flex-none"
                style={{ transform: 'rotate(330deg) skewX(333.435deg)' }}
              >
                <p className="font-vergex-body font-normal text-[20px] leading-[30px] text-white tracking-[0.8px] uppercase whitespace-nowrap">
                  Exchange
                </p>
              </div>
            </div>

            {/* AI Models Text - Bottom left */}
            <div
              className="absolute flex items-center justify-center h-[87.5px] w-[99.593px] left-[102.99px]"
              style={{ top: '539.25px', transform: 'translateY(-50%)' }}
            >
              <div
                className="flex-none"
                style={{ transform: 'rotate(30deg) skewX(26.565deg)' }}
              >
                <p className="font-vergex-body font-normal text-[20px] leading-[30px] text-white tracking-[0.8px] uppercase whitespace-nowrap">
                  Ai Models
                </p>
              </div>
            </div>
          </div>

          {/* Product Descriptions */}
          <div className="w-[580px] flex flex-col gap-[80px] items-end shrink-0">
            {/* User Layer */}
            <div className="flex flex-col gap-[12px] items-start w-full">
              <div className="flex gap-[12px] items-center">
                <div className="w-[24px] h-[24px] shrink-0">
                  <img
                    src="/vergex/our-products/user-icon.svg"
                    alt=""
                    className="block max-w-none w-full h-full"
                  />
                </div>
                <h3 className="font-vergex-body font-semibold text-[24px] leading-[36px] tracking-[2.4px] uppercase text-white whitespace-nowrap">
                  {t('vergex.userLayer', language)}
                </h3>
              </div>
              <p className="font-vergex-body font-light text-[20px] leading-[30px] text-[rgba(255,255,255,0.5)] whitespace-pre-wrap">
                {t('vergex.userLayerDesc', language)}
              </p>
            </div>

            {/* VergeX Agentic */}
            <div className="flex flex-col gap-[12px] items-start w-full">
              <div className="flex gap-[12px] items-center">
                <div className="flex items-center justify-center w-[24px] h-[24px] shrink-0">
                  <div style={{ transform: 'rotate(90deg)' }}>
                    <img
                      src="/vergex/our-products/vergex-icon.svg"
                      alt=""
                      className="block max-w-none w-[24px] h-[24px]"
                    />
                  </div>
                </div>
                <h3 className="font-vergex-body font-semibold text-[24px] leading-[36px] tracking-[2.4px] uppercase text-white whitespace-nowrap">
                  {t('vergex.vergexAgentic', language)}
                </h3>
              </div>
              <p className="font-vergex-body font-light text-[20px] leading-[30px] text-[rgba(255,255,255,0.5)] whitespace-pre-wrap">
                {t('vergex.vergexAgenticDesc', language)}
              </p>
            </div>

            {/* Trading Venues */}
            <div className="flex flex-col gap-[12px] items-start w-full">
              <div className="flex gap-[12px] items-center">
                <div className="overflow-clip relative w-[24px] h-[24px] shrink-0">
                  <div
                    className="absolute"
                    style={{
                      bottom: '4.17%',
                      left: 0,
                      right: 0,
                      top: '-4.17%',
                    }}
                  >
                    <img
                      src="/vergex/our-products/bank-icon.svg"
                      alt=""
                      className="block max-w-none w-full h-full"
                    />
                  </div>
                </div>
                <h3 className="font-vergex-body font-semibold text-[24px] leading-[36px] tracking-[2.4px] uppercase text-white whitespace-nowrap">
                  {t('vergex.tradingVenues', language)}
                </h3>
              </div>
              <p className="font-vergex-body font-light text-[20px] leading-[30px] text-[rgba(255,255,255,0.5)] whitespace-pre-wrap">
                {t('vergex.tradingVenuesDesc', language)}
              </p>
            </div>

            {/* AI Models */}
            <div className="flex flex-col gap-[12px] items-start w-full">
              <div className="flex gap-[12px] items-center">
                <div className="w-[24px] h-[24px] shrink-0">
                  <img
                    src="/vergex/our-products/ai-icon.svg"
                    alt=""
                    className="block max-w-none w-full h-full"
                  />
                </div>
                <h3 className="font-vergex-body font-semibold text-[24px] leading-[36px] tracking-[2.4px] uppercase text-white whitespace-nowrap">
                  {t('vergex.aiModels', language)}
                </h3>
              </div>
              <p className="font-vergex-body font-light text-[20px] leading-[30px] text-[rgba(255,255,255,0.5)] whitespace-pre-wrap">
                {t('vergex.aiModelsDesc', language)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
