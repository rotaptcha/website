# 🎯 Rotaptcha Widget - Quick Reference

## Copy These Files
```
src/components/RotaptchaWidget.tsx  → Your component (REQUIRED)
INTEGRATION_GUIDE.md                → Full documentation
INTEGRATION_EXAMPLES.tsx            → Code examples
```

## Minimum Code to Get Started

```tsx
import RotaptchaWidget from '@/components/RotaptchaWidget';

<RotaptchaWidget
  createUrl="/api/captcha/create"
  verifyUrl="/api/captcha/verify"
/>
```

## Props Quick Reference

### ✅ Required
- `createUrl` - API endpoint to create captcha
- `verifyUrl` - API endpoint to verify answer

### ⚙️ Optional
- `config` - Captcha settings (size, colors, difficulty)
- `onVerifySuccess` - Callback for successful verification
- `onVerifyFailure` - Callback for failed verification  
- `onError` - Callback for errors
- `autoRegenerate` - Auto-reload after verify (default: true)
- `theme` - Custom colors
- `className` - CSS class name

## API Response Format

### Create Endpoint Response
```json
{
  "image": "data:image/png;base64,...",
  "token": "encrypted-token",
  "radius": 100.8
}
```

### Verify Endpoint Response
```json
{
  "success": true,
  "message": "Captcha verified successfully"
}
```

## Common Customizations

### Change Colors
```tsx
<RotaptchaWidget
  theme={{
    primary: '#YOUR_COLOR',
    primaryHover: '#YOUR_HOVER_COLOR',
  }}
/>
```

### Change Size
```tsx
<RotaptchaWidget
  config={{
    width: 400,
    height: 400,
  }}
/>
```

### Handle Success
```tsx
<RotaptchaWidget
  onVerifySuccess={(result) => {
    console.log('Verified!');
    // Enable form submission
  }}
/>
```

## Troubleshooting

❌ **Component not rendering?**
- Check if Tailwind CSS is installed
- Verify API endpoints are correct

❌ **API errors?**
- Check network tab for failed requests
- Verify backend is returning correct format

❌ **Styles look wrong?**
- Ensure Tailwind CSS is configured
- Check for CSS conflicts

## Need Help?

- 📖 Read: `INTEGRATION_GUIDE.md`
- 📝 Examples: `INTEGRATION_EXAMPLES.tsx`  
- 🔗 GitHub: https://github.com/orgs/rotaptcha/repositories

---

**That's it!** Copy the component file, add it to your form, and you're done! 🚀
