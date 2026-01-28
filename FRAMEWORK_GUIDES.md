# 🔧 Framework-Specific Integration Guide

This guide shows how to integrate the Rotaptcha Widget in different frameworks and scenarios.

---

## 🎯 Next.js (App Router)

### Basic Setup

```tsx
// app/login/page.tsx
'use client';

import RotaptchaWidget from '@/components/RotaptchaWidget';
import { useState } from 'react';

export default function LoginPage() {
  const [verified, setVerified] = useState(false);

  return (
    <div className="container mx-auto p-8">
      <h1>Login</h1>
      
      <RotaptchaWidget
        createUrl="/api/captcha/create"
        verifyUrl="/api/captcha/verify"
        onVerifySuccess={() => setVerified(true)}
      />
      
      <button disabled={!verified}>
        Login
      </button>
    </div>
  );
}
```

### API Routes

```typescript
// app/api/captcha/create/route.ts
import { NextResponse } from 'next/server';
import rotaptcha from 'rotaptcha-node';

export async function POST(request: Request) {
  const config = await request.json();
  const result = await rotaptcha.create(config, process.env.SECRET_KEY!);
  
  return NextResponse.json({
    image: result.image,
    token: result.token,
    radius: config.width * 0.4 * 0.84,
  });
}
```

```typescript
// app/api/captcha/verify/route.ts
import { NextResponse } from 'next/server';
import rotaptcha from 'rotaptcha-node';

export async function POST(request: Request) {
  const { token, answer } = await request.json();
  const isValid = await rotaptcha.verify({ token, answer }, process.env.SECRET_KEY!);
  
  return NextResponse.json({
    success: isValid,
    message: isValid ? 'Verified!' : 'Invalid answer',
  });
}
```

---

## 🎯 Next.js (Pages Router)

### Component Usage

```tsx
// pages/signup.tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';
import { useState } from 'react';

export default function SignupPage() {
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      alert('Please complete captcha');
      return;
    }
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <RotaptchaWidget
        createUrl="/api/captcha/create"
        verifyUrl="/api/captcha/verify"
        onVerifySuccess={() => setCaptchaVerified(true)}
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### API Routes

```typescript
// pages/api/captcha/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import rotaptcha from 'rotaptcha-node';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await rotaptcha.create(req.body, process.env.SECRET_KEY!);
  res.status(200).json({
    image: result.image,
    token: result.token,
    radius: req.body.width * 0.4 * 0.84,
  });
}
```

---

## 🎯 React (Vite/CRA)

### Component Usage

```tsx
// src/pages/Contact.tsx
import RotaptchaWidget from '../components/RotaptchaWidget';
import { useState } from 'react';

export default function ContactPage() {
  const [verified, setVerified] = useState(false);

  return (
    <div className="container">
      <h1>Contact Us</h1>
      
      <RotaptchaWidget
        createUrl="http://localhost:3000/api/captcha/create"
        verifyUrl="http://localhost:3000/api/captcha/verify"
        onVerifySuccess={() => setVerified(true)}
      />
      
      <button disabled={!verified}>Send</button>
    </div>
  );
}
```

### With Environment Variables

```tsx
// .env
VITE_API_URL=http://localhost:3000

// src/pages/Contact.tsx
const API_URL = import.meta.env.VITE_API_URL;

<RotaptchaWidget
  createUrl={`${API_URL}/api/captcha/create`}
  verifyUrl={`${API_URL}/api/captcha/verify`}
/>
```

---

## 🎯 React + Express Backend

### Frontend

```tsx
// src/components/LoginForm.tsx
import RotaptchaWidget from './RotaptchaWidget';

export default function LoginForm() {
  return (
    <form>
      <input type="email" />
      <input type="password" />
      
      <RotaptchaWidget
        createUrl="http://localhost:5000/captcha/create"
        verifyUrl="http://localhost:5000/captcha/verify"
      />
      
      <button>Login</button>
    </form>
  );
}
```

### Backend (Express)

```javascript
// server.js
const express = require('express');
const rotaptcha = require('rotaptcha-node');
const app = express();

app.use(express.json());

app.post('/captcha/create', async (req, res) => {
  const result = await rotaptcha.create(req.body, process.env.SECRET_KEY);
  res.json({
    image: result.image,
    token: result.token,
    radius: req.body.width * 0.4 * 0.84,
  });
});

app.post('/captcha/verify', async (req, res) => {
  const isValid = await rotaptcha.verify(req.body, process.env.SECRET_KEY);
  res.json({
    success: isValid,
    message: isValid ? 'Verified!' : 'Invalid',
  });
});

app.listen(5000);
```

---

## 🎯 With React Hook Form

```tsx
import RotaptchaWidget from './components/RotaptchaWidget';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

export default function Form() {
  const { register, handleSubmit } = useForm();
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const onSubmit = (data: any) => {
    if (!captchaVerified) {
      alert('Complete captcha first');
      return;
    }
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      <input {...register('password')} />
      
      <RotaptchaWidget
        createUrl="/api/captcha/create"
        verifyUrl="/api/captcha/verify"
        onVerifySuccess={() => setCaptchaVerified(true)}
        onVerifyFailure={() => setCaptchaVerified(false)}
      />
      
      <button disabled={!captchaVerified}>Submit</button>
    </form>
  );
}
```

---

## 🎯 With Redux/Context State

```tsx
import RotaptchaWidget from './components/RotaptchaWidget';
import { useDispatch } from 'react-redux';
import { setCaptchaVerified } from './store/captchaSlice';

export default function Form() {
  const dispatch = useDispatch();

  return (
    <RotaptchaWidget
      createUrl="/api/captcha/create"
      verifyUrl="/api/captcha/verify"
      onVerifySuccess={() => {
        dispatch(setCaptchaVerified(true));
      }}
      onVerifyFailure={() => {
        dispatch(setCaptchaVerified(false));
      }}
    />
  );
}
```

---

## 🎯 With TypeScript Strict Mode

```tsx
import RotaptchaWidget, { 
  CaptchaConfig, 
  RotaptchaWidgetProps 
} from '@/components/RotaptchaWidget';

const config: CaptchaConfig = {
  width: 300,
  height: 300,
  minValue: 20,
  maxValue: 90,
};

export default function StrictComponent() {
  const handleSuccess = (result: { success: boolean; message: string }) => {
    console.log('Verified:', result.message);
  };

  const handleError = (error: string) => {
    console.error('Error:', error);
  };

  return (
    <RotaptchaWidget
      createUrl="/api/captcha/create"
      verifyUrl="/api/captcha/verify"
      config={config}
      onVerifySuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

---

## 🎯 Multi-Step Form Integration

```tsx
import RotaptchaWidget from './components/RotaptchaWidget';
import { useState } from 'react';

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>Step 1: Personal Info</h2>
          {/* Form fields */}
          <button onClick={() => setStep(2)}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: Verification</h2>
          <RotaptchaWidget
            createUrl="/api/captcha/create"
            verifyUrl="/api/captcha/verify"
            onVerifySuccess={() => {
              setCaptchaVerified(true);
              setTimeout(() => setStep(3), 1000);
            }}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Step 3: Confirmation</h2>
          {/* Final step */}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Modal/Dialog Integration

```tsx
import RotaptchaWidget from './components/RotaptchaWidget';
import { useState } from 'react';

export default function ModalExample() {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [verified, setVerified] = useState(false);

  return (
    <>
      <button onClick={() => setShowCaptcha(true)}>
        Verify Identity
      </button>

      {showCaptcha && (
        <div className="modal">
          <div className="modal-content">
            <h2>Verify You're Human</h2>
            
            <RotaptchaWidget
              createUrl="/api/captcha/create"
              verifyUrl="/api/captcha/verify"
              onVerifySuccess={() => {
                setVerified(true);
                setShowCaptcha(false);
              }}
            />
            
            <button onClick={() => setShowCaptcha(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 🎯 Without Tailwind CSS

If you don't use Tailwind, convert the component styles:

```tsx
// Add this to your CSS file
.rotaptcha-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.rotaptcha-canvas {
  border-radius: 12px;
  border: 4px solid white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

// ... etc
```

Then modify the component to use these classes instead of Tailwind utilities.

---

## 🎯 Custom Backend (Django, Flask, etc.)

The component works with any backend that provides the two endpoints:

### Python Flask Example

```python
from flask import Flask, request, jsonify
import rotaptcha  # Hypothetical Python package

app = Flask(__name__)

@app.route('/api/captcha/create', methods=['POST'])
def create_captcha():
    config = request.json
    result = rotaptcha.create(config, SECRET_KEY)
    return jsonify({
        'image': result['image'],
        'token': result['token'],
        'radius': config['width'] * 0.4 * 0.84
    })

@app.route('/api/captcha/verify', methods=['POST'])
def verify_captcha():
    data = request.json
    is_valid = rotaptcha.verify(data, SECRET_KEY)
    return jsonify({
        'success': is_valid,
        'message': 'Verified!' if is_valid else 'Invalid'
    })
```

---

## 🎯 Environment-Specific URLs

```tsx
// config.ts
export const API_URLS = {
  development: 'http://localhost:3000',
  production: 'https://api.yourdomain.com',
};

const env = process.env.NODE_ENV || 'development';
export const BASE_URL = API_URLS[env];

// Component usage
<RotaptchaWidget
  createUrl={`${BASE_URL}/api/captcha/create`}
  verifyUrl={`${BASE_URL}/api/captcha/verify`}
/>
```

---

## 📝 Summary

The Rotaptcha Widget is framework-agnostic and works with:
- ✅ Next.js (App Router & Pages Router)
- ✅ React (Vite, CRA)
- ✅ Any React-based framework
- ✅ Any backend (Node, Python, PHP, etc.)

**Key Requirements:**
1. React 18+
2. Tailwind CSS (or custom styles)
3. Two API endpoints (create & verify)

**That's it!** The component handles everything else.
