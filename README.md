# O'Malley Drilling Reports - Update README

**Date:** November 3, 2025  
**Version:** 2.2 - Google Drive Integration Complete

---

## 📦 YOUR 3 FILES

1. **index-report.html** (185 KB) - Driller field app
2. **index-dashboard.html** (86 KB) - Management dashboard  
3. **README.md** (this file) - What's new and how to use

---

## ✨ WHAT'S NEW

### **Google Drive Integration - Fully Automatic**

#### **Driller App:**
- ✅ **Automatic upload to Google Drive** when you submit reports
- ✅ **No more manual downloads** - just click Submit!
- ✅ **Confirmation dialog** - "Ready to submit?" prevents mistakes
- ✅ **Sign-in button** that actually works
- ✅ **Loading states** - Shows "Loading..." while connecting

#### **Dashboard:**
- ✅ **Automatic sync from Google Drive** when you sign in
- ✅ **No more manual imports** - reports load automatically!
- ✅ **Exact start/stop times** displayed in report view
- ✅ **QuickBooks Desktop export** - Optimized format with separate line items
- ✅ **Manual import backup** - Still available if needed

#### **Both Apps:**
- ✅ **Fixed button sizing** on mobile (New/Delete project buttons)
- ✅ **Optimized print layout** - Everything fits better on one page
- ✅ **Professional app icons** - Green themed for home screen
- ✅ **Better error messages** - Know what's happening

---

## 🚀 HOW TO DEPLOY TO GITHUB

### **Step 1: Upload Driller App**
1. Go to: https://github.com/9omallec/Drillers-Report/tree/main/report
2. Click on `index.html`
3. Click the pencil icon (✏️ Edit this file)
4. Select All (Ctrl+A or Cmd+A) → Delete
5. Open `index-report.html` in a text editor → Copy All → Paste
6. Scroll down → Commit message: "Update driller app with Google Drive"
7. Click "Commit changes"

### **Step 2: Upload Dashboard**
1. Go to: https://github.com/9omallec/Drillers-Report/tree/main/dashboard
2. Click on `index.html`
3. Click the pencil icon (✏️ Edit this file)
4. Select All (Ctrl+A or Cmd+A) → Delete
5. Open `index-dashboard.html` in a text editor → Copy All → Paste
6. Scroll down → Commit message: "Update dashboard with Google Drive"
7. Click "Commit changes"

### **Step 3: Wait & Test**
1. Wait 2-3 minutes for GitHub Pages to deploy
2. Clear browser cache (Ctrl+Shift+Delete) or use Incognito mode
3. Test driller app: https://9omallec.github.io/Drillers-Report/report/
4. Test dashboard: https://9omallec.github.io/Drillers-Report/dashboard/

---

## 🎯 HOW TO USE

### **DRILLER APP (For Field Workers)**

#### **First Time Setup (One Time):**
1. Open: https://9omallec.github.io/Drillers-Report/report/
2. Wait for button to change from "⏳ Loading..." to "📁 Sign in to Drive" (green)
3. Click "📁 Sign in to Drive"
4. Sign in with your Google account
5. Allow Google Drive permissions
6. Button changes to "✓ Drive Connected"
7. Bookmark the page or add to home screen

#### **Daily Use (Every Time):**
1. Open the bookmarked app
2. Fill out your report (all fields)
3. Click "📤 Submit Report"
4. Confirmation popup: "📤 Ready to submit your report?" → Click "OK"
5. **Report uploads automatically to Google Drive!**
6. Success message: "✅ Report Submitted Successfully!"
7. Done! No files download, no manual uploading needed!

---

### **DASHBOARD (For Management)**

#### **First Time Setup (One Time):**
1. Open: https://9omallec.github.io/Drillers-Report/dashboard/
2. Wait for button to change from "⏳ Loading..." to "🔐 Sign in to Drive" (green)
3. Click "🔐 Sign in to Drive"
4. Sign in with your Google account
5. Allow Google Drive permissions
6. **Reports automatically sync from Drive!**
7. Status shows: "✓ Imported X report(s) from Drive!"
8. Button changes to "♻️ Sync from Drive"
9. Bookmark the page

