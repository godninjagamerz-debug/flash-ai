# Requirements Document

## 1. Application Overview

### 1.1 Application Name
Flash AI Assistant

### 1.2 Application Description
An intelligent AI assistant web application featuring a minimalist curved liquid glass aesthetic, ultra-smooth response streaming, an interactive full-duplex live Voice Mode with multiple distinct human voice options, Claude-style Artifact cards with direct ready-to-open ZIP project exports, Pro-tier instant web deployment with custom sub-links, an extensible AI Plugin Ecosystem, an Audio-Visual generation suite, automated game building connectors (Roblox Studio, Minecraft, and standard game engines), device installation guides (PWA and PowerShell/terminal scripts), a centralized Media & Files Hub, a user Bug Reporting tool, and an owner administration suite with a Promo and Offer Engine.

## 2. User Scenarios

### 2.1 Target Users
- Web and desktop users seeking conversational AI with one-click Quick Login and hands-free conversational Live Voice Mode
- Pro plan developers needing instant ready-to-open ZIP archives and one-click customizable web sub-link hosting for generated code
- Game creators and developers building Roblox experiences, Minecraft mods/datapacks, and game scripts
- AI power users installing custom third-party plugins and extensions
- Creative professionals generating multimedia assets, video clips, and synchronized sound effects
- Application administrators managing bug reports, promotional campaigns, platform models, and subscriptions

