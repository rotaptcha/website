'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaptcha = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/captcha');
        
        if (!response.ok) {
          throw new Error('Failed to fetch captcha');
        }
        
        const data = await response.json();
        setCaptchaImage(data.image);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setCaptchaImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCaptcha();
  }, []);

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
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${captchaImage}`}
              alt="Captcha"
              className="rounded-lg shadow-lg"
            />
          </div>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="mt-8 rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700"
        >
          Reload
        </button>
      </div>
      
      <footer className="absolute bottom-4 text-center w-full">
        <a
          href="https://github.com/rotaptcha/"
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
