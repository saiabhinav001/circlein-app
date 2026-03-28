# 🔧 Troubleshooting Guide

## 🤖 CHATBOT ISSUES

### Issue 1: "AI service configuration error"

**Symptoms:**
- Error message appears instead of response
- Console shows: "GEMINI_API_KEY not configured"

**Solution:**
```bash
# 1. Check .env.local file exists
ls .env.local

# 2. Check API key is set
cat .env.local | grep GEMINI_API_KEY

# 3. Should see:
# GEMINI_API_KEY="AIzaSy..."

# 4. If missing, add it:
echo 'GEMINI_API_KEY="YOUR_API_KEY_HERE"' >> .env.local

# 5. Restart dev server
npm run dev
```

**Still not working?**
- Make sure API key has no quotes issues
- Verify API key is valid at Google AI Studio
- Check no extra spaces in .env.local

---

### Issue 2: Slow Responses (>5 seconds)

**Symptoms:**
- Chatbot takes forever to respond
- Loading indicator shows for long time

**Diagnosis:**
```javascript
// Open browser console (F12)
// Go to Network tab
// Filter: /api/chatbot
// Send a message
// Check "Time" column
```

**Solution:**

**If time > 10s:**
```bash
# Check internet connection
ping google.com

# Check Gemini API status
curl https://generativelanguage.googleapis.com/v1beta/models

# If API is down, wait or use email support
```

**If time 5-10s but should be faster:**
```typescript
// Verify model is correct in route.ts
model: 'gemini-1.5-flash-8b'  // ✓ Correct
model: 'gemini-pro'            // ✗ Too slow
```

---

### Issue 3: Generic Responses (Not Role-Aware)

**Symptoms:**
- Admin sees resident responses
- Responses don't mention role-specific features

**Diagnosis:**
```javascript
// In browser console when logged in:
console.log(session?.user?.role); // Should show 'admin' or 'resident'
```

**Solution:**
```bash
# 1. Verify user role in database/session
# 2. Check session is valid (not expired)
# 3. Try logging out and back in
# 4. Check contact/page.tsx sends userRole correctly:

userRole: session?.user?.role || 'resident'  // ✓ Correct
```

---

### Issue 4: "Unable to fetch response" Every Time

**Symptoms:**
- Every message fails
- No response ever appears

**Solution:**
```bash
# 1. Check API route is running
curl http://localhost:3000/api/chatbot/test

# 2. Check for TypeScript errors
npm run build

# 3. Check Next.js is running
ps aux | grep next

# 4. Restart everything
# Stop server (Ctrl+C)
# Clear cache
rm -rf .next
# Reinstall dependencies (if needed)
npm install
# Restart
npm run dev
```

---

### Issue 5: Timeout Errors

**Symptoms:**
- "Taking too long" message appears
- Request canceled

**Expected Behavior:**
- Backend timeout: 8 seconds
- Frontend timeout: 15 seconds

**If happening frequently:**
```typescript
// Increase timeouts temporarily in route.ts:
setTimeout(() => controller.abort(), 15000); // Was 8000

// And in contact/page.tsx:
setTimeout(() => controller.abort(), 30000); // Was 15000
```

**Better solution:**
- Check internet speed
- Verify Gemini API performance
- Consider upgrading to faster model (if budget allows)

---

## ❌ DELETE BUTTON ISSUES

### Issue 1: X Button Not Visible

**Symptoms:**
- No X button appears on notifications
- Only see notification content

**Diagnosis:**
```javascript
// Open browser console (F12)
// Inspect a notification
// Look for: <div class="delete-button-container">
// Should be present
```

**Solution:**
```bash
# 1. Clear browser cache
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# 2. Check DeleteButton is imported in NotificationSystem.tsx
import { DeleteButton } from './DeleteButton';

# 3. Verify file exists
ls components/notifications/DeleteButton.tsx

# 4. Restart dev server
npm run dev
```

---

### Issue 2: X Button Not Clickable

**Symptoms:**
- X button visible but clicking does nothing
- Or clicking opens notification instead

**Diagnosis:**
```javascript
// Click X button
// Check console for:
"🗑️ DELETE BUTTON CLICKED: <id>"

// If not showing, event isn't firing
```

**Solution:**

**Check 1: Z-Index**
```javascript
// Inspect X button in DevTools
// Computed styles should show:
z-index: 50
position: absolute

// If not, check CSS in NotificationSystem.tsx
```

**Check 2: Event Handling**
```typescript
// In DeleteButton.tsx, verify:
onClick={(e) => {
  e.stopPropagation(); // MUST be present
  e.preventDefault();
  onDelete();
}}
```

**Check 3: Pointer Events**
```css
/* Should NOT have */
pointer-events: none; // ✗ Wrong

/* Should have */
pointer-events: auto; // ✓ Correct
```

---

### Issue 3: Card Deletes When Clicking Anywhere

