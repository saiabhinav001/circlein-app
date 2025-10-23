# 🧪 Testing Guide - Chatbot & Delete Button

## Quick Test Checklist

### 🤖 **CHATBOT TESTING**

#### **Test 1: Basic Functionality**
1. Go to `/contact` page
2. Click "AI Chatbot" tab
3. Type: "How do I book an amenity?"
4. **Expected:** Fast response (< 3 seconds) with booking instructions
5. **Result:** ✅ PASS / ❌ FAIL

#### **Test 2: Admin-Specific Response**
**Prerequisites:** Login as ADMIN user

1. Ask: "How can I send an announcement?"
2. **Expected:** Response mentions admin features (manage amenities, send announcements)
3. **Should include:** Admin-specific guidance
4. **Result:** ✅ PASS / ❌ FAIL

#### **Test 3: Resident-Specific Response**
**Prerequisites:** Login as RESIDENT user

1. Ask: "How do I book the pool?"
2. **Expected:** Resident-focused response (My Bookings → Book Now)
3. **Should NOT mention:** Admin features
4. **Result:** ✅ PASS / ❌ FAIL

#### **Test 4: Conversation Context**
1. Ask: "What is CircleIn?"
2. Wait for response
3. Ask: "How do I use it?"
4. **Expected:** Response references previous conversation
5. **Result:** ✅ PASS / ❌ FAIL

#### **Test 5: Speed Test**
1. Ask any question
2. Start timer when you click Send
3. **Expected:** Response in < 3 seconds
4. **Result:** Time: _____ seconds | ✅ PASS / ❌ FAIL

#### **Test 6: Error Handling**
**Manual test - requires disabling API key:**

1. Temporarily remove `GEMINI_API_KEY` from `.env.local`
2. Restart dev server
3. Ask any question
4. **Expected:** User-friendly error message (not technical error)
5. **Expected:** Suggestion to use email support
6. **Result:** ✅ PASS / ❌ FAIL
7. **Important:** Re-add API key and restart server!

#### **Test 7: Multiple Messages**
1. Send 5 different questions in a row
2. **Expected:** All get responses
3. **Expected:** No "unable to fetch" errors
4. **Result:** ✅ PASS / ❌ FAIL

---

### ❌ **DELETE BUTTON TESTING**

#### **Test 1: Visual Verification**
1. Open notification bell (top-right)
2. Look at any notification
3. **Expected:** White circular X button in top-right of each card
4. **Expected:** Hover changes it to red with white X
5. **Result:** ✅ PASS / ❌ FAIL

#### **Test 2: Click Functionality**
1. Click the X button on any notification
2. **Expected:** Notification disappears immediately
3. **Expected:** Console shows: "🗑️ DELETE BUTTON CLICKED: [notification-id]"
4. **Result:** ✅ PASS / ❌ FAIL

#### **Test 3: Card Click vs Delete Click**
1. Click on the notification card body (NOT the X button)
2. **Expected:** Opens notification action/link
3. **Expected:** Does NOT delete the notification
4. Now click the X button
5. **Expected:** Deletes the notification
6. **Result:** ✅ PASS / ❌ FAIL

#### **Test 4: Multiple Rapid Clicks**
1. Rapidly click X button multiple times
2. **Expected:** Notification deletes only once
3. **Expected:** No errors in console
4. **Result:** ✅ PASS / ❌ FAIL

#### **Test 5: Mobile/Touch Test**
**If using touch device or dev tools mobile mode:**

1. Switch to mobile view (375px width)
2. Tap X button
3. **Expected:** Works same as desktop click
4. **Expected:** No accidental card clicks
5. **Result:** ✅ PASS / ❌ FAIL

#### **Test 6: Hover State**
1. Hover over X button (don't click)
2. **Expected:** Background turns red (#ef4444)
3. **Expected:** X icon turns white
4. **Expected:** Button scales slightly larger
5. Move mouse away
6. **Expected:** Returns to white background, gray X
7. **Result:** ✅ PASS / ❌ FAIL

#### **Test 7: All Notifications**
1. Open notifications panel
2. Delete 3-5 different notifications
3. **Expected:** Each deletes successfully
4. **Expected:** Remaining notifications don't shift unexpectedly
5. **Result:** ✅ PASS / ❌ FAIL

---

## 🐛 **Console Commands for Testing**

Open browser console (F12) and try these:

### Check if chatbot model is initialized:
```javascript
// This will show in Network tab when you send a message
// Look for POST to /api/chatbot
// Status should be 200
// Response time should be < 3000ms
```

### Monitor delete button clicks:
```javascript
// When you click delete, console should show:
// "🗑️ DELETE BUTTON CLICKED: <notification-id>"
```

---

## 📊 **Performance Benchmarks**

### Chatbot Response Times (should be):
- Simple question: **< 2 seconds**
- Complex question: **< 3 seconds**
- With conversation history: **< 4 seconds**
- Timeout limit: **8 seconds** (backend) / **15 seconds** (frontend)

### Delete Button:
- Click to deletion: **Instant** (< 100ms)
- Hover response: **Instant**
- Animation duration: **200ms**

---

## ✅ **Success Criteria**

### Chatbot:
- [ ] All 7 tests pass
- [ ] No "unable to fetch" errors
- [ ] Responses < 3 seconds average
- [ ] Role-aware responses (admin vs resident)
- [ ] Graceful error handling

### Delete Button:
- [ ] All 7 tests pass
- [ ] X button always clickable
- [ ] Card click doesn't delete
- [ ] Visual feedback works
- [ ] Mobile/touch compatible

---

## 🔧 **Troubleshooting**

### Chatbot Issues:

**"AI service configuration error"**
- Check `.env.local` has `GEMINI_API_KEY`
- Restart dev server: `npm run dev`

**Slow responses (> 5 seconds)**
- Check internet connection
- Check Gemini API status
- Look at Network tab for bottlenecks

**Generic responses (not role-aware)**
- Verify you're logged in
- Check session has `role` field
- Console should show userRole in request

### Delete Button Issues:

**X button not visible**
- Check notifications exist
- Inspect element (should see `.delete-button-container`)
- Check z-index is 50

**X button not clickable**
- Check console for errors
- Verify DeleteButton component is imported
- Clear browser cache

**Card deletes when clicking body**
- Report as bug with console logs
- Should NOT happen with current fix

---

## 📸 **Visual Reference**

### Chatbot - Expected UI:
```
┌─────────────────────────────────────┐
│  AI Assistant                   ⚙️  │
│  Ask me anything about CircleIn...  │
├─────────────────────────────────────┤
│                                     │
│  👤 How do I book an amenity?       │
│                                     │
│  🤖 Easy! Go to "My Bookings" →     │
│     "Book Now" → pick amenity...    │
│                                     │
│  [Type your message...]      [Send] │
└─────────────────────────────────────┘
```

### Notification with Delete Button:
```
┌─────────────────────────────────────┐
│ 🏊 Pool Booking Confirmed      ❌  │ ← X button here
│                                     │
│ Your pool booking is confirmed!     │
│ Time: 10:00 AM - 11:00 AM          │
│                                     │
│ [View Booking]                      │
└─────────────────────────────────────┘
```

---

## 🎯 **Final Verification**

Run ALL tests above and ensure:
1. **Chatbot:** Fast, reliable, role-aware responses
2. **Delete Button:** Always works, smooth animations
3. **No Console Errors:** Clean console log
4. **Mobile Compatible:** Works on all screen sizes

---

**Last Updated:** October 23, 2025
**Test Duration:** ~10 minutes for complete suite
**Pass Rate Expected:** 100% (14/14 tests)
