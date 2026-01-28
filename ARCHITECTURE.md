# 📐 Rotaptcha Widget Architecture

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    RotaptchaWidget                          │
│                                                             │
│  Props:                                                     │
│  ├─ createUrl   (required)                                 │
│  ├─ verifyUrl   (required)                                 │
│  ├─ config      (optional)                                 │
│  ├─ theme       (optional)                                 │
│  ├─ onVerifySuccess (optional)                             │
│  ├─ onVerifyFailure (optional)                             │
│  ├─ onError     (optional)                                 │
│  └─ autoRegenerate (optional)                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Internal State                          │   │
│  │  • captchaImage (base64 image)                     │   │
│  │  • rotation (current angle)                        │   │
│  │  • loading, verifying, error                       │   │
│  │  • verificationResult                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Core Functions                          │   │
│  │  • fetchCaptcha()     - Get new captcha            │   │
│  │  • handleVerify()     - Submit answer              │   │
│  │  • adjustRotation()   - +/- rotation               │   │
│  │  • drawRotatedCircle()- Canvas rendering           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   Your App   │
└──────┬───────┘
       │ Props
       ▼
┌────────────────────────────────────────┐
│      RotaptchaWidget Component         │
│                                        │
│  1. On Mount: fetchCaptcha()           │
│     ├─► POST createUrl                 │
│     └─► Receive image + token          │
│                                        │
│  2. User Rotates: adjustRotation()     │
│     └─► Update rotation state          │
│                                        │
│  3. User Clicks Verify:                │
│     ├─► POST verifyUrl                 │
│     │   (token + rotation angle)       │
│     └─► Get success/failure            │
│                                        │
│  4. Callbacks:                         │
│     ├─► onVerifySuccess()              │
│     ├─► onVerifyFailure()              │
│     └─► onError()                      │
│                                        │
│  5. Auto-regenerate (if enabled)       │
│     └─► fetchCaptcha() again           │
└────────────────────────────────────────┘
```

## API Communication

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│  Component  │          │   Backend    │          │  Database/  │
│             │          │   API        │          │  Session    │
└──────┬──────┘          └───────┬──────┘          └──────┬──────┘
       │                         │                         │
       │ 1. Create Captcha       │                         │
       ├────────────────────────►│                         │
       │                         │ 2. Generate Token       │
       │                         ├────────────────────────►│
       │                         │                         │
       │                         │◄────────────────────────┤
       │                         │ 3. Store Token+Answer   │
       │◄────────────────────────┤                         │
       │ 4. Return Image+Token   │                         │
       │                         │                         │
       │ (User solves captcha)   │                         │
       │                         │                         │
       │ 5. Verify Answer        │                         │
       ├────────────────────────►│                         │
       │                         │ 6. Check Token+Answer   │
       │                         ├────────────────────────►│
       │                         │                         │
       │                         │◄────────────────────────┤
       │                         │ 7. Validation Result    │
       │◄────────────────────────┤                         │
       │ 8. Return Success/Fail  │                         │
       │                         │                         │
```

## Component Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    Component Mount                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  useEffect(() => fetchCaptcha(), [])                    │
│  └─► Initial captcha generation                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Captcha Loaded & Displayed                   │
│  • Canvas shows rotated image                           │
│  • Slider initialized to minValue + step                │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐
│  User Adjusts    │    │   User Clicks        │
│  Rotation        │    │   Verify             │
│  (Slider/Buttons)│    │                      │
└────────┬─────────┘    └──────────┬───────────┘
         │                         │
         │                         ▼
         │              ┌──────────────────────┐
         │              │  handleVerify()      │
         │              │  └─► POST to API     │
         │              └──────────┬───────────┘
         │                         │
         │              ┌──────────┴───────────┐
         │              │                      │
         │              ▼                      ▼
         │    ┌─────────────────┐   ┌─────────────────┐
         │    │    Success      │   │    Failure      │
         │    │  └─► Callback   │   │  └─► Callback   │
         │    └────────┬────────┘   └────────┬────────┘
         │             │                     │
         │             └──────────┬──────────┘
         │                        │
         │                        ▼
         │           ┌────────────────────────┐
         │           │  autoRegenerate?       │
         │           └────────┬───────────────┘
         │                    │
         │                    ▼
         └───────────► fetchCaptcha()
                      (New captcha)