**Symptoms:**
- Clicking notification body deletes it
- Can't click notification normally

**Solution:**
```typescript
// In NotificationCard component, verify:
onClick={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest('.delete-button-container')) {
    return; // Don't handle card click
  }
  // Handle card click...
}}

// This MUST be present
```

---

### Issue 4: No Hover Effect on X Button

**Symptoms:**
- X button doesn't turn red on hover
- No visual feedback

**Solution:**
```typescript
// Check DeleteButton.tsx has:
const [isHovered, setIsHovered] = useState(false);

// And:
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}

// And styles:
backgroundColor: isHovered ? '#ef4444' : '#ffffff'
```

---

### Issue 5: Delete Works But No Animation

**Symptoms:**
- Notification deletes instantly (no fade)
- Jarring user experience

**Expected:**
- Should fade out over 200ms

**Solution:**
```css
/* Check CSS in NotificationSystem.tsx includes: */
.notification-card-wrapper {
  transition: opacity 200ms ease-out;
}
```

---

## 🔍 GENERAL DEBUGGING

### Console Errors

**"Module not found"**
```bash
npm install
npm run dev
```

**"Cannot read property 'role' of undefined"**
```typescript
// Check session exists
if (!session?.user?.role) {
  // Handle no session
}
```

**"Failed to fetch"**
```bash
# Check API route exists
ls app/api/chatbot/route.ts

# Check Next.js is running
curl http://localhost:3000
```

---

### Network Tab Debugging

**For Chatbot:**
1. Open DevTools (F12)
2. Network tab
3. Filter: `chatbot`
4. Send message
5. Check:
   - Status: Should be `200`
   - Response: Should have `{"response":"..."}`
   - Time: Should be < 3000ms

**For Delete:**
1. No network call (local state)
2. Should see React re-render in React DevTools
3. Check console for delete logs

---

### React DevTools

**Install:**
1. Chrome Web Store → React Developer Tools
2. Refresh page
3. Components tab shows component tree

**Check:**
```
NotificationProvider
  └─ notifications: Array[X] ← Should update when deleted
  └─ NotificationPanel
      └─ NotificationCard ← Should disappear when deleted
          └─ DeleteButton
```

---

## 🚨 EMERGENCY FIXES

### If Everything Breaks:

```bash
# 1. Stop server
# Press Ctrl+C

# 2. Delete build artifacts
rm -rf .next
rm -rf node_modules/.cache

# 3. Reinstall dependencies
npm install

# 4. Restart
npm run dev

# 5. Clear browser cache
Ctrl+Shift+R

# 6. Try again
```

---

### If Chatbot Still Broken After All Fixes:

**Temporary Fallback:**
1. Direct users to "Email Support" tab
2. Check Gemini API dashboard for quota/errors
3. Consider switching to backup model:

```typescript
// In route.ts, temporarily use:
model: 'gemini-1.5-flash' // Slightly slower but more stable
```

---

### If Delete Button Still Broken After All Fixes:

**Temporary Workaround:**
1. Use "Clear All" button instead
2. Check for CSS conflicts with other components
3. Try disabling other browser extensions

**Nuclear Option:**
```typescript
// In NotificationSystem.tsx, replace DeleteButton with simple button:
<button 
  onClick={(e) => {
    e.stopPropagation();
    removeNotification(notification.id);
  }}
  className="..."
>
  <X />
</button>
```

---

## 📞 Getting Help

### Before Asking for Help:

**Gather this info:**
1. Browser & version
2. Error messages (exact text)
3. Console logs
4. Network tab screenshot
5. Steps to reproduce

### Where to Ask:

1. **GitHub Issues** - For bugs
2. **Email Support** - For urgent issues
3. **Documentation** - Check all .md files first

---

## 🎓 Common Mistakes

### ❌ Mistake 1: Forgetting to Restart Server
**After changing .env.local or backend code:**
```bash
# Always restart:
npm run dev
```

### ❌ Mistake 2: Browser Cache
**After changing components:**
```bash
# Always hard refresh:
Ctrl+Shift+R
```

### ❌ Mistake 3: Wrong API Key
**Check you're using the right environment:**
```bash
# Development
.env.local

# Production
.env.production or Vercel dashboard
```

### ❌ Mistake 4: Session Expired
**If role-aware features stop working:**
```bash
# Log out and log back in
```

---

## ✅ Prevention Checklist

**Before deploying:**
- [ ] Test chatbot with admin account
- [ ] Test chatbot with resident account
- [ ] Test delete button on 5+ notifications
- [ ] Test on mobile screen size
- [ ] Check console for errors
- [ ] Test slow network (DevTools throttling)
- [ ] Test with expired session
- [ ] Verify environment variables

---

**Last Updated:** October 23, 2025
**Support:** Check other documentation first
**Emergency Contact:** Use Email Support in app
