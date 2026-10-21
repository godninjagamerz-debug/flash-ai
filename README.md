# Welcome to Your Miaoda Project

## Project Info

## Project Directory

```
├── README.md # Documentation
├── components.json # Component library configuration
├── eslint.config.js # ESLint configuration
├── index.html # Entry file
├── package.json # Package management
├── postcss.config.js # PostCSS configuration
├── public # Static resources directory
│   ├── favicon.png # Icon
│   └── images # Image resources
├── src # Source code directory
│   ├── App.tsx # Entry file
│   ├── components # Components directory
│   ├── context # Context directory
│   ├── db # Database configuration directory
│   ├── hooks # Common hooks directory
│   ├── index.css # Global styles
│   ├── layout # Layout directory
│   ├── lib # Utility library directory
│   ├── main.tsx # Entry file
│   ├── routes.tsx # Routing configuration
│   ├── pages # Pages directory
│   ├── services # Database interaction directory
│   ├── types # Type definitions directory
├── tsconfig.app.json # TypeScript frontend configuration file
├── tsconfig.json # TypeScript configuration file
├── tsconfig.node.json # TypeScript Node.js configuration file
└── vite.config.ts # Vite configuration file
```

## Tech Stack

Vite, TypeScript, React, Supabase

## Development Guidelines

### How to edit code locally?

You can choose [VSCode](https://code.visualstudio.com/Download) or any IDE you prefer. The only requirement is to have Node.js and npm installed.

### Environment Requirements

```
# Node.js ≥ 20
# npm ≥ 10
Example:
# node -v   # v20.18.3
# npm -v    # 10.8.2
```

### Installing Node.js on Windows

```
# Step 1: Visit the Node.js official website: https://nodejs.org/, click download. The website will automatically suggest a suitable version (32-bit or 64-bit) for your system.
# Step 2: Run the installer: Double-click the downloaded installer to run it.
# Step 3: Complete the installation: Follow the installation wizard to complete the process.
# Step 4: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### Installing Node.js on macOS

```
# Step 1: Using Homebrew (Recommended method): Open Terminal. Type the command `brew install node` and press Enter. If Homebrew is not installed, you need to install it first by running the following command in Terminal:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Alternatively, use the official installer: Visit the Node.js official website. Download the macOS .pkg installer. Open the downloaded .pkg file and follow the prompts to complete the installation.
# Step 2: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### After installation, follow these steps:

```
# Step 1: Download the code package
# Step 2: Extract the code package
# Step 3: Open the code package with your IDE and navigate into the code directory
# Step 4: In the IDE terminal, install dependencies: corepack pnpm install
# Step 5: Put VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a root-level .env.local
# Step 6: Start the app: corepack pnpm dev
```

The Supabase project must also have its migrations applied. For account-action email, deploy the `account-action` Edge Function and configure `RESEND_API_KEY` plus `ACCOUNT_EMAIL_FROM` as Supabase function secrets. The sender address must be verified with Resend.

### Supabase Auth Verification Email

For hosted signup codes, configure **Supabase Dashboard → Authentication → SMTP Settings** with a custom SMTP provider. With Resend, verify a domain you own, then use host `smtp.resend.com`, port `465` (SSL) or `587` (STARTTLS), username `resend`, and a Resend API key as the SMTP password. Set the sender name to `Flash AI - GShah Development` and the sender address to a mailbox on that verified domain, such as `no-reply@auth.your-domain.com`. Do not use a Proton/Gmail address as the sender unless that domain is yours and verified with the provider.

In **Authentication → Email Templates → Confirm signup**, use `{{ .Token }}` in the message body to send the six-digit code expected by the app (not only `{{ .ConfirmationURL }}`). Set the subject to `Your Flash AI verification code`. Set **Authentication → URL Configuration → Site URL** to the deployed app URL and add `http://localhost:5173` to the redirect allow list for development.

The Flash AI mark is served at `/flash-ai-mark.svg` after deployment. Email clients vary in SVG support; for maximum compatibility, host a PNG copy on the same public domain and reference that URL in the email template.

### Production Administrator Bootstrap

Public signups always create Free user accounts. After the project owner creates and verifies their account, promote only that account from the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin', plan = 'business', upload_limit_mb = 1024
WHERE email = lower('OWNER_EMAIL')
RETURNING id, email, role, plan;
```

Replace `OWNER_EMAIL` with the owner's verified email. Confirm the returned row is the intended owner. No shared or default admin password is created by migrations.

### How to develop backend services?

Configure environment variables and install relevant dependencies.If you need to use a database, please use the official version of Supabase.

## Learn More

You can also check the help documentation: Download and Building the app（ [https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en](https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en)）to learn more detailed content.
