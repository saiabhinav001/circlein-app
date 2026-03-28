# 🏘️ CircleIn - Community Amenity Booking Platform

> A modern, secure, and performant community amenity booking system built with Next.js, Firebase, and TypeScript

[![Next.js](https://img.shields.io/badge/Next.js-13-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## ✨ Features

- 🔐 **Secure Authentication** - Google OAuth & email/password with NextAuth
- 🏊 **Amenity Booking System** - Real-time availability with calendar view
- 👥 **Multi-Tenant Architecture** - Isolated community data with role-based access
- 📱 **Fully Responsive** - Mobile-first design with Tailwind CSS
- 🔔 **Real-Time Notifications** - Instant updates for bookings and events
- 📊 **Admin Dashboard** - Complete management tools for community admins
- ⚡ **Optimized Performance** - Code splitting, SWC minification, image optimization
- 🔒 **Production Security** - Security headers, HTTPS, password validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase account with project created
- Google OAuth credentials configured
- Git installed

### Local Development

```powershell
# Clone repository
git clone https://github.com/YOUR_USERNAME/circlein-app.git
cd circlein-app

# Install dependencies
npm install
npm run dev
```

Visit `http://localhost:3000/bookings` to see the booking management system.

## 🔧 **Current Status**

### ✅ **Working Features:**
- Production-level QR code system with auto-popup
- Three-tier booking organization (Current/All/Past)
- Real-time booking updates with comprehensive logging
- Advanced booking actions (cancel, clear, complete, check-in)

# Set up environment variables (copy .env.example to .env.local and fill in values)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

**Required variables:**
- Firebase Configuration (6 variables)
- NextAuth Secret & URL
- Google OAuth Client ID & Secret

**Generate NextAuth Secret:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 📦 Production Deployment

### Deploy to Vercel

Complete step-by-step guide available in `GITHUB_AND_VERCEL_SETUP.md`

**Quick steps:**
1. Push code to GitHub repository
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important:** Update `NEXTAUTH_URL` and Google OAuth redirect URIs with your production URL.

See `DEPLOYMENT_GUIDE.md` for detailed Vercel deployment instructions.

## 🔒 Security Features

- ✅ **Authentication Security** - Password validation, authProvider separation
- ✅ **Role-Based Access Control** - Admin vs resident permissions
- ✅ **Multi-Tenant Data Isolation** - Community-specific data access
- ✅ **Firestore Security Rules** - Database-level permission enforcement
- ✅ **Security Headers** - HSTS, X-Content-Type-Options, X-Frame-Options
- ✅ **HTTPS Enforced** - Secure connections only
- ✅ **JWT Session Strategy** - Token-based authentication

## � Documentation

- **[GitHub & Vercel Setup](./docs/github-vercel-setup.md)** - Complete deployment guide
- **[Deployment Guide](./docs/deployment.md)** - Vercel deployment steps
- **[Firebase Setup](./docs/firebase-setup.md)** - Firebase configuration
- **[Database Schema](./docs/firestore-schema.md)** - Firestore structure
- **[Database Setup](./docs/database-setup.md)** - Initial data setup
- **[Multi-Tenancy](./docs/multi-tenancy.md)** - Community isolation

## 🛠️ Tech Stack

- **Framework:** Next.js 13.5.1 with App Router
- **Language:** TypeScript 5
- **Authentication:** NextAuth.js with Google OAuth
- **Database:** Firebase Firestore
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Animation:** Framer Motion
- **Icons:** Lucide React

## 📁 Project Structure

```
circlein-app/
├── app/                         # Next.js app router
│   ├── (app)/                   # Authenticated routes
│   │   ├── dashboard/           # Main dashboard
│   │   ├── amenity/             # Amenity management
│   │   ├── bookings/            # Booking system
│   │   ├── calendar/            # Calendar view
│   │   ├── notifications/       # Notifications
│   │   ├── profile/             # User profile
│   │   └── settings/            # Settings
│   ├── auth/                    # Authentication pages
│   └── api/                     # API routes
├── components/                  # React components
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components
│   ├── notifications/           # Notification system
│   └── providers/               # Context providers
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
│   ├── auth.ts                  # NextAuth configuration
│   ├── firebase.ts              # Firebase setup
│   └── utils.ts                 # Helper functions
├── firestore.rules              # Firestore security rules
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS config
└── tsconfig.json                # TypeScript config
```

## 🧪 Testing

```powershell
# Run development server
npm run dev

# Build for production
npm run build

# Test production build locally
npm start

# Lint code
npm run lint
```

## � Troubleshooting

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your deployment URL
- Check Google OAuth redirect URIs are configured
- Ensure `NEXTAUTH_SECRET` is set

### Firestore Permission Errors
- Deploy Firestore security rules from `firestore.rules`
- Verify user has `communityId` in session
- Check Firebase Console for rule errors

### Build Errors
- Run `npm run build` locally to test
- Check environment variables are set
- Review Vercel build logs

See `DEPLOYMENT_GUIDE.md` for comprehensive troubleshooting.

## 📈 Performance

- ⚡ **Fast Page Loads** - Code splitting and lazy loading
- 🖼️ **Optimized Images** - Next.js Image component with WebP
- 📦 **Minified Code** - SWC compiler for fast builds
- 🔄 **Efficient Updates** - React Server Components
- 💾 **Smart Caching** - Incremental Static Regeneration

## 🤝 Contributing

This is a private project. For issues or questions, please contact the repository owner.

## 📝 License

MIT License - See LICENSE file for details

## 📞 Support

For deployment help, see:
- `GITHUB_AND_VERCEL_SETUP.md` - Step-by-step deployment
- `DEPLOYMENT_GUIDE.md` - Vercel-specific instructions
- Vercel Documentation - https://vercel.com/docs
- Firebase Documentation - https://firebase.google.com/docs

---

**Built with ❤️ using Next.js, Firebase, and TypeScript**

🌟 **Star this repo if you find it useful!**
