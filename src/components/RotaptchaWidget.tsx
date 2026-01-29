'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface CaptchaConfig {
  width?: number;
  height?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  wobbleIntensity?: number;
  noise?: boolean;
  strokeWidth?: number;
  noiseDensity?: number;
  expiryTime?: number;
}

export interface RotaptchaWidgetProps {
  /** URL endpoint to create/generate captcha */
  createUrl: string;
  
  /** URL endpoint to verify captcha answer */
  verifyUrl: string;
  
  /** Configuration object for captcha generation */
  config?: CaptchaConfig;
  
  /** Callback when verification succeeds */
  onVerifySuccess?: (result: VerificationResult) => void;
  
  /** Callback when verification fails */
  onVerifyFailure?: (result: VerificationResult) => void;
  
  /** Callback when any error occurs */
  onError?: (error: string) => void;
  
  /** Whether to automatically regenerate captcha after verification */
  autoRegenerate?: boolean;
  
  /** Custom class name for the container */
  className?: string;

  /** Custom theme colors */
  theme?: {
    primary?: string;
    primaryHover?: string;
    secondary?: string;
    background?: string;
  };
}

interface VerificationResult {
  success: boolean;
  message: string;
}

interface CaptchaResponse {
  image: string;
  token: string;
  radius: number;
  maxVal?: number;
  minVal?: number;
}

// ============================
// DEFAULT CONFIGURATION
// ============================

const DEFAULT_CONFIG: Required<CaptchaConfig> = {
  width: 300,
  height: 300,
  minValue: 20,
  maxValue: 90,
  step: 10,
  wobbleIntensity: 2,
  noise: true,
  strokeWidth: 2,
  noiseDensity: 3,
  expiryTime: 300000,
};

const DEFAULT_THEME = {
  primary: '#4285f4',
  primaryHover: '#3367d6',
  secondary: '#e8f0fe',
  background: '#f8f9fa',
};

// ============================
// MAIN COMPONENT
// ============================

export default function RotaptchaWidget({
  createUrl,
  verifyUrl,
  config: userConfig,
  onVerifySuccess,
  onVerifyFailure,
  onError,
  autoRegenerate = false,
  className = '',
  theme: userTheme,
}: RotaptchaWidgetProps) {
  // Merge user config with defaults
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const theme = { ...DEFAULT_THEME, ...userTheme };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLDivElement>(null);
  
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [shapeData, setShapeData] = useState<CaptchaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(config.minValue);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // ============================
  // CAPTCHA OPERATIONS
  // ============================

  const adjustRotation = (delta: number) => {
    setRotation(prev => Math.max(config.minValue, Math.min(config.maxValue, prev + delta)));
  };

  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch captcha');
      }

      const data: CaptchaResponse = await response.json();
      setCaptchaImage(data.image);
      setShapeData(data);
      setRotation(config.minValue + config.step);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setCaptchaImage(null);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!shapeData || !shapeData.token) {
      const errorMessage = 'No captcha data available';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: shapeData.token,
          answer: rotation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify captcha');
      }

      const result: VerificationResult = await response.json();

      if (result.success) {
        setVerified(true);
        setIsPopoverOpen(false);
        setFailedAttempts(0);
        onVerifySuccess?.(result);
      } else {
        setFailedAttempts(prev => prev + 1);
        onVerifyFailure?.(result);
        // Regenerate captcha after failed attempt
        if (autoRegenerate || failedAttempts >= 2) {
          setTimeout(() => {
            fetchCaptcha();
          }, 500);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      onError?.(errorMessage);
      setFailedAttempts(prev => prev + 1);
      if (autoRegenerate) {
        setTimeout(() => {
          fetchCaptcha();
        }, 1000);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckboxClick = () => {
    if (verified) return;
    setIsPopoverOpen(true);
    // Always fetch a fresh captcha when opening
    fetchCaptcha();
  };

  const handleClosePopover = () => {
    setIsPopoverOpen(false);
  };

  const handleReset = () => {
    setVerified(false);
    setIsPopoverOpen(false);
    setCaptchaImage(null);
    setShapeData(null);
    setFailedAttempts(0);
  };

  // ============================
  // CANVAS DRAWING
  // ============================

  const drawRotatedCircle = useCallback((rotationDegrees: number) => {
    if (!imageRef.current || !canvasRef.current || !shapeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempImage = imageRef.current;

    canvas.width = tempImage.width;
    canvas.height = tempImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = shapeData.radius || 100;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
    ctx.clip();
    ctx.clearRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.translate(centerX, centerY);
    
    const rotationRadians = -rotationDegrees * Math.PI / 180;
    ctx.rotate(rotationRadians);
    ctx.drawImage(tempImage, -centerX, -centerY, canvas.width, canvas.height);
    ctx.restore();
  }, [shapeData]);

  // ============================
  // EFFECTS
  // ============================

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPopoverOpen &&
        popoverRef.current &&
        checkboxRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !checkboxRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen]);

  useEffect(() => {
    if (captchaImage && canvasRef.current) {
      const image = new Image();
      image.onload = () => {
        imageRef.current = image;
        drawRotatedCircle(rotation);
      };
      image.src = captchaImage;
    }
  }, [captchaImage, rotation]);

  useEffect(() => {
    if (imageRef.current && canvasRef.current && shapeData) {
      drawRotatedCircle(rotation);
    }
  }, [rotation, shapeData, drawRotatedCircle]);

  // ============================
  // RENDER
  // ============================

  return (
    <div className={`rotaptcha-widget relative inline-block ${className}`}>
      {/* reCAPTCHA-style Checkbox */}
      <div
        ref={checkboxRef}
        onClick={handleCheckboxClick}
        className={`
          flex items-center gap-3 px-4 py-3 bg-white border-2 rounded-md shadow-sm
          transition-all duration-200 select-none
          ${verified 
            ? 'border-green-400 cursor-default' 
            : 'border-gray-300 hover:border-gray-400 hover:shadow-md cursor-pointer'
          }
        `}
        style={{ minWidth: '280px' }}
      >
        {/* Checkbox */}
        <div 
          className={`
            w-7 h-7 rounded border-2 flex items-center justify-center transition-all duration-300
            ${verified 
              ? 'bg-green-500 border-green-500' 
              : 'bg-white border-gray-400 hover:border-gray-500'
            }
          `}
        >
          {verified && (
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          )}
        </div>

        {/* Label */}
        <span className="text-gray-700 text-sm font-medium flex-1">
          I&apos;m a Human
        </span>

        {/* Branding */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={theme.primary} strokeWidth="2"/>
              <path 
                d="M12 6v6l4 2" 
                stroke={theme.primary} 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs font-bold" style={{ color: theme.primary }}>
              rotaptcha
            </span>
          </div>
          <span className="text-[10px] text-gray-400">Security Check</span>
        </div>
      </div>

      {/* Popover with Puzzle */}
      {isPopoverOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={handleClosePopover}
          />
          
          <div
            ref={popoverRef}
            className="absolute z-50 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200"
            style={{ 
              left: 0,
              width: '340px',
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            {/* Content */}
            <div className="p-4 relative">
              {/* Close button */}
              <button
                onClick={handleClosePopover}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Loading State */}
              {(loading || !captchaImage) && !error && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-sm mt-3">Loading puzzle...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-3">
                    <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{error}</p>
                  <button
                    onClick={fetchCaptcha}
                    className="text-sm px-4 py-2 rounded-md text-white transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Captcha Display */}
              {captchaImage && !loading && (
                <div className="flex flex-col items-center gap-4">
                  {/* Canvas */}
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="rounded-lg shadow-md max-w-full h-auto"
                      style={{ maxHeight: '200px', width: 'auto' }}
                    />
                  </div>

                  {/* Slider Control */}
                  <div className="w-full">
                    <div className="flex items-center gap-3">
                      {/* Left Button */}
                      <button
                        onClick={() => adjustRotation(-config.step)}
                        disabled={rotation <= config.minValue}
                        className="shrink-0 w-10 h-10 rounded-full text-white shadow-md hover:shadow-lg 
                                   transform hover:scale-105 active:scale-95 transition-all duration-150 
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 
                                   flex items-center justify-center"
                        style={{ backgroundColor: theme.primary }}
                        aria-label="Rotate left"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Slider */}
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={config.minValue}
                          max={config.maxValue}
                          step={config.step}
                          value={rotation}
                          onChange={(e) => setRotation(Number(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                          style={{
                            background: `linear-gradient(to right, 
                              ${theme.primary} 0%, 
                              ${theme.primary} ${((rotation - config.minValue) / (config.maxValue - config.minValue)) * 100}%, 
                              #e5e7eb ${((rotation - config.minValue) / (config.maxValue - config.minValue)) * 100}%, 
                              #e5e7eb 100%)`
                          }}
                        />
                      </div>

                      {/* Right Button */}
                      <button
                        onClick={() => adjustRotation(config.step)}
                        disabled={rotation >= config.maxValue}
                        className="shrink-0 w-10 h-10 rounded-full text-white shadow-md hover:shadow-lg 
                                   transform hover:scale-105 active:scale-95 transition-all duration-150 
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 
                                   flex items-center justify-center"
                        style={{ backgroundColor: theme.primary }}
                        aria-label="Rotate right"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={handleVerify}
                      disabled={verifying || !captchaImage}
                      className="flex-1 rounded-md px-3 py-2 text-white font-medium text-sm cursor-pointer
                                 disabled:bg-gray-400 disabled:cursor-not-allowed 
                                 shadow hover:shadow-md transition-all duration-150"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {verifying ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        'Verify'
                      )}
                    </button>
                    <button
                      onClick={fetchCaptcha}
                      disabled={loading}
                      className="shrink-0 rounded-md bg-white border border-gray-300 px-2.5 py-2 cursor-pointer
                                 text-gray-600 hover:bg-gray-50 hover:border-gray-400 
                                 transition-all duration-150 disabled:opacity-50"
                      title="Get new puzzle"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reset button when verified (optional, for testing) */}
      {verified && (
        <button
          onClick={handleReset}
          className="absolute -right-2 -top-2 w-5 h-5 bg-gray-400 hover:bg-gray-500 
                     text-white rounded-full text-xs flex items-center justify-center
                     transition-colors shadow-sm"
          title="Reset captcha"
        >
          ×
        </button>
      )}

    </div>
  );
}
