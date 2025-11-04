# SyncSpace

A real-time social platform for sharing ideas and connecting with others. Built with Next.js 15, Ruby on Rails 8, and PostgreSQL.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Test Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Rails](https://img.shields.io/badge/Rails-8.0-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)

## Features

### Core Functionality
- **User Authentication** - JWT-based authentication with refresh tokens, email confirmation, and password recovery
- **Posts** - Create, edit, delete posts with images and tags
- **Comments** - Nested comments system with unlimited depth
- **Reactions** - Like, love, and dislike posts and comments
- **Tags** - Organize content with custom-colored tags
- **Search** - Advanced search with PostgreSQL full-text search and GIN indexes
- **Notifications** - Real-time notifications for interactions
- **Real-time Updates** - WebSocket connections via ActionCable

### Advanced Features
- **Internationalization** - Full support for English and Spanish
- **Dark Mode** - System-aware theme with manual toggle
- **Rate Limiting** - Protection against brute force and abuse
- **Input Sanitization** - XSS protection on all user-generated content
- **User Preferences** - Persistent theme and language settings
- **Counter Caching** - Optimized performance for counts and statistics

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context API
- **Real-time**: ActionCable WebSocket client
- **Internationalization**: next-intl
- **Theme**: next-themes
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: Ruby on Rails 8.0 (API-only)
- **Language**: Ruby 3.4.5
- **Database**: PostgreSQL 17
- **Authentication**: JWT with bcrypt
- **Real-time**: ActionCable (WebSocket)
- **Email**: MailerSend
- **Rate Limiting**: Rack::Attack
- **Testing**: RSpec (92% coverage)
- **Code Quality**: SimpleCov

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Cache**: Redis
- **Database Extensions**: pg_trgm (trigram search)

## Quick Start

### Prerequisites
- Ruby 3.4.5
- Node.js 18+
- PostgreSQL 17
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd SyncSpace
```

#### 2. Backend Setup
```bash
cd server

# Install dependencies
bundle install

# Setup database
rails db:create db:migrate db:seed

# Start Redis (if not using Docker)
redis-server

# Start Rails server
rails server
```

The backend will be available at `http://localhost:8000`

#### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

#### 4. Using Docker (Alternative)
```bash
# Start all services
cd server
docker-compose up -d

# Run migrations
docker-compose exec web rails db:migrate

# View logs
docker-compose logs -f
```

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/syncspace_development
REDIS_URL=redis://localhost:6379/1
JWT_SECRET_KEY=your-secret-key-here
MAILERSEND_API_TOKEN=your-mailersend-token
MAILERSEND_FROM_EMAIL=no-reply@syncspace.com
CLIENT_URL=http://localhost:3000
RACK_ATTACK_ENABLED=true
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/cable
```

## Project Structure

```
SyncSpace/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   │   ├── (auth)/       # Authentication pages
│   │   └── (protected)/  # Protected routes
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── comments/     # Comment components
│   │   ├── posts/        # Post components
│   │   ├── notifications/# Notification components
│   │   ├── search/       # Search components
│   │   └── ui/           # UI primitives (shadcn)
│   ├── contexts/          # React contexts
│   ├── lib/              # Utilities and helpers
│   ├── types/            # TypeScript definitions
│   └── messages/         # i18n translations
│
├── server/                # Rails backend
│   ├── app/
│   │   ├── channels/     # ActionCable channels
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # ActiveRecord models
│   │   ├── mailers/      # Email mailers
│   │   └── services/     # Service objects
│   ├── config/           # Rails configuration
│   ├── db/
│   │   ├── migrate/      # Database migrations
│   │   └── seeds.rb      # Seed data
│   └── spec/             # RSpec tests
│
└── docs/                 # Documentation
```

## API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot_password` | Request password reset |
| POST | `/auth/reset_password` | Reset password |
| GET | `/auth/confirm/:token` | Confirm email |
| GET | `/auth/me` | Get current user |

### Posts Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List all posts (paginated) |
| GET | `/posts/:id` | Get single post |
| POST | `/posts` | Create post |
| PUT | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |

### Comments Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/:post_id/comments` | List post comments |
| POST | `/posts/:post_id/comments` | Create comment |
| GET | `/comments/:comment_id/comments` | List replies |
| POST | `/comments/:comment_id/comments` | Create reply |
| PUT | `/comments/:id` | Update comment |
| DELETE | `/comments/:id` | Delete comment |

### Other Endpoints
- **Reactions**: `/posts/:id/reactions`, `/comments/:id/reactions`
- **Search**: `/search?q=query`
- **Tags**: `/tags`, `/tags/:id/posts`
- **Notifications**: `/notifications`, `/notifications/:id/read`
- **Users**: `/users/:id`, `/users/:id/posts`

For complete API documentation, see [docs/API.md](docs/API.md)

## Development

### Running Tests

#### Backend
```bash
cd server
bundle exec rspec
open coverage/index.html  # View coverage report
```

#### Frontend
```bash
cd client
npm test
npm test -- --coverage
```

### Code Quality

The project maintains high code quality standards:
- **Backend**: 92% test coverage (RSpec + SimpleCov)
- **Frontend**: TypeScript strict mode
- **Linting**: ESLint + Prettier
- **Security**: Rack::Attack rate limiting, input sanitization

### Database Migrations

```bash
# Create migration
rails generate migration MigrationName

# Run migrations
rails db:migrate

# Rollback
rails db:rollback

# Reset database
rails db:reset
```

## Security Features

### Backend Security
- ✅ JWT authentication with rotating refresh tokens
- ✅ Bcrypt password hashing
- ✅ Rate limiting on critical endpoints (Rack::Attack)
- ✅ Input sanitization (XSS prevention)
- ✅ SQL injection protection (ActiveRecord)
- ✅ CORS configuration
- ✅ Secure token generation (SecureRandom)

### Frontend Security
- ✅ Secure cookie storage for tokens
- ✅ HTTP-only cookies
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ Route protection middleware
- ✅ Type safety (TypeScript)

## Performance Optimizations

- **PostgreSQL GIN indexes** for fast full-text search
- **Counter caching** for efficient count queries
- **Redis caching** for sessions and real-time data
- **Eager loading** to prevent N+1 queries
- **Database connection pooling**
- **ActionCable** for efficient WebSocket connections

## Deployment

### Backend (Render.com / Fly.io / Heroku)

1. Set environment variables
2. Configure PostgreSQL database
3. Configure Redis
4. Run migrations: `rails db:migrate`
5. Deploy application

### Frontend (Vercel / Netlify)

1. Set environment variables
2. Build: `npm run build`
3. Deploy

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# Run migrations
docker-compose exec web rails db:migrate

# View logs
docker-compose logs -f
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is part of a technical assessment for Leantech.

## Author

**Daniel E. Londoño**
- Email: daniel.esloh@gmail.com
- GitHub: [Your GitHub Profile]

## Acknowledgments

- Built as a technical assessment for Leantech
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