#### **Daily Use (Every Time):**
1. Open the bookmarked dashboard
2. Click "♻️ Sync from Drive" to load new reports
3. Reports appear in table automatically
4. Click 👁️ (eye icon) to view full report
   - **NEW:** See exact start/stop/arrived times in blue section
5. Click "Approve" or "Request Changes"
6. Select approved reports (checkboxes)
7. Click "💰 Export to QuickBooks" for billing
8. Done!

---

## 🔐 IMPORTANT: Add Team Members as Test Users

**You must do this for people to sign in!**

1. Go to: https://console.cloud.google.com
2. Select project: "OmalleyDrillingReports"
3. Left sidebar → "APIs & Services" → "OAuth consent screen"
4. Scroll to "Test users" section
5. Click "ADD USERS"
6. Enter email addresses (one per line):
   - Your email
   - All drillers' emails
   - All managers' emails
7. Click "SAVE"

**Everyone must be on this list to use the apps!**

---

## 🆘 TROUBLESHOOTING

### **"Sign in button does nothing"**
1. Wait for button to turn green (from gray "Loading...")
2. Check browser console (F12) for errors
3. Make sure pop-ups aren't blocked
4. Try different browser (Chrome recommended)

### **"This app isn't verified" warning**
This is normal! It's YOUR app in testing mode.
1. Click "Advanced"
2. Click "Go to O'Malley Drilling Reports (unsafe)"
3. It's safe - it's your company's app!

### **"Can't sign in"**
1. Make sure user's email is in test users list
2. Go to Google Cloud Console → OAuth consent screen → Test users
3. Add their email
4. Try signing in again

### **"White page" or "Nothing loads"**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private mode
3. Check browser console (F12) for errors
4. Try different browser

### **"Upload/Sync doesn't work"**
1. Check internet connection
2. Make sure you're signed in (see "Drive Connected" or "Sync" button)
3. Try signing out and back in
4. Check Google Drive folder permissions
5. Verify folder ID is correct in Google Cloud Console

---

## 🔍 DEBUGGING (For Technical Issues)

### **Open Browser Console (Press F12):**

When apps load successfully, you'll see:
```
Loading gapi client...
Initializing gapi client...
gapi initialized successfully
Google Drive ready!
```

When signing in:
```
Attempting sign in...
Sign in successful!
```

When there's an error:
```
Error initializing Google Drive: [error details]
```

**Take screenshots of console errors if asking for help!**

---

## 💰 QUICKBOOKS DESKTOP EXPORT (NEW FORMAT)

When you export to QuickBooks, you get a CSV with:
- **Separate line items** for Drive Time, On-Site Time, Standby Time, Footage
- **Service Item** column for easy mapping
- **Employee** field showing who did the work
- **Detailed notes** with metrics

**To import:**
1. QuickBooks Desktop → File → Utilities → Import → Excel Files
2. Select the downloaded CSV
3. Map columns as needed
4. Import and create invoices

---

## 📱 MOBILE: ADD TO HOME SCREEN

Make it feel like a native app!

**iPhone/iPad:**
1. Open the app in Safari
2. Tap Share button (square with arrow)
3. Scroll down → Tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen with green drill/checklist icon

**Android:**
1. Open the app in Chrome
2. Tap menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"
5. App icon appears on home screen

---

## 🎉 YOU'RE ALL SET!

### **Next Steps:**
1. ✅ Upload files to GitHub
2. ✅ Wait 2 minutes for deployment
3. ✅ Test both apps
4. ✅ Add team members as test users
5. ✅ Train your team (5 minutes each)
6. ✅ Start using automatic workflow!

---

**Enjoy your automated drill report system!** 🚀

**Version:** 2.2 | November 3, 2025 | Ready for Production ✅