### 2.2 Core Use Cases
- Engaging in hands-free, continuous conversational Live Voice Mode with natural human-sounding voice profiles across diverse vocal styles
- Receiving ultra-smooth continuous character and word interpolation streaming without flickering or visual layout jumps
- Generating complete code packages as ready-to-open ZIP files with automatically assigned, customizable sub-links (e.g., https://app-7r35kmgp19mp.appmedo.com/my-app) for Pro subscribers
- Installing and configuring custom AI plugins via manifest URLs, plugin directory, or API definitions
- Installing the web application locally through PWA installation or terminal/PowerShell command guidance
- Reporting bugs and platform issues directly through a dedicated feedback modal, which routes tickets directly to the Admin Panel
- Managing uploaded files, multimedia generations, and exported game code packages in the Media & Files Hub
- Redeeming promo codes, managing subscriptions, and resolving reported bugs from the Admin Panel

## 3. Page Structure and Functionality

### 3.1 Page Hierarchy
```
├── Entrance Loading Screen
├── Country Selection Screen
├── Authentication Pages
│   ├── Login Page (Quick Login Active; Social Connect marked 'Coming Soon')
│   └── Registration Page
├── Main Application
│   ├── Chat Interface
│   │   ├── Live Voice Mode Interface (ChatGPT-Style Interactive Voice Overlay)
│   │   ├── Artifacts Panel (Code, Documents, Ready-to-Open ZIP Exporters)
│   │   ├── Pro Instant Web Deployment & Sub-Link Customizer
│   │   ├── Game & Code Integration Bridge Panel (Roblox, Minecraft, Game Engines)
│   │   └── Voice Playback & Audio Controls
│   ├── Plugin Center (Plugin Store, Custom Plugin Adder & Manager)
│   ├── Media Generation Suite
│   │   ├── Image Generation Tab
│   │   └── Video & SFX Generation Tab
│   ├── Media & Files Hub
│   ├── App Install & Download Center (PWA & Terminal/PowerShell Guidance)
│   ├── Bug Report Modal & Feedback Center
│   ├── Settings Page (Social Connect marked 'Coming Soon', Voice Profile Settings)
│   └── Subscription & Promo Redemption Page
└── Admin Panel
    ├── Dashboard
    ├── Bug Report & Ticket Management
    ├── User Management
    ├── Promo & Offer Engine
    │   ├── Promo Code Generator & Manager
    │   ├── 1-Month Free Plan Grants
    │   └── Site-Wide Banner Manager
    ├── Plugin & Model Management
    └── Analytics & Release Control
```

### 3.2 Visual Design System
- **Minimalist Liquid Glass Aesthetic:** Simplified, clean translucent surfaces with subtle frosted backdrops, non-overlapping icon layouts with explicit spacing margins, and dynamic ambient background glows.
- **Rounded-3xl Geometry:** Consistent rounded-3xl corner radii across primary containers, modals, inputs, and cards.
- **Icon Layout Integrity:** Standardized icon containers with fixed bounding boxes and flex separation to prevent visual clipping or overlapping across all viewports.

### 3.3 Entrance Loading Screen & Country Selection
- **Entrance Loading Screen:** Minimalist splash with brand logo, smooth progress bar, and skip action.
- **Country Selection Screen:** Searchable country dropdown, auto-detection, and local currency mapping.

### 3.4 Authentication Pages
- **Quick Login (Active):** Instant guest/one-click login button fully enabled, allowing immediate guest session access without credential entry.
- **Registration Page:** Name, username, email, password fields, validation, and 6-digit OTP verification.
- **Login Page:**
  + Quick Login button (primary one-click entry)
  + Username/email and password login with remember-me toggle
  + Passwordless OTP and magic link email login
  + Social Connect options (Google, Apple, Discord) marked with a 'Coming Soon' badge and disabled interaction state
  + Forgot password flow with OTP verification

### 3.5 Main Chat Interface

#### 3.5.1 Header & Layout
- Minimalist frosted header with brand identity, new chat button, theme toggle, plan upgrade button, app install trigger, promo banner strip, and profile menu.
- Standardized spacing preventing navigation icon collisions.

#### 3.5.2 Chat Area & Ultra-Smooth Message Streaming
- **Message Feed:** Asymmetric rounded-3xl cards for user and AI messages.
- **Ultra-Smooth Text Delivery:** High-frequency progressive token buffering and sub-character easing animation that completely eliminates layout jumping, text popping, or abrupt step snapping during live response generation.
- **Message Controls:** Text-to-speech audio play/pause trigger, stop generation, regenerate, copy content, and edit prompt.

#### 3.5.3 Live Voice Mode & Human Voice Library
- **Live Voice Mode (ChatGPT-style):** Dedicated full-screen interactive voice overlay featuring dynamic fluid audio visualization, bidirectional real-time audio interaction, instant conversational turn-taking, and hands-free interruption detection.
- **Expanded Human Voice Library:** Multi-voice suite categorized by distinct vocal personalities and human characteristics, each featuring distinct natural human voice variants (male, female, non-binary, expressive, warm, crisp, calm, and dynamic tones).
- **Voice Controls & Modal:** In-chat voice selector dropdown, speed modifier (0.75x to 2.0x), voice sample preview, auto-play toggle, and direct switch to Live Voice Mode.

#### 3.5.4 Artifact Cards, Ready-to-Open ZIP Packaging & Pro Web Deployment
- **Artifact Detection:** Dedicated rounded-3xl side panel triggered when generating code, standalone documents, HTML/SVG previews, or multi-file projects.
- **Pro Plan Code Delivery & Instant Web Deployment:**
  + When Pro subscribers request or receive code, the system automatically packages the code into a complete ready-to-open `.zip` file rather than plain text blocks.
  + Pro users receive an auto-generated, customizable live preview web sub-link (e.g., `https://app-7r35kmgp19mp.appmedo.com/my-app`).
  + Sub-link management controls: rename slug, copy URL, launch live preview in new tab, and refresh deployment from updated code.
- **Standard Artifact Viewers:** Syntax-highlighted code viewer, HTML/SVG live rendering, Luau/Minecraft syntax viewers, and one-click file/ZIP downloading.

#### 3.5.5 Game & Code Integration Bridge
- **Roblox Studio Integration Bridge:** Luau client/server script generator, `.rbxmx` XML model files, and complete ready-to-import `.zip` packages.
- **Minecraft Integration Bridge:** `.mcfunction` generator, loot tables, recipes, and structured Minecraft-ready datapack ZIP archives.
- **General Game Engine Connectors:** Code templates and export connectors for Godot, Unity, and web game frameworks.
- **Import Guidance:** Step-by-step documentation for importing generated packages into target tools.

#### 3.5.6 Input Area & Controls
- Curved multi-line text input field with auto-expansion.
- AI model selector, effort level selector, active plugin badges, and Live Voice Mode launch button.
- Voice selection trigger with sample preview, voice-to-text microphone, bug report shortcut, and multi-file upload support.

#### 3.5.7 Chat History Sidebar
- Collapsible drawer with search filter, date-grouped conversation threads, rename, and delete actions.

### 3.6 Plugin Center & Custom Plugin Addition System
- **Plugin Directory:** Browse, activate, and deactivate official and community-built AI plugins.
- **Custom Plugin Addition (ChatGPT / DeepSeek Style):**
  + Add Plugin modal allowing users to install custom plugins by providing an OpenAPI/Swagger manifest URL or direct JSON specification.
  + Custom authentication header configuration (Bearer Token, API Key, Custom Headers).
  + Plugin validation tool checking endpoint reachability, parameter schemas, and tool definitions.
- **Active Plugin Bar:** In-chat selector to toggle individual installed plugins on or off during conversations.

### 3.7 App Install & Download Center
- **PWA Installation:** One-click Progressive Web App install prompt for compatible desktop and mobile browsers with install status indicator.
- **Terminal & PowerShell Install Guidance:**
  + PowerShell script command box with copy button for automated Windows package setup.
  + Terminal command guidance (cURL, Shell script) for macOS and Linux environments.
  + Step-by-step visual instructions for running installation scripts and launching local desktop shortcuts.

### 3.8 Bug Report Modal & Feedback Center
- **User Bug Report Form:** Accessible from sidebar, chat controls, and user settings.
- **Form Fields:** Issue title, category dropdown (UI/Streaming, Voice/Audio, Code/Deployment, Plugins, Billing/Account, Other), severity level, description text area, optional file/screenshot attachment, and system environment auto-tag.
- **Submission Confirmation:** Confirmation dialog with generated Ticket ID and status tracker.

### 3.9 Media Generation Suite
- **Image Generation:** Prompt bar, aspect ratio selector, style presets, and 1 to 4 quantity generator with zoom preview and direct download.
- **Video & Sound Effects (SFX) Generation:** Motion text prompt, camera motion selector, duration control (3s to 10s), synchronized sound effect generation, audio track isolation, and video playback with full controls.

### 3.10 Media & Files Hub
- **Centralized Repository:** Manage user-created and uploaded assets.
- **Tab Navigation:**
  + Uploaded Files (documents, images, sheets)
  + Generated Media (images, videos, sound effects)
  + Code & Deployed Projects (exported `.zip` archives, custom sub-links, Roblox/Minecraft packages)
- **Actions:** Asset preview, direct link sharing, sub-link management, download, and asset deletion.

### 3.11 Settings & Promo Redemption Page
- **Account & Security:** Active sessions, password change, and account deletion.
- **Voice & Audio Settings:** Default human voice selection, Live Voice Mode auto-trigger, and speech rate modifier.
- **Connected Accounts:** Social Connect integrations (Google, Apple, Discord) displayed with 'Coming Soon' badges.
- **Installed Plugins:** Manage custom-added plugin manifests and API keys.
- **App Installation Status:** Check PWA and desktop runner installation state.
- **Subscription & Promo Redemption:** Active plan details, promo code redemption input, Pro sub-link quota display, and billing management.

### 3.12 Admin Panel

#### 3.12.1 Dashboard & Analytics
- Platform metrics for active users, streaming latency, multimedia generations, game exports, active Pro custom sub-links, and revenue.

#### 3.12.2 Bug Report & Ticket Management
- **Bug Ticket Directory:** Centralized list of all user-submitted bug reports.
- **Ticket Details:** Ticket ID, user email, category, severity, description, attached files, environment details, and timestamp.
- **Ticket Actions:** Status updater (New, Under Investigation, Resolved, Closed), admin internal notes, and direct reply notification.

#### 3.12.3 Promo & Offer Engine
- **Promo Code Manager:** Generate and manage promo codes with discount rates, validity windows, and usage caps.
- **1-Month Free Plan Grants:** Grant 1-month free subscription access (Plus or Pro) to specific user accounts.
- **Banner Manager:** Create, schedule, and toggle site-wide announcement banners.

#### 3.12.4 User & System Management
- User directory, plan modification, global plugin moderation, and audit logs.

## 4. Business Rules and Logic

### 4.1 Live Voice Mode & Voice Profile Rules
- **Live Voice Interaction:** Live Voice Mode operates with duplex audio streaming, allowing users to interrupt the AI response by speaking at any point.
- **Voice Profile Persistence:** Selected voice styles and specific human voice variants persist across all sessions and apply to both Live Voice Mode and standard message playback.

### 4.2 Pro Plan Code Delivery & Sub-Link Deployment Rules
- **Pro Tier Packaging:** For authenticated Pro subscribers, code outputs are automatically packaged into a downloadable `.zip` archive rather than displaying raw code blocks.
- **Custom Sub-Link Generation:** Each Pro code generation generates a unique sub-link following the format `https://app-7r35kmgp19mp.appmedo.com/{custom-slug}`.
- **Sub-Link Customization:** Pro users can edit the sub-link slug; uniqueness is validated across the platform.
- **Free/Plus Tier Behavior:** Free and Plus tier users receive standard syntax-highlighted code viewers with standard download options.

### 4.3 Plugin System Rules
- **Plugin Manifest Specification:** Custom plugins must conform to standard JSON schema manifests specifying available tool calls and target endpoint URLs.
- **Sandbox Execution:** Custom plugin calls are routed through secure proxy workers, preventing direct browser cross-origin leaks.

### 4.4 App Install & Guidance Rules
- **PWA Prompting:** PWA install banner is triggered on supported browsers when the web app is not running in standalone mode.
- **Script Security:** PowerShell and terminal commands provided in guidance boxes are strictly read-only copyable snippets pointing to verified application repository installation scripts.

### 4.5 Bug Report Lifecycle Rules
- **Submission & Routing:** Submitting a bug report instantly stores the ticket in the backend database and makes it visible in the Admin Panel Bug Management table.
- **Ticket Status Flow:** New -> In Progress -> Resolved -> Closed.

### 4.6 Ultra-Smooth Streaming Rules
- **Progressive Interpolation:** The client renders tokens using continuous sub-frame character interpolation to prevent visual line jumping or sudden snapping during streaming.

### 4.7 Layout & Icon Spacing Rules
- **Icon Separation:** All toolbars, headers, and floating action bars enforce explicit container margins and auto-wrapping to eliminate overlapping icons across all screen resolutions.

## 5. Exception and Boundary Handling

| Scenario | Handling |
|---|---|
| User clicks Social Connect | Display toast notification that Social Connect is 'Coming Soon' and guide user to Quick Login or standard login |
| Live Voice microphone permission denied | Display visual warning modal guiding user to enable microphone permissions in browser settings |
| Audio synthesis stream fails | Fall back to standard silent text rendering and show an inline audio retry icon |
| Pro sub-link slug already taken | Display inline validation error requesting a unique slug name |
| Custom plugin manifest invalid or unreachable | Highlight specific JSON validation/connection errors in the Add Plugin modal |
| PWA install rejected by user | Dismiss install prompt and retain manual install button in App Install Center |
| PowerShell/Terminal command execution error | Provide troubleshooting instructions and direct PWA web fallback link |
| Bug report submission without required fields | Highlight missing required inputs (Title, Category, Description) with inline validation |
| ZIP archive creation fails | Provide individual file download links and display a retry button for archive generation |
| Invalid or expired promo code | Display specific inline error message (Expired, Exhausted, or Invalid) |
| Video/SFX rendering failure | Terminate task, refund user credits immediately, and show retry trigger |

## 6. Acceptance Criteria

1. Quick Login button on the Login Page allows immediate one-click guest authentication.
2. Social Connect buttons (Google, Apple, Discord) are clearly marked 'Coming Soon' and remain non-interactive.
3. AI text responses stream with progressive sub-character easing animation without layout jumping or text snapping.
4. Live Voice Mode supports interactive bidirectional audio conversation with hands-free interruption.
5. Users can choose among multiple distinct human voice variants across different vocal styles with persistent preferences.
6. Pro plan users receiving code outputs are automatically provided with a ready-to-open ZIP package and a functional custom web sub-link.
7. Users can add custom plugins by submitting valid manifest URLs or JSON definitions in the Plugin Center.
8. The App Install Center displays functional PWA installation triggers alongside copyable PowerShell and terminal setup commands.
9. Users can submit bug reports with category and description, and submitted tickets immediately appear in the Admin Panel Bug Report Management view.
10. All navigation bars, headers, and action panels display icons with fixed spacing and no visual overlapping.
11. Game Integration Bridge produces valid Roblox Luau scripts/.rbxmx models and Minecraft datapacks with clear import guidance.
12. Media generation suite generates images, videos, and synchronized sound effects with independent playback and export controls.
13. Administrators can generate promo codes, grant 1-month free access, and review/update bug report ticket statuses from the Admin Panel.

## 7. Features Not Implemented in This Release

- Active third-party social OAuth logins (marked as Coming Soon)
- Direct OS-level memory injection into running game client executables
- Real-time multi-user collaborative chat editing
- Native compiled desktop installer binaries (.exe/.dmg) outside PWA and terminal installation scripts