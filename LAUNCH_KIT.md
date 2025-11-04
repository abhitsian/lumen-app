# 🚀 Lumen Launch Kit

## Quick Distribution Checklist

### Immediate Actions (Today)
- [ ] Upload DMG to file hosting (see options below)
- [ ] Update landing page with download link
- [ ] Post on LinkedIn (use templates below)
- [ ] Share on Twitter
- [ ] Optional: Product Hunt launch

### This Week
- [ ] Post on Reddit (r/macapps, r/productivity)
- [ ] Share on Hacker News
- [ ] Create demo video/screenshots
- [ ] Set up website (if you haven't)

---

## 📦 File Hosting Options

### Option 1: GitHub Releases (RECOMMENDED - Free, Fast, Reliable)
```bash
# Create a GitHub repo
gh repo create lumen-app --public

# Add your code
cd /Users/vaibhav/readtrack-mac
git init
git add .
git commit -m "Initial commit - Lumen v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lumen-app.git
git push -u origin main

# Create a release
gh release create v1.0.0 \
  ./release/Lumen-1.0.0-arm64.dmg \
  --title "Lumen v1.0.0 - Initial Release" \
  --notes "First public release of Lumen!"
```

**Download URL will be:**
`https://github.com/YOUR_USERNAME/lumen-app/releases/download/v1.0.0/Lumen-1.0.0-arm64.dmg`

### Option 2: Google Drive
1. Upload DMG to Google Drive
2. Right-click → Share → Get link
3. Change to "Anyone with the link can view"
4. Download URL: `https://drive.google.com/uc?export=download&id=FILE_ID`

### Option 3: Dropbox
1. Upload to Dropbox
2. Get shareable link
3. Replace `dl=0` with `dl=1` for direct download

### Option 4: Your Own Server
Upload to any web server, ensure:
- HTTPS enabled
- Direct download (not landing page)
- CORS headers if needed

---

## 💼 LinkedIn Posts (Choose Your Style)

### Post 1: Personal Story (Recommended for first post)

```
I'm excited to share something I've been building: Lumen 💡

As a Product Manager, I read 50+ articles every week across product management, AI, and tech. 
But I realized I was consuming without truly understanding my patterns.

So I built Lumen - an AI-powered reading companion that:

✨ Analyzes what you read and how you feel about it
🤖 Provides AI insights (100% local, $0 cost)
📊 Tracks patterns you'd never notice manually  
🔒 Runs entirely on your Mac - total privacy

The best part? It uses local AI (Ollama), so:
• No subscription fees
• No cloud dependencies  
• Complete privacy

If you're a knowledge worker drowning in content, Lumen might help you understand your learning patterns better.

Download (free, macOS): [YOUR_LINK]

Would love your feedback! 🙌

#ProductManagement #AI #Productivity #MacApp #OpenSource
```

### Post 2: Problem-Solution Format

```
Do you know which content makes you feel anxious vs. excited?

I didn't either - until I built Lumen 💡

Lumen is a Mac app that illuminates your reading journey with AI-powered insights.

🎯 What it does:
• Tracks articles you read
• Emotion tracking (Plutchik's Wheel)
• AI coach that writes weekly summaries
• Auto-organizes content into collections
• Shows productivity patterns

🔐 Privacy-first:
• 100% local AI (Ollama)
• No cloud sync
• No API costs
• You own your data

📊 Real insights:
"Work content makes you feel anticipation 65% of the time - 
you're genuinely excited about professional growth"

That's the kind of self-awareness Lumen provides.

Free download (Mac only): [YOUR_LINK]

Built for PMs, designers, engineers - anyone who reads a lot.

#AI #MacOS #Productivity #SelfImprovement
```

### Post 3: Technical/Developer Audience

```
Built a Mac app with local AI - no cloud, $0 forever 💡

Lumen: Personal AI reading coach that runs entirely on your Mac

🛠️ Tech stack:
• Electron + React + TypeScript
• Ollama for local LLM (llama3.2, mistral)
• 100% offline, privacy-first
• No subscriptions, no API keys

✨ Features:
• AI weekly summaries of reading patterns
• Emotion tracking + content correlation
• Smart collections with auto-rules
• Reading queue with priorities
• Deep analytics dashboard

🎨 Design inspiration:
• Linear (geometric, minimal)
• Superhuman (polished, premium)
• Cursor (AI-native)

The AI generates insights like:
"You've read 23 articles this week, with Work content triggering 
anticipation 65% of the time - clear professional excitement."

Everything runs locally - your data never leaves your Mac.

Download: [YOUR_LINK]
GitHub: [IF_YOU_MAKE_REPO_PUBLIC]

#MacOS #AI #Ollama #ElectronJS #OpenSource
```

### Post 4: Short & Punchy

```
Launched Lumen today 💡

Your personal AI reading coach that runs 100% locally on Mac.

→ Free forever
→ No cloud APIs
→ Total privacy  
→ Unlimited insights

Perfect for knowledge workers who read a lot and want to understand their patterns.

Download: [YOUR_LINK]

#Lumen #AI #Productivity
```

---

## 🐦 Twitter/X Posts

### Tweet 1 (Launch)
```
🚀 Launching Lumen - your personal AI reading coach

✨ 100% local AI (Ollama)
💰 $0 forever
🔒 Total privacy
📊 Deep insights

Built for knowledge workers who want to understand their reading patterns.

Download (Mac): [LINK]

#AI #MacOS #Productivity
```

### Tweet 2 (Feature highlight)
```
My AI reading coach just told me:

"Work content makes you feel anticipation 65% of the time - you're genuinely excited about professional growth, not obligated"

This is the self-awareness Lumen provides 💡

Runs 100% locally on Mac. Free.

[LINK]
```

### Tweet Thread Template
```
I built Lumen - AI-powered reading companion that runs 100% locally

Here's why it's different 🧵👇

1/ Traditional reading trackers just count pages
Lumen analyzes PATTERNS: what you read, when you feel what, and why

2/ Uses local AI (Ollama) - no cloud
• Zero API costs
• Complete privacy  
• Works offline
• You own your data

3/ Real AI insights:
"You read 23 articles this week, mostly Work content (65%). 
When reading Work, you feel anticipation - genuine excitement 
about professional growth."

4/ Features:
• Emotion tracking (Plutchik's Wheel)
• Smart auto-organizing collections  
• Reading queue with priorities
• Weekly AI summaries
• Pattern detection

5/ It's free. Forever.
No subscriptions, no trials, no cloud lock-in.

Download (Mac): [LINK]

Built for PMs, designers, engineers - anyone who reads a lot.

RT to help knowledge workers understand their learning patterns better 🙌
```

---

## 📝 User Installation Guide

Create this as a PDF or webpage:

```markdown
# Installing Lumen on macOS

## Step 1: Download
Download Lumen from: [YOUR_LINK]

## Step 2: Open DMG
1. Double-click the downloaded `Lumen-1.0.0-arm64.dmg` file
2. Drag Lumen icon to Applications folder

## Step 3: First Launch
1. Open Lumen from Applications folder
2. **You'll see a warning: "Lumen cannot be opened because it is from an unidentified developer"**

   This is normal for unsigned Mac apps. Here's how to open it:

   **Method 1: Right-click**
   - Right-click (or Control+click) on Lumen
   - Select "Open"
   - Click "Open" in the dialog

   **Method 2: System Settings**
   - Go to System Settings → Privacy & Security
   - Scroll down to see "Lumen was blocked..."
   - Click "Open Anyway"

3. Click "Open" when asked to confirm

## Step 4: Grant Permissions
Lumen will ask for permissions:
- ✅ **Accessibility** - To track your reading activity
- ✅ **Screen Recording** (optional) - For better tracking

## Step 5: Install AI (Optional)
For AI features:

```bash
# Install Ollama
brew install ollama

# Download AI model (4GB)
ollama pull llama3.2:3b

# Done! Open Lumen → Insights tab → Click "Generate AI Insights"
```

Skip this step if you only want algorithmic insights.

## Troubleshooting

**"Cannot open because developer cannot be verified"**
→ Use Method 1 or 2 above. This is standard for unsigned Mac apps.

**"Damaged and can't be opened"**
→ Run in Terminal: `xattr -cr /Applications/Lumen.app`

**AI features not working?**
→ Make sure Ollama is installed and running: `ollama serve`

**Still having issues?**
→ Reach out on LinkedIn or create an issue on GitHub

## Need Help?
Contact: Abhishek Sivaraman on LinkedIn or GitHub
```

---

## 🎨 Screenshot Guide

Take these screenshots for sharing:

### 1. App Icon
- macOS Dock showing Lumen icon
- Use for LinkedIn/Twitter profile sharing

### 2. Main Dashboard
- Timeline view with some articles
- Shows the clean UI

### 3. AI Insights
- The purple AI summary card
- Shows "Your AI Reading Coach" section

### 4. Emotion Wheel
- The interactive emotion tracker
- Visually striking

### 5. Collections
- Smart collections view
- Shows auto-organization

### Recommended Tool
Use macOS Screenshot (Cmd+Shift+4) or CleanShot X for best results

---

## 📊 Product Hunt Launch (Optional)

### When to Launch
- Thursday at 12:01 AM PST (best day)
- Prepare 1-2 weeks ahead
- Build email list first if possible

### What You Need
1. **Product Hunt account** (get upvotes from friends ready)
2. **Tagline** (60 chars): "Your personal AI reading coach - 100% local, $0 forever"
3. **Description** (260 chars): 
   "Lumen illuminates your reading journey with AI-powered insights. Track articles, emotions, and patterns - all analyzed by local AI running on your Mac. Zero cost, total privacy, unlimited insights."
4. **First comment** (explain your story, tech stack, why you built it)
5. **Screenshots** (5-8 images showing key features)
6. **Video/GIF** (optional but recommended)

---

## 🎯 Target Communities

### Reddit
- r/macapps (850K members)
- r/productivity (2.8M members)  
- r/ProductManagement (200K members)
- r/SideProject (200K members)

**Template:**
```
Title: [macOS] Lumen - AI reading coach that runs 100% locally ($0 forever)

Body:
Hey r/macapps! I built Lumen - a Mac app for knowledge workers.

What it does:
• AI-powered reading insights (using local Ollama)
• Emotion tracking + pattern detection
• Smart auto-organizing collections
• Reading queue with priorities

Why it's different:
• 100% local AI (no cloud, no APIs)
• Completely free (no catch)
• Privacy-first (your data never leaves your Mac)

Perfect for PMs, designers, engineers who read 10+ articles/week.

Download: [LINK]

Would love feedback from the community!
```

### Hacker News
```
Title: Lumen – AI-powered reading companion (runs 100% locally)

Link: [YOUR_WEBSITE or GITHUB]

First comment:
Hey HN! Creator here.

Built Lumen to solve a problem I had: reading tons of content 
but not understanding my patterns.

Tech:
• Electron + React/TS
• Ollama for local LLM
• 100% offline, privacy-first

AI generates insights like "Work content triggers anticipation 
65% of the time - genuine excitement about professional growth"

Free, no cloud, no subscriptions.

Happy to answer questions!
```

---

## 📈 Metrics to Track

- Downloads (from hosting stats)
- LinkedIn post engagement
- Website visits (if you set up analytics)
- GitHub stars (if public repo)
- Product Hunt upvotes
- User feedback/emails

---

## 🎁 Bonus: Email Signature

```
---
Abhishek Sivaraman
Product Manager

P.S. Check out Lumen - AI reading coach for Mac 💡
Download: https://github.com/abhitsian/lumen-app/releases/latest
```

---

## Next Steps RIGHT NOW:

1. **Upload DMG** → GitHub Releases (easiest)
2. **Get download link** → Update landing page
3. **Post on LinkedIn** → Use Post 1 template
4. **Share on Twitter** → Use tweet 1

Do these 4 things today, momentum is everything! 🚀
