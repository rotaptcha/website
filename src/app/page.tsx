'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CaptchaConfig {
  width: number;
  height: number;
  minValue: number;
  maxValue: number;
  step: number;
  wobbleIntensity: number;
  noise: boolean;
  strokeWidth: number;
  availableColors: string[];
  canvasBg: string;
  noiseDensity: number;
  expiryTime: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [shapeData, setShapeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [config, setConfig] = useState<CaptchaConfig>({
    width: 300,
    height: 300,
    minValue: 20,
    maxValue: 90,
    step: 10,
    wobbleIntensity: 2,
    noise: true,
    strokeWidth: 2,
    availableColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    canvasBg: '#FFFFFF',
    noiseDensity: 3,
    expiryTime: 300000
  });

  const adjustRotation = (delta: number) => {
    setRotation(prev => Math.max(config.minValue, Math.min(config.maxValue, prev + delta)));
  };

  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/captcha/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch captcha');
      }

      const data = await response.json();
      setCaptchaImage(data.image);
      setShapeData(data);
      setError(null);
      setRotation(Math.floor((config.maxValue + config.minValue) / 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCaptchaImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof CaptchaConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };


  useEffect(() => {
    const fetchCaptcha = async () => {

      try {

        setLoading(true);
        const response = await fetch('/api/captcha/create');

        if (!response.ok) {
          throw new Error('Failed to fetch captcha');
        }

        const data = await response.json();
        setCaptchaImage(data.image);
        setShapeData(data);
        setError(null);
        setRotation(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setCaptchaImage(null);
      } finally {
        setLoading(false);
      }

    };

    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (captchaImage && canvasRef.current) {
     
      const image = new Image();
      image.onload = () => {
        imageRef.current = image;
        drawRotatedCircle(rotation);
      };
      image.src = `${captchaImage}`;
    }
  }, [captchaImage, rotation]);

  useEffect(() => {
    if (imageRef.current && canvasRef.current && shapeData) {
      drawRotatedCircle(rotation);
    }
  }, [rotation, shapeData]);

  const handleVerify = async () => {
    if (!shapeData || !shapeData.token) {
      setError('No captcha data available');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);
    setError(null);

    try {
      const response = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: shapeData.token,
          answer: Math.abs(rotation),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify captcha');
      }

      const result = await response.json();
      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const drawRotatedCircle = useCallback((rotationDegrees: number) => {
    if (!imageRef.current || !canvasRef.current || !shapeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempImage = imageRef.current;

    // Set canvas dimensions
    canvas.width = tempImage.width;
    canvas.height = tempImage.height;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the original image first (non-rotated background)
    ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);

    // Center point of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Get radius from API response (fallback to 50 if not provided)
    const radius = shapeData.radius || 100;

    // Save the current state
    ctx.save();

    // Create a circular clipping path
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
    ctx.clip();

    // Clear the clipped circular area
    ctx.clearRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    // Move to the center of the canvas
    ctx.translate(centerX, centerY);

    // Rotate the canvas (negative for anticlockwise)
    const rotationRadians = -rotationDegrees * Math.PI / 180;
    ctx.rotate(rotationRadians);

    // Draw only the portion of the image that needs to be rotated
    ctx.drawImage(tempImage, -centerX, -centerY, canvas.width, canvas.height);

    // Restore the canvas state (removes clipping and rotation)
    ctx.restore();
  }, [shapeData]);

  return (
    <div className="min-h-screen bg-[#FFF5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#E2552D] mb-2 md:mb-3">
            Rotaptcha
          </h1>
          <p className="text-[#8B2E1A] text-base sm:text-lg font-medium px-4">Rotate the inner circle to match the image</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Card */}
          <div className={`${showConfig ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm bg-opacity-95`}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Loading captcha...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium">Error: {error}</p>
              </div>
            </div>
          )}

          {captchaImage && (
            <div className="flex flex-col items-center gap-8">
              {/* Canvas */}
              <div className="relative w-full flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="rounded-lg md:rounded-xl shadow-xl border-2 md:border-4 border-white ring-1 md:ring-2 ring-[#F8C4B8] max-w-full h-auto"
                />
              </div>

              {/* Slider Section */}
              <div className="w-full space-y-3 md:space-y-4">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
                  <div className="text-xs sm:text-sm font-semibold text-[#8B2E1A] uppercase tracking-wide">
                    Rotation
                  </div>
                  <div className="px-3 md:px-4 py-1.5 md:py-2 bg-[#E2552D] text-white rounded-lg font-bold text-base md:text-lg min-w-[70px] md:min-w-[80px] text-center shadow-md">
                    {rotation}°
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  {/* Left Button */}
                  <button
                    onClick={() => adjustRotation(-config.step)}
                    disabled={rotation <= config.minValue}
                    className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E2552D] hover:bg-[#CC4A27] text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center font-bold text-2xl"
                    aria-label="Rotate left"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
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
                      className="w-full h-3 sm:h-4 rounded-full appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, 
                          #E2552D 0%, 
                          #E2552D ${((rotation - config.minValue) / (config.maxValue - config.minValue)) * 100}%, 
                          #F8C4B8 ${((rotation - config.minValue) / (config.maxValue - config.minValue)) * 100}%, 
                          #F8C4B8 100%)`
                      }}
                    />
                    {/* Tick marks */}
                    <div className="flex justify-between px-1 mt-2">
                      <span className="text-xs text-gray-400 font-medium">{config.minValue}°</span>
                      <span className="text-xs text-gray-400 font-medium">{Math.floor((config.maxValue + config.minValue) / 2)}°</span>
                      <span className="text-xs text-gray-400 font-medium">{config.maxValue}°</span>
                    </div>
                  </div>

                  {/* Right Button */}
                  <button
                    onClick={() => adjustRotation(config.step)}
                    disabled={rotation >= config.maxValue}
                    className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E2552D] hover:bg-[#CC4A27] text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center font-bold text-2xl"
                    aria-label="Rotate right"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 md:gap-4 w-full">
                {!showConfig && (
                  <button
                    onClick={() => setShowConfig(true)}
                    className="flex-shrink-0 rounded-lg md:rounded-xl bg-white border-2 border-[#F8C4B8] px-4 sm:px-5 md:px-6 py-3 md:py-4 text-[#E2552D] font-semibold hover:border-[#E2552D] hover:bg-[#FFF5F3] shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleVerify}
                  disabled={verifying || !captchaImage}
                  className="flex-1 rounded-lg md:rounded-xl bg-[#E2552D] hover:bg-[#CC4A27] px-4 sm:px-6 md:px-8 py-3 md:py-4 text-white font-semibold text-base md:text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:hover:translate-y-0">
                
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
                  className="flex-shrink-0 rounded-lg md:rounded-xl bg-white border-2 border-[#F8C4B8] px-4 sm:px-5 md:px-6 py-3 md:py-4 text-[#E2552D] font-semibold hover:border-[#E2552D] hover:bg-[#FFF5F3] shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className={`mt-4 md:mt-6 p-4 md:p-6 rounded-lg md:rounded-xl border-2 ${
              verificationResult.success 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
            } shadow-lg transform transition-all duration-300 animate-in`}>
              <div className="flex items-start gap-3 md:gap-4">
                {verificationResult.success ? (
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div>
                  <p className={`font-bold text-lg sm:text-xl mb-1 ${
                    verificationResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.success ? 'Success!' : 'Verification Failed'}
                  </p>
                  <p className={`${
                    verificationResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Configuration Panel */}
          {showConfig && (
            <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-bold text-[#E2552D] mb-4">Configuration</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={config.width}
                    onChange={(e) => handleConfigChange('width', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={config.height}
                    onChange={(e) => handleConfigChange('height', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Min Value (degrees)</label>
                  <input
                    type="number"
                    value={config.minValue}
                    onChange={(e) => handleConfigChange('minValue', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Max Value (degrees)</label>
                  <input
                    type="number"
                    value={config.maxValue}
                    onChange={(e) => handleConfigChange('maxValue', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Step</label>
                  <input
                    type="number"
                    value={config.step}
                    onChange={(e) => handleConfigChange('step', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Wobble Intensity (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.wobbleIntensity}
                    onChange={(e) => handleConfigChange('wobbleIntensity', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stroke Width</label>
                  <input
                    type="number"
                    value={config.strokeWidth}
                    onChange={(e) => handleConfigChange('strokeWidth', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Noise Intensity (1-6)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={config.noiseDensity}
                    onChange={(e) => handleConfigChange('noiseDensity', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Time (ms)</label>
                  <input
                    type="number"
                    value={config.expiryTime}
                    onChange={(e) => handleConfigChange('expiryTime', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2552D] focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.noise}
                      onChange={(e) => handleConfigChange('noise', e.target.checked)}
                      className="w-5 h-5 text-[#E2552D] rounded focus:ring-2 focus:ring-[#E2552D]"
                    />
                    <span className="text-sm font-semibold text-gray-700">Enable Noise</span>
                  </label>
                </div>

                <button
                  onClick={fetchCaptcha}
                  disabled={loading}
                  className="w-full rounded-lg bg-[#E2552D] hover:bg-[#CC4A27] px-4 py-3 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {loading ? 'Generating...' : 'Generate Captcha'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 md:mt-8 text-center px-4">
          <a
            href="https://github.com/orgs/rotaptcha/repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#8B2E1A] hover:text-[#E2552D] transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </div>
    
  );
}