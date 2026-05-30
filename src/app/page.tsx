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

const heroStats = [
  {
    value: '3-step',
    label: 'challenge flow that feels familiar and fast to complete',
  },
  {
    value: 'Typed',
    label: 'React props for theming, callbacks, and difficulty control',
  },
  {
    value: 'API-first',
    label: 'works with your own create and verify endpoints',
  },
];

const featureCards = [
  {
    eyebrow: 'Polished UX',
    title: 'Looks like product UI, not an interruption.',
    description:
      'Warm surfaces, clear feedback, and a compact interaction keep verification from feeling bolted on.',
  },
  {
    eyebrow: 'Adjustable Security',
    title: 'Tune rotation, expiry, and retry behavior.',
    description:
      'Use the config surface to balance completion speed and difficulty for each form or funnel step.',
  },
  {
    eyebrow: 'Framework Friendly',
    title: 'The widget is just one integration layer.',
    description:
      'Rotaptcha stays language agnostic underneath, so your backend contract can stay consistent across stacks.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Create',
    description:
      'Generate a rotated image challenge from your own backend whenever the user opens the verifier.',
  },
  {
    step: '02',
    title: 'Align',
    description:
      'Let users solve the rotation with a simple tactile control that translates well across screen sizes.',
  },
  {
    step: '03',
    title: 'Verify',
    description:
      'Post the selected angle, resolve success or failure, and regenerate only when your policy requires it.',
  },
];

const integrationPoints = [
  'Bring your own API routes for challenge creation and verification.',
  'Theme the widget so it matches the rest of the form surface.',
  'Capture success, failure, and error events with callbacks you already need.',
  'Adjust angle range, expiry, and regeneration behavior without rewriting the component.',
];

const quickFacts = [
  {
    label: 'Endpoints',
    value: '2 routes',
  },
  {
    label: 'Hooks',
    value: '3 callbacks',
  },
  {
    label: 'Theming',
    value: 'Custom colors',
  },
  {
    label: 'Config',
    value: 'Angle + expiry',
  },
];

const signalChips = ['Next.js ready', 'Retry aware', 'Configurable angles', 'Accessible contrast'];

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
    <main className="landing-shell relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] overflow-hidden">
        <div className="absolute left-[8%] top-10 h-64 w-64 rounded-full bg-[#a0c878]/25 blur-3xl" />
        <div className="absolute right-[6%] top-0 h-72 w-72 rounded-full bg-[#e07a5f]/20 blur-3xl" />
        <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="landing-panel rounded-full px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#9ac468,#e07a5f)] shadow-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#112018] text-sm font-semibold text-[#f7f3ea]">
                  R
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5e7d33]">Rotaptcha</p>
                <p className="text-sm text-[color:var(--muted)]">Human-friendly verification for modern forms</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="#demo"
                className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#112018] transition hover:border-black/20 hover:bg-white"
              >
                Live demo
              </a>
              <a
                href="#code"
                className="rounded-full border border-black/10 bg-transparent px-4 py-2 text-sm font-medium text-[#112018] transition hover:bg-white/60"
              >
                Integration
              </a>
              <a
                href="https://github.com/orgs/rotaptcha/repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#112018] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1c3022]"
              >
                GitHub
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="landing-panel landing-grid-fade rounded-[2rem] p-8 sm:p-10 lg:p-12">
            <div className="relative z-10">
              <span className="inline-flex items-center rounded-full border border-[#88b04b]/25 bg-[#eef4e3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#5e7d33]">
                Most user friendly CAPTCHA Ever
              </span>

              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-[#112018] sm:text-6xl lg:text-[4.5rem] lg:leading-[0.95]">
                A CAPTCHA that feels easy and <span className="text-[#88b04b]">doesn't infriinge privacy.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
                Rotaptcha swaps sterile checkbox patterns for a tactile rotation challenge that blends into your
                interface while keeping the verification loop clear, secure, and easy to theme.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#demo"
                  className="inline-flex items-center rounded-full bg-[#112018] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c3022]"
                >
                  Try the live challenge
                </a>
                <a
                  href="#code"
                  className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-semibold text-[#112018] transition hover:border-black/20 hover:bg-white"
                >
                  See the integration
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div key={item.value} className="landing-chip rounded-[1.5rem] p-4">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-[#112018]">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="demo" className="landing-panel-strong relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
            <div aria-hidden="true" className="absolute inset-x-8 top-0 h-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex h-full flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Live demo</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                    Verification without the visual downgrade.
                  </h2>
                </div>
                <span className="landing-chip-dark rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Form-ready
                </span>
              </div>

              <p className="max-w-lg text-sm leading-7 text-white/72">
                The widget stays compact, offers immediate feedback, and can live naturally inside signup,
                contact, or checkout flows instead of feeling like a detached add-on.
              </p>

              <div className="rounded-[1.75rem] bg-white/96 p-5 text-slate-900 shadow-[0_30px_70px_rgba(0,0,0,0.22)] ring-1 ring-black/5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5e7d33]">
                      Interactive challenge
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Try the live component with the current API routes.</p>
                  </div>
                  <span className="rounded-full bg-[#eef4e3] px-3 py-1 text-xs font-semibold text-[#5e7d33]">
                    Next.js + TypeScript
                  </span>
                </div>

                <div className="flex justify-center">
                  <RotaptchaWidget
                    createUrl="/api/captcha/create"
                    verifyUrl="/api/captcha/verify"
                    config={config}
                    autoRegenerate={false}
                    className="w-full"
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
                      secondary: '#eef4e3',
                      background: '#f7f3ea',
                    }}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {signalChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="landing-chip-dark rounded-[1.5rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Configurable</p>
                  <p className="mt-2 text-base font-semibold text-white">Tune angles, retries, and expiry per form.</p>
                </div>
                <div className="landing-chip-dark rounded-[1.5rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Callback aware</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    Wire success, failure, and error handling into your submission flow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((item) => (
            <div key={item.title} className="landing-card rounded-[1.75rem] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5e7d33]">{item.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#112018]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="landing-card rounded-[2rem] p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5e7d33]">Why it lands better</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#112018] sm:text-4xl">
              Security that keeps your first impression intact.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-[color:var(--muted)]">
              Instead of throwing users into a generic third-party wall, Rotaptcha lets you keep the visual language,
              motion, and tone of your interface while preserving a familiar verification loop.
            </p>

            <div className="mt-8 space-y-4">
              {integrationPoints.map((item, index) => (
                <div key={item} className="flex items-start gap-4 rounded-[1.5rem] border border-black/8 bg-white/55 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#112018] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflowSteps.map((item) => (
              <div key={item.step} className="landing-card flex flex-col rounded-[1.75rem] p-6 sm:p-7">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e07a5f]">{item.step}</span>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#112018]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                <div className="mt-auto pt-6">
                  <div className="h-1.5 w-16 rounded-full bg-[#88b04b]/40" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="code" className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="landing-panel rounded-[2rem] p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5e7d33]">Integration</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#112018] sm:text-4xl">
              Drop it into a Next.js flow in minutes.
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
              The widget surface is intentionally small: point it at your create and verify endpoints, adjust the
              challenge config, and wire the callbacks you already need for form state.
            </p>

            <div className="mt-8 rounded-[1.75rem] bg-[#112018] p-6 text-[#f7f3ea] shadow-[0_24px_60px_rgba(17,32,24,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">What ships in the demo</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {quickFacts.map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-sm text-white/55">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="code-shell overflow-hidden rounded-[2rem] border border-black/12">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Code preview</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Choose the snippet you want to start from.</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('widget')}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeTab === 'widget'
                        ? 'bg-white text-slate-900'
                        : 'bg-white/6 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Widget component
                  </button>
                  <button
                    onClick={() => setActiveTab('usage')}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeTab === 'usage'
                        ? 'bg-white text-slate-900'
                        : 'bg-white/6 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Usage
                  </button>
                  <button
                    onClick={handleCopy}
                    className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    {copied ? 'Copied!' : 'Copy snippet'}
                  </button>
                </div>
              </div>
            </div>

            <div className="code-scroll max-h-[560px] overflow-auto">
              <pre className="p-6 text-sm leading-7">
                <code className={activeTab === 'usage' ? 'language-jsx' : 'language-javascript'}>
                  {activeTab === 'usage' ? usageCode : widgetCode}
                </code>
              </pre>
            </div>

            <div className="border-t border-white/10 px-6 py-4 text-sm text-white/55">
              {activeTab === 'widget'
                ? 'The widget API exposes theming, lifecycle hooks, and challenge tuning in one typed surface.'
                : 'Usage stays lean: point the component at your endpoints and handle the result callbacks.'}
            </div>
          </div>
        </section>

        <footer className="landing-panel rounded-[2rem] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xl font-semibold tracking-[-0.03em] text-[#112018]">Rotaptcha demo site</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Built with Next.js and TypeScript, now styled to feel closer to a real product launch than a placeholder page.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#demo"
                className="rounded-full border border-black/10 bg-white/75 px-4 py-2 text-sm font-medium text-[#112018] transition hover:border-black/20 hover:bg-white"
              >
                Try demo
              </a>
              <a
                href="https://github.com/orgs/rotaptcha/repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#112018] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1c3022]"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}