# Rotaptcha Widget - Integration Guide

A fully self-contained, reusable React component for integrating Rotaptcha (Rotation CAPTCHA) into your applications.

## 📦 Quick Start

### 1. Copy the Component

Copy the `RotaptchaWidget.tsx` file to your project's components directory.

### 2. Basic Usage

```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';

function MyForm() {
  return (
    <RotaptchaWidget
      createUrl="/api/captcha/create"
      verifyUrl="/api/captcha/verify"
    />
  );
}
```

## 🔧 Component Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `createUrl` | `string` | API endpoint to generate/create captcha |
| `verifyUrl` | `string` | API endpoint to verify captcha answer |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `CaptchaConfig` | See defaults | Configuration object for captcha generation |
| `onVerifySuccess` | `(result) => void` | - | Callback when verification succeeds |
| `onVerifyFailure` | `(result) => void` | - | Callback when verification fails |
| `onError` | `(error: string) => void` | - | Callback when any error occurs |
| `autoRegenerate` | `boolean` | `true` | Auto-regenerate captcha after verification |
| `className` | `string` | `''` | Custom CSS class for container |
| `showConfigPanel` | `boolean` | `false` | Show configuration panel (for testing) |
| `theme` | `ThemeConfig` | See defaults | Custom theme colors |

## ⚙️ Configuration Object

```typescript
interface CaptchaConfig {
  width?: number;              // Canvas width (default: 300)
  height?: number;             // Canvas height (default: 300)
  minValue?: number;           // Minimum rotation angle (default: 20)
  maxValue?: number;           // Maximum rotation angle (default: 90)
  step?: number;               // Rotation step increment (default: 10)
  wobbleIntensity?: number;    // Shape distortion 1-5 (default: 2)
  noise?: boolean;             // Enable background noise (default: true)
  strokeWidth?: number;        // Line thickness (default: 2)
  availableColors?: string[];  // Color palette for shapes
  canvasBg?: string;          // Canvas background color
  noiseDensity?: number;      // Noise intensity 1-6 (default: 3)
  expiryTime?: number;        // Token expiry in ms (default: 300000)
}
```

## 🎨 Theme Customization

```typescript
interface ThemeConfig {
  primary?: string;        // Primary color (default: '#BB2649')
  primaryHover?: string;   // Primary hover color (default: '#9A1F3C')
  secondary?: string;      // Secondary color (default: '#E8A5B8')
  background?: string;     // Background color (default: '#FFF0F5')
}
```

## 📚 Usage Examples

### Example 1: Basic Integration

```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';

export default function LoginPage() {
  return (
    <div className="container">
      <h1>Login</h1>
      <form>
        {/* Your form fields */}
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        
        {/* Captcha Widget */}
        <RotaptchaWidget
          createUrl="/api/captcha/create"
          verifyUrl="/api/captcha/verify"
        />
        
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
```

### Example 2: With Callbacks

```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';
import { useState } from 'react';

export default function SignupPage() {
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSuccess = (result) => {
    console.log('Captcha verified!', result);
    setCaptchaVerified(true);
    // Proceed with form submission
  };

  const handleFailure = (result) => {
    console.log('Captcha failed:', result);
    setCaptchaVerified(false);
  };

  const handleError = (error) => {
    console.error('Captcha error:', error);
  };

  return (
    <RotaptchaWidget
      createUrl="/api/captcha/create"
      verifyUrl="/api/captcha/verify"
      onVerifySuccess={handleSuccess}
      onVerifyFailure={handleFailure}
      onError={handleError}
      autoRegenerate={true}
    />
  );
}
```

### Example 3: Custom Configuration

```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';

export default function CustomCaptcha() {
  const customConfig = {
    width: 400,
    height: 400,
    minValue: 30,
    maxValue: 120,
    step: 5,
    wobbleIntensity: 3,
    noise: true,
    strokeWidth: 3,
    availableColors: ['#FF0000', '#00FF00', '#0000FF'],
    canvasBg: '#F0F0F0',
    noiseDensity: 4,
    expiryTime: 600000, // 10 minutes
  };

  return (
    <RotaptchaWidget
      createUrl="/api/captcha/create"
      verifyUrl="/api/captcha/verify"
      config={customConfig}
    />
  );
}
```

### Example 4: Custom Theme

```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';

export default function BrandedCaptcha() {
  const brandTheme = {
    primary: '#6366F1',        // Indigo
    primaryHover: '#4F46E5',
    secondary: '#A5B4FC',
    background: '#EEF2FF',
  };

  return (
    <RotaptchaWidget
      createUrl="/api/captcha/create"
      verifyUrl="/api/captcha/verify"
      theme={brandTheme}
    />
  );
}
```

### Example 5: Form Integration with State Management

```tsx
'use client';
import RotaptchaWidget from '@/components/RotaptchaWidget';
import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!captchaVerified) {
      alert('Please complete the captcha');
      return;
    }

    // Submit form
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    
    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Message"
      />

      <RotaptchaWidget
        createUrl="/api/captcha/create"
        verifyUrl="/api/captcha/verify"
        onVerifySuccess={() => setCaptchaVerified(true)}
        onVerifyFailure={() => setCaptchaVerified(false)}
        autoRegenerate={false}
      />

      <button type="submit" disabled={!captchaVerified}>
        Send Message
      </button>
    </form>
  );
}
```

## 🔌 Backend API Requirements

Your backend must provide two endpoints:

### Create Captcha Endpoint

**POST** `/api/captcha/create`

**Request Body:**
```json
{
  "width": 300,
  "height": 300,
  "minValue": 20,
  "maxValue": 90,
  "step": 10,
  "wobbleIntensity": 2,
  "noise": true,
  "strokeWidth": 2,
  "availableColors": ["#FF6B6B", "#4ECDC4"],
  "canvasBg": "#FFFFFF",
  "noiseDensity": 3,
  "expiryTime": 300000
}
```

**Response:**
```json
{
  "image": "data:image/png;base64,iVBORw0KG...",
  "token": "encrypted-token-string",
  "radius": 100.8,
  "maxVal": 90,
  "minVal": 20
}
```

### Verify Captcha Endpoint

**POST** `/api/captcha/verify`

**Request Body:**
```json
{
  "token": "encrypted-token-string",
  "answer": 45
}
```

**Response:**
```json
{
  "success": true,
  "message": "Captcha verified successfully"
}
```

## 🎯 Integration Checklist

- [ ] Copy `RotaptchaWidget.tsx` to your components folder
- [ ] Ensure Tailwind CSS is configured in your project
- [ ] Set up backend API endpoints (`/api/captcha/create` and `/api/captcha/verify`)
- [ ] Import and use the component in your form
- [ ] Add callbacks for success/failure handling
- [ ] Customize theme colors (optional)
- [ ] Configure captcha settings (optional)
- [ ] Test the integration

## 🚀 Framework-Specific Notes

### Next.js (App Router)
```tsx
'use client'; // Required for client-side component
import RotaptchaWidget from '@/components/RotaptchaWidget';
```

### Next.js (Pages Router)
```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';
// No 'use client' directive needed
```

### React (Vite/CRA)
```tsx
import RotaptchaWidget from './components/RotaptchaWidget';
```

## 🎨 Styling

The component uses Tailwind CSS for styling. If you're not using Tailwind, you'll need to:

1. Install Tailwind CSS in your project, OR
2. Convert the component styles to your preferred CSS solution

## 📝 TypeScript Types

The component exports these types for your use:

```typescript
import type { 
  CaptchaConfig, 
  RotaptchaWidgetProps 
} from '@/components/RotaptchaWidget';
```

## 🔒 Security Best Practices

1. **Use HTTPS** - Always serve captcha over HTTPS
2. **Validate on Server** - Never trust client-side verification alone
3. **Set Expiry Time** - Use reasonable `expiryTime` values (5-10 minutes)
4. **Rate Limiting** - Implement rate limiting on your API endpoints
5. **Secret Key** - Keep your secret key secure and never expose it client-side

## 📦 Dependencies

The component requires:
- React 18+
- Tailwind CSS (for styling)
- Modern browser with Canvas API support

## 🌐 Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported  
- Safari: ✅ Fully supported
- IE11: ❌ Not supported

## 📄 License

This component can be freely used in your projects. Refer to your project's license for distribution terms.

## 🤝 Support

For issues or questions:
- Check the component's source code comments
- Review the examples in this document
- Visit: https://github.com/orgs/rotaptcha/repositories

## 🎉 Ready to Use!

You now have everything you need to integrate Rotaptcha into your application. Copy the component, set up your API endpoints, and start using it!
