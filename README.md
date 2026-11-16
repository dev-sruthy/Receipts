# receipts. — Keep your word to yourself.

A responsive, interactive web application built directly from the [Receipts Figma Design](https://www.figma.com/design/WYKT1tB1G8vSn8Jbj6vk71/Receipts?node-id=0-1) and lo-fi product wireframes.

## 🌟 Highlights & Features

- **Pixel-Perfect Visual Fidelity**:
  - Matches **Desktop - 1** (Dark Theme `#1a1a1a`) and **Desktop - 2** (Light Theme `#f6f3e7`).
  - Google Fonts: **Fraunces** (display serif with WONK variation), **Alegreya** (editorial serif), **Outfit** (clean geometric sans for calendar dates), **Bellota** (bold legend font), and **Space Mono** (monospaced thermal receipt typeface).
  - High-fidelity **Thermal Receipt Slip** with 8 cutout punch holes along the top and a serrated sawtooth tear-off edge at the bottom.

- **LOSS & WIN Authentic Rubber Stamp**:
  - When all work in the daily receipt is not done, settling stamps the receipt with a bold vintage **LOSS** rubber stamp (and marks the calendar day with the red outline circle).
  - When all commitments on the receipt are finished, settling stamps the receipt with a crisp **WIN** rubber stamp (and marks the calendar day with a solid circle).
  - Includes satisfying tactile stamp impact animation (`stampImpact`) with angled tilt and ink borders.
  - Ability to **Reopen Day** at any time to revise commitments or re-settle.

- **Multi-Day Goal Propagation (Set Goals)**:
  - In **Set Goals**, choose between:
    - **Few Days**: specify any number of days $N$ (quick chips for 3, 5, 7, 14, 21, 30 days or custom number).
    - **Monthly**: automatically schedules the goal across every day for the rest of the month.
    - **Yearly**: schedules the goal across daily receipts for the rest of the year.
  - The goal automatically lands on the daily receipts across all those $N$ consecutive days in the dashboard.
  - Live preview column shows how the goal appears on the receipt and displays the exact date range.

- **Interactive Calendar with Month & Year Picker**:
  - Exact 4 states and colors from Figma Desktop - 1 & Desktop - 2:
    - **Today**: Solid red circle (`#e54d42`).
    - **Loss**: Red stroke outline circle (`#e54d42`).
    - **Win**: Solid circle (cream in Dark mode, dark in Light mode).
    - **Still Ahead**: Scalloped rosette circle badge for upcoming days.
  - Interactive legend footer with all 4 states in Bellota typography.
  - Right-click any day to cycle through states: Win → Loss → Still Ahead → Today.
  - Click on any day to open that day's individual receipt checklist.
  - Month/Year picker popover to jump to any month or year.

- **Dynamic Month Target Headline**:
  - Subtitle under "Keep your word to yourself." shows the exact number of days left in the month to achieve the goal:
    `November: 14 more days to make a win` (or `October: 1 more day to make a win`).
  - "Set Goals" pill button designed with stroke only (transparent fill) matching Figma.

- **Brain Dump (Journal View)**:
  - Lined paper notebook slip for stream-of-consciousness reflection.
  - Quick thought chips (💭 Energy, ⚡ Challenge, 🎯 Tomorrow).
  - Prominent "Save Reflection" button and past reflection drawer.

- **Authentication Gate**:
  - Login & sign-up view with "Continue as Guest" quick access before entering the dashboard.

- **Thermal Receipt Barcode & Settle Inside Receipt**:
  - Restored barcode stamp with date stamp `#REC-YYYYMMDD`.
  - "Settle today" button placed conveniently inside the receipt slip.
  - Starts clean with helpful placeholder examples for new days.

- **Theme Toggle**:
  - Seamless Dark Theme (Figma Desktop - 1) and Light Theme (Figma Desktop - 2) toggle with local storage persistence.

## 🚀 How to Run Locally

1. Open `index.html` in any browser:
   ```bash
   open /Users/sruthysuresh/.gemini/antigravity/scratch/receipts-app/index.html
   ```
2. Or run the local static server:
   ```bash
   cd /Users/sruthysuresh/.gemini/antigravity/scratch/receipts-app
   python3 -m http.server 8089
   ```
   Then visit `http://localhost:8089` in your browser.
