'use client';
import RotaptchaWidget, { CaptchaConfig } from '@/components/RotaptchaWidget';
import { useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';

const usageCode = `<RotaptchaWidget
  createUrl="/api/captcha/create"
  verifyUrl="/api/captcha/verify"
  config={{
    width: 300,
    height: 300,
    minValue: 20,
    maxValue: 90,
    step: 10,
  }}
  onVerifySuccess={(result) => {
    console.log('Verified!', result);
  }}
  onVerifyFailure={(result) => {
    console.log('Failed', result);
  }}
/>`;

const widgetCode = `'use client';
import { useState, useRef, useEffect } from 'react';

export interface CaptchaConfig {
  width?: number;
  height?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  wobbleIntensity?: number;
  noise?: boolean;
  strokeWidth?: number;
  canvasBg?: string;
  noiseDensity?: number;
  expiryTime?: number;
}

interface RotaptchaWidgetProps {
  createUrl: string;
  verifyUrl: string;
  config?: CaptchaConfig;
  autoRegenerate?: boolean;
  onVerifySuccess?: (result: VerifyResult) => void;
  onVerifyFailure?: (result: VerifyResult) => void;
  onError?: (error: Error) => void;
  theme?: {
    primary?: string;
    primaryHover?: string;
    secondary?: string;
    background?: string;
  };
}

interface VerifyResult {
  success: boolean;
  message?: string;
}

export default function RotaptchaWidget({
  createUrl,
  verifyUrl,
  config = {},
  autoRegenerate = true,
  onVerifySuccess,
  onVerifyFailure,
  onError,
  theme = {},
}: RotaptchaWidgetProps) {
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    primary = '#4285f4',
    primaryHover = '#3367d6',
    background = '#f8f9fa',
  } = theme;

  const defaultConfig: CaptchaConfig = {
    width: 300,
    height: 300,
    minValue: 20,
    maxValue: 90,
    step: 10,
    wobbleIntensity: 2,
    noise: true,
    strokeWidth: 2,
    canvasBg: '#FFFFFF',
    noiseDensity: 3,
    expiryTime: 300000,
  };

  const mergedConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        const checkbox = document.getElementById('rotaptcha-checkbox');
        if (checkbox && !checkbox.contains(event.target as Node)) {
          setShowPopover(false);
        }
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const fetchCaptcha = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedConfig),
      });

      if (!response.ok) throw new Error('Failed to generate captcha');

      const data = await response.json();
      setCaptchaImage(data.captcha);
      setCaptchaId(data.id);
      setSliderValue(0);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCaptcha = async () => {
    if (!captchaId) return;

    setIsLoading(true);
    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: captchaId, value: sliderValue }),
      });

      const result: VerifyResult = await response.json();

      if (result.success) {
        setIsVerified(true);
        setShowPopover(false);
        setFailedAttempts(0);
        onVerifySuccess?.(result);
      } else {
        setFailedAttempts((prev) => prev + 1);
        onVerifyFailure?.(result);
        if (autoRegenerate && failedAttempts >= 1) {
          fetchCaptcha();
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Verification failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxClick = () => {
    if (isVerified) return;
    setShowPopover(true);
    fetchCaptcha();
  };

  const handleReset = () => {
    setIsVerified(false);
    setCaptchaImage(null);
    setCaptchaId(null);
    setSliderValue(0);
    setFailedAttempts(0);
  };

  return (
    <div className="relative inline-block">
      {/* Checkbox UI */}
      <div
        id="rotaptcha-checkbox"
        onClick={handleCheckboxClick}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors select-none"
        style={{ minWidth: '280px' }}
      >
        <div
          className="w-6 h-6 border-2 rounded flex items-center justify-center transition-all"
          style={{
            borderColor: isVerified ? '#22c55e' : '#d1d5db',
            backgroundColor: isVerified ? '#22c55e' : 'transparent',
          }}
        >
          {isVerified && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-gray-700 text-sm font-medium flex-1">I'm a Human</span>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray-500">rotaptcha</span>
        </div>
        {isVerified && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="ml-1 text-gray-400 hover:text-gray-600 text-xs"
            title="Reset"
          >
            ×
          </button>
        )}
      </div>

      {/* Popover */}
      {showPopover && !isVerified && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50"
          style={{ minWidth: '320px' }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowPopover(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-4">
            {/* Captcha Image */}
            <div
              className="relative rounded-lg overflow-hidden mb-4 flex items-center justify-center"
              style={{
                backgroundColor: background,
                minHeight: mergedConfig.height,
              }}
            >
              {isLoading || !captchaImage ? (
                <div className="flex items-center justify-center" style={{ height: mergedConfig.height }}>
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <img
                  src={captchaImage}
                  alt="Captcha"
                  className="max-w-full"
                  style={{
                    transform: \`rotate(\${sliderValue}deg)\`,
                    transition: 'transform 0.1s ease-out',
                  }}
                  draggable={false}
                />
              )}
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min={-(mergedConfig.maxValue || 90)}
                max={mergedConfig.maxValue || 90}
                step={mergedConfig.step || 10}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                disabled={isLoading || !captchaImage}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={verifyCaptcha}
                disabled={isLoading || !captchaImage}
                className="flex-1 py-2 px-3 text-white text-sm font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: primary,
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = primaryHover)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = primary)}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={fetchCaptcha}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'usage' | 'widget'>('widget');

  const config: CaptchaConfig = {
    width: 300,
    height: 300,
    minValue: 20,
    maxValue: 90,
    step: 10,
    wobbleIntensity: 2,
    noise: true,
    strokeWidth: 2,
    noiseDensity: 3,
    expiryTime: 300000
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [activeTab]);

  const handleCopy = async () => {
    const code = activeTab === 'usage' ? usageCode : widgetCode;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Main Container */}
      <div className="w-full max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-16">

          {/* Logo/Title with decorative elements */}
          <div className="inline-flex items-center justify-center mb-6">
           
            <div className="relative">
              <h1 className="text-4xl sm:text-4xl md:text-4xl font-bold text-lime-700 ">
                Rotaptcha
              </h1>
            </div>
          </div>

          <p className="text-gray-500 text-base sm:text-base mb-2 px-4">
            Language Agnostic Gamified CAPTCHA Test
          </p>

          <p className="text-gray-500 text-base sm:text-base mt-2 px-4">
            Secure, Simple, and User-Friendly Verification
          </p>

        </div>

        {/* Demo Section with Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 mb-12">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-300">
                LIVE DEMO
              </span>
            </div>

            {/* Captcha Widget */}
            <RotaptchaWidget
              createUrl="/api/captcha/create"
              verifyUrl="/api/captcha/verify"
              config={config}
              autoRegenerate={false}
              onVerifySuccess={(result) => {
                console.log('Captcha verified successfully:', result);
              }}
              onVerifyFailure={(result) => {
                console.log('Captcha verification failed:', result);
              }}
              onError={(error) => {
                console.error('Captcha error:', error);
              }}
              theme={{
                primary: '#88B04B',
                primaryHover: '#6a8c3a',
                secondary: '#e8f0fe',
                background: '#f8f9fa',
              }}
            />

            <p className="mt-6 text-gray-500 text-sm">
              Click the checkbox above to try the verification
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-lime-900 mb-2">Implementation</h2>
            <p className="text-gray-600">Get started with Rotaptcha in minutes</p>
          </div>

          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-800">
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-800">
              {/* Tabs Header */}
              <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('widget')}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'widget'
                      ? 'text-white bg-gray-900 border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                      }`}
                  >
                    Widget Component
                  </button>
                  <button
                    onClick={() => setActiveTab('usage')}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'usage'
                      ? 'text-white bg-gray-900 border-b-2 border-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                      }`}
                  >
                    Usage
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-all text-sm px-4 py-2 mr-2 rounded cursor-pointer"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Code Content */}
              <div className="max-h-96 overflow-auto">
                <pre className="p-6 text-sm">
                  <code className={activeTab === 'usage' ? 'language-jsx' : 'language-javascript'}>
                    {activeTab === 'usage' ? usageCode : widgetCode}
                  </code>
                </pre>
              </div>
            </div>

            {activeTab === 'widget' && (
              <p className="mt-4 text-sm text-gray-500 px-2">
                Save this as <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-xs border border-gray-200">components/RotaptchaWidget.tsx</code>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-gray-500 text-sm">
                Built with Next.js and TypeScript
              </div>
              <a
                href="https://github.com/orgs/rotaptcha/repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm border border-gray-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}