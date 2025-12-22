'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [shapeData, setShapeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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
      const canvas = canvasRef.current;
      const image = new Image();
      image.onload = () => {
        imageRef.current = image;
        drawRotatedCircle(rotation);
      };
      image.src = `data:image/png;base64,${captchaImage}`;
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
          answer: rotation,
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

    // Rotate the canvas
    const rotationRadians = rotationDegrees * Math.PI / 180;
    ctx.rotate(rotationRadians);

    // Draw only the portion of the image that needs to be rotated
    ctx.drawImage(tempImage, -centerX, -centerY, canvas.width, canvas.height);

    // Restore the canvas state (removes clipping and rotation)
    ctx.restore();
  }, [shapeData]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="mb-8 text-3xl font-bold text-neutral-700">Captcha Testing Demo</h1>

        {loading && <p className="text-gray-600">Loading captcha...</p>}

        {error && (
          <p className="text-red-600">
            Error: {error}
          </p>
        )}

        {captchaImage && (
          <div className="flex flex-col items-center gap-6">
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-lg border border-gray-300"
            />
            <div className="w-80 flex flex-col items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Rotation: {rotation}°
              </label>
              <input
                type="range"
                min={0}
                max={360}
                // value={(shapeData.maxVal - shapeData.minVal)/2}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleVerify}
            disabled={verifying || !captchaImage}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700"
          >
            Reload
          </button>
        </div>

        {verificationResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            verificationResult.success 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            <p className="font-semibold">
              {verificationResult.success ? '✓ Success!' : '✗ Failed'}
            </p>
            <p className="text-sm">{verificationResult.message}</p>
          </div>
        )}
      </div>

      <footer className="absolute bottom-4 text-center w-full">
        <a
          href="https://github.com/orgs/rotaptcha/repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-teal-600 transition-colors text-sm"
        >
          GitHub Repository
        </a>
      </footer>
    </div>
  );
}
