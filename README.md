# SyncSpace 🚀

A modern, real-time web application for sharing ideas, discussing topics, and engaging with a vibrant community. Built with a powerful tech stack combining Next.js and Ruby on Rails.

## 👨‍💻 Author

**Daniel E. Londoño**
📧 daniel.esloh@gmail.com
🔗 [GitHub Profile](https://github.com/daniel-eslo)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Real-time Features](#real-time-features)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

SyncSpace is a full-stack social platform that combines the best of modern web technologies to deliver a seamless, real-time experience. Users can create posts, engage in discussions through nested comments, react to content, and receive instant notifications—all in a beautiful, responsive interface with dark mode support and internationalization.

## ✨ Features

### Core Functionality
- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Email confirmation via MailerSend
  - Password recovery flow
  - Secure password encryption with bcrypt

- 📝 **Posts Management**
  - Create, read, update, delete posts (CRUD)
  - Rich content with titles, descriptions, and images
  - Multiple tags per post with custom colors
  - Owner-only edit/delete permissions
  - Infinite scroll (10 posts per load)
  - Reaction counters (like, love, dislike)
  - Comment counters with last 3 preview

- 💬 **Comments System**
  - Nested comments (replies to replies)
  - Real-time updates via WebSocket
  - Full CRUD operations on own comments
  - Ascending order (newest first)

- ❤️ **Reactions**
  - Three types: like, love, dislike
  - Apply to both posts and comments
  - Toggle functionality (click again to remove)
  - Real-time counter updates

- 🔍 **Advanced Search**
  - Search by title, author (@username or @email), and tags
  - Combined filters support (e.g., "@daniel tag:tech title:ruby")
  - Optimized with PostgreSQL indices
  - Dynamic results updates

- 🏷️ **Tags & Categories**
  - Multiple tags per post
  - Custom colors for each tag
  - Tag autocomplete in forms
  - Filter posts by tag

- 🔔 **Real-time Notifications**
  - Notifications for:
    - Comments on your posts
    - Replies to your comments
    - Mentions (@username or @email)
    - Reactions on your content
  - Live badge counter
  - Instant delivery via ActionCable
  - Full notification history page

- ⚡ **Smart Real-time Updates**
  - Intelligent feed updates based on scroll position:
    - **Top of feed**: New posts auto-insert
    - **Scrolled down**: Banner notification "⚡ 3 nuevos posts disponibles" → click to load
  - Prevents jarring scroll disruptions

### UI/UX Features
- 🌓 **Dark/Light Mode**
  - Persistent theme preference
  - System preference sync
  - Smooth transitions

- 🌍 **Internationalization (i18n)**
  - Spanish (ES) and English (EN) support
  - Auto-detection from browser
  - Manual language switcher

- 📱 **Responsive Design**
  - Mobile-first approach
  - Beautiful UI with TailwindCSS + shadcn/ui
  - Accessible components

- 👤 **User Profiles**
  - Public profile pages
  - Edit profile (name, bio, picture)
  - User statistics (posts, reactions, comments)
  - "My Posts" dedicated section

## 🏗️ Architecture

SyncSpace follows a decoupled architecture with clear separation of concerns:

```
┌─────────────────┐         ┌─────────────────┐
│   Next.js App   │ ←────→  │  Rails API      │
│   (Frontend)    │  HTTP   │  (Backend)      │
│                 │  +JWT   │                 │
│                 │ ←────→  │  ActionCable    │
│                 │WebSocket│  (Real-time)    │
└─────────────────┘         └─────────────────┘
                                     │
                                     ↓
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │   (Database)    │
                            └─────────────────┘
```

### Communication Flow
1. **HTTP/REST**: CRUD operations with JWT authentication
2. **WebSocket**: Real-time updates via ActionCable
3. **Email**: Transactional emails via MailerSend

## 🛠️ Tech Stack

### Frontend (Client)
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **React 19** | UI library with modern features |
| **TypeScript** | Type-safe JavaScript |
| **TailwindCSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible component library |
| **Axios** | HTTP client with interceptors |
| **ActionCable Client** | WebSocket client for real-time |
| **next-intl** | Internationalization |
| **Jest + RTL** | Testing framework |

### Backend (Server)
| Technology | Purpose |
|------------|---------|
| **Ruby on Rails 8** | API-only mode |
| **PostgreSQL** | Relational database with JSONB |
| **JWT** | Stateless authentication |
| **bcrypt** | Password encryption |
| **ActionCable** | WebSocket server |
| **MailerSend** | Transactional email service |
| **rack-cors** | CORS management |
| **RSpec** | Testing framework |
| **Docker** | Containerization |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Redis** | ActionCable adapter (production) |
| **Cloudinary / AWS S3** | Image storage and CDN |
| **Vercel / Netlify** | Frontend hosting |
| **Render / Railway** | Backend hosting |
| **Neon / Supabase** | PostgreSQL hosting |

## 📁 Project Structure

```
SyncSpace/
├── client/                    # Next.js Frontend
│   ├── app/                   # App Router pages
│   │   ├── (auth)/           # Auth layout group
│   │   ├── (main)/           # Main layout group
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── posts/           # Post-related components
│   │   ├── comments/        # Comment components
│   │   └── layout/          # Layout components
│   ├── lib/                 # Utilities
│   │   ├── api.ts           # Axios instance
│   │   ├── auth.ts          # Auth helpers
│   │   └── websocket.ts     # ActionCable client
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React contexts
│   ├── types/               # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
│
├── server/                   # Rails API Backend
│   ├── app/
│   │   ├── models/          # ActiveRecord models
│   │   ├── controllers/     # API controllers
│   │   │   └── api/
│   │   │       └── v1/      # API v1 endpoints
│   │   ├── channels/        # ActionCable channels
│   │   ├── mailers/         # Email templates
│   │   ├── jobs/            # Background jobs
│   │   └── serializers/     # JSON serializers
│   ├── config/
│   │   ├── routes.rb        # API routes
│   │   ├── database.yml     # DB configuration
│   │   └── cable.yml        # ActionCable config
│   ├── db/
│   │   ├── migrate/         # Database migrations
│   │   └── seeds.rb         # Seed data
│   ├── spec/                # RSpec tests
│   └── Gemfile
│
├── docker/                   # Docker configuration
│   ├── Dockerfile           # Rails container
│   ├── docker-compose.yml   # Multi-container setup
│   └── .dockerignore
│
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   ├── SETUP.md             # Setup guide
│   └── DEPLOYMENT.md        # Deployment guide
│
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- **Ruby** 3.2+
- **Rails** 8.0+
- **Node.js** 20+
- **PostgreSQL** 15+
- **Redis** (for production)
- **Docker** (optional, for backend)

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
bundle install

# Setup database
rails db:create db:migrate db:seed

# Start Rails server
rails server -p 3001
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Docker Setup (Backend only)

```bash
# Navigate to docker directory
cd docker

# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec web rails db:migrate
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/api/v1/health

## 🔐 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/syncspace_development

# JWT
JWT_SECRET_KEY=your_super_secret_jwt_key_here

# MailerSend
MAILERSEND_API_TOKEN=your_mailersend_api_token
MAILERSEND_FROM_EMAIL=no-reply@yourdomain.com

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000

# Redis (production)
REDIS_URL=redis://localhost:6379/1

# Image Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.local)

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001/cable

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # Login (returns JWT)
GET    /api/v1/auth/confirm/:token    # Email confirmation
POST   /api/v1/auth/forgot_password   # Request password reset
POST   /api/v1/auth/reset_password    # Reset password with token
GET    /api/v1/auth/me                # Get current user
```

### Posts Endpoints

```
GET    /api/v1/posts                  # List posts (paginated)
GET    /api/v1/posts/:id              # Get single post
POST   /api/v1/posts                  # Create post (auth required)
PUT    /api/v1/posts/:id              # Update post (owner only)
DELETE /api/v1/posts/:id              # Delete post (owner only)
```

### Comments Endpoints

```
GET    /api/v1/posts/:post_id/comments         # List comments
POST   /api/v1/posts/:post_id/comments         # Create comment
PUT    /api/v1/comments/:id                    # Update comment
DELETE /api/v1/comments/:id                    # Delete comment
```

### Reactions Endpoints

```
POST   /api/v1/posts/:id/reactions             # Toggle post reaction
POST   /api/v1/comments/:id/reactions          # Toggle comment reaction
```

### Search & Tags

```
GET    /api/v1/search?q=query&user=@username&tag=tech&title=keyword
GET    /api/v1/tags                            # List all tags
GET    /api/v1/tags/:id/posts                  # Posts by tag
```

### Notifications

```
GET    /api/v1/notifications                   # List notifications
PUT    /api/v1/notifications/:id/mark_read     # Mark as read
PUT    /api/v1/notifications/mark_all_read     # Mark all read
```

### User Profile

```
GET    /api/v1/users/:id                       # Get user profile
PUT    /api/v1/users/:id                       # Update profile (self only)
GET    /api/v1/users/:id/posts                 # User's posts
```

See `docs/API.md` for detailed request/response examples.

## ⚡ Real-time Features

### ActionCable Channels

1. **PostsChannel**: Broadcasts new posts to all subscribers
2. **CommentsChannel**: Broadcasts new comments per post
3. **NotificationsChannel**: Personal channel for user notifications
4. **ReactionsChannel**: Broadcasts reaction updates

### WebSocket Connection

```typescript
// Frontend connection example
import { createConsumer } from '@rails/actioncable'

const cable = createConsumer(process.env.NEXT_PUBLIC_WS_URL)

const subscription = cable.subscriptions.create('PostsChannel', {
  received(data) {
    // Handle new post
  }
})
```

## 🔒 Security

- **Authentication**: JWT tokens with expiration
- **Authorization**: Owner-only edit/delete policies
- **CORS**: Restricted to authorized client domain
- **Input Sanitization**: XSS and SQL injection prevention
- **Password Encryption**: bcrypt with secure salting
- **Rate Limiting**: Rack::Attack for API protection
- **HTTPS**: Enforced in production
- **Environment Variables**: Sensitive data in .env files
- **CSRF**: Disabled (JWT handles security)

## 🧪 Testing

### Backend Tests (RSpec)

```bash
cd server

# Run all tests
bundle exec rspec

# Run with coverage
bundle exec rspec --format documentation

# Run specific test
bundle exec rspec spec/models/user_spec.rb
```

### Frontend Tests (Jest + RTL)

```bash
cd client

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## 🚀 Deployment

### Recommended Stack

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel / Netlify | Automatic deployments from Git |
| Backend | Render / Railway / Fly.io | Docker support, easy scaling |
| Database | Neon / Supabase / ElephantSQL | Managed PostgreSQL |
| Redis | Upstash / Redis Cloud | For ActionCable in production |
| Images | Cloudinary / AWS S3 | CDN + optimization |

### Quick Deploy

#### Frontend (Vercel)
```bash
cd client
vercel deploy --prod
```

#### Backend (Render)
1. Connect GitHub repository
2. Select `server` directory
3. Add environment variables
4. Deploy

See `docs/DEPLOYMENT.md` for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Backend**: Follow Ruby Style Guide (RuboCop)
- **Frontend**: ESLint + Prettier configuration
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by social platforms like Twitter, Reddit, and Dev.to
- Special thanks to the open-source community

---

**Made with ❤️ by Daniel E. Londoño**

For questions or support, please open an issue or contact daniel.esloh@gmail.com