```

## File Structure for Integration

```
your-project/
│
├── src/
│   ├── components/
│   │   └── RotaptchaWidget.tsx  ◄── Copy this file
│   │
│   ├── app/ (or pages/)
│   │   ├── page.tsx              ◄── Your page using component
│   │   └── api/
│   │       └── captcha/
│   │           ├── create/
│   │           │   └── route.ts  ◄── Your create endpoint
│   │           └── verify/
│   │               └── route.ts  ◄── Your verify endpoint
│   │
│   └── styles/
│       └── globals.css           ◄── Must have Tailwind
│
├── INTEGRATION_GUIDE.md          ◄── Documentation
├── QUICK_START.md                ◄── Quick reference
└── INTEGRATION_EXAMPLES.tsx      ◄── Code examples
```

## Typical Integration Pattern

```tsx
// Step 1: Import the component
import RotaptchaWidget from '@/components/RotaptchaWidget';

// Step 2: Create your form/page
export default function MyPage() {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  // Step 3: Add the component with callbacks
  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      
      <RotaptchaWidget
        createUrl="/api/captcha/create"
        verifyUrl="/api/captcha/verify"
        onVerifySuccess={() => setCaptchaVerified(true)}
        onVerifyFailure={() => setCaptchaVerified(false)}
      />
      
      <button disabled={!captchaVerified}>
        Submit
      </button>
    </form>
  );
}
```

## State Management Flow

```
┌────────────────────────────────────────────┐
│         Component Internal State           │
│                                            │
│  loading: boolean                          │
│    ├─► true: Shows loading spinner        │
│    └─► false: Shows captcha               │
│                                            │
│  error: string | null                      │
│    ├─► null: No error                     │
│    └─► string: Shows error message        │
│                                            │
│  captchaImage: string | null               │
│    ├─► null: No captcha loaded            │
│    └─► base64: Image data                 │
│                                            │
│  rotation: number                          │
│    └─► Current rotation angle (degrees)   │
│                                            │
│  verifying: boolean                        │
│    ├─► true: Shows "Verifying..."         │
│    └─► false: Shows "Verify"              │
│                                            │
│  verificationResult: object | null         │
│    ├─► null: No result yet                │
│    └─► { success, message }: Result shown │
│                                            │
└────────────────────────────────────────────┘
```

## UI Component Breakdown

```
RotaptchaWidget
│
├── Loading State
│   ├── Spinner
│   └── "Loading captcha..." text
│
├── Error State
│   ├── Error icon
│   └── Error message
│
├── Captcha Display (main state)
│   │
│   ├── Canvas (with rotated image)
│   │
│   ├── Slider Controls
│   │   ├── "Rotation" label
│   │   ├── Current angle badge
│   │   ├── Left button (-)
│   │   ├── Range slider
│   │   └── Right button (+)
│   │
│   ├── Action Buttons
│   │   ├── Verify button
│   │   └── Regenerate button
│   │
│   └── Verification Result
│       ├── Success message (green)
│       └── Failure message (red)
│
└── Styles (inline + Tailwind)
```

---

## Key Design Decisions

### ✅ Why Self-Contained?
- Easy to share and integrate
- No external dependencies (except React & Tailwind)
- Single file to copy

### ✅ Why Prop-Based API?
- Simple to use
- Flexible configuration
- Clear interface

### ✅ Why Callbacks?
- Don't force specific state management
- Works with any React pattern
- Optional (component works standalone)

### ✅ Why Canvas?
- Precise rotation rendering
- Smooth animations
- Browser-optimized

---

This architecture ensures the component is:
- 🔧 Easy to integrate
- 🎨 Highly customizable
- 🚀 Production-ready
- 📦 Self-contained
