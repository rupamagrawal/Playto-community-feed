# Playto Community Feed

A production-grade community feed system with threaded comments, likes, dynamic karma calculation, and real-time leaderboard.

## Tech Stack

- **Backend**: Django 5.0 + Django REST Framework
- **Frontend**: React 18 + Tailwind CSS (via custom CSS)
- **Database**: PostgreSQL

## Features

✅ Text posts with author attribution  
✅ Unlimited nested threaded comments (Reddit-style)  
✅ Like system for posts and comments  
✅ Dynamic karma calculation (not stored, always computed)  
✅ Real-time leaderboard (top 5 users, last 24 hours only)  
✅ Concurrent request handling with DB constraints  
✅ N+1 query prevention  

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Setup Instructions

### 1. Database Setup

#### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Access PostgreSQL prompt
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE playto_community;
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER ROLE postgres SET client_encoding TO 'utf8';
ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';
ALTER ROLE postgres SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE playto_community TO postgres;
\q
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials if different

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

### 4. Access the Application

1. Open browser to `http://localhost:3000`
2. Create an account or login
3. Start posting and engaging!

Admin panel: `http://localhost:8000/admin`

## Project Structure

```
playto-community-feed/
├── backend/
│   ├── community/
│   │   ├── models.py           # Data models with constraints
│   │   ├── serializers.py      # DRF serializers with N+1 prevention
│   │   ├── views.py            # Optimized API views
│   │   ├── urls.py             # API routing
│   │   └── admin.py            # Admin configuration
│   ├── playto_backend/
│   │   ├── settings.py         # Django configuration
│   │   └── urls.py             # Main URL routing
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Feed.js         # Main feed component
    │   │   ├── Post.js         # Post with comments
    │   │   ├── CommentThread.js # Recursive comment rendering
    │   │   ├── CreatePost.js   # Post creation form
    │   │   ├── CreateComment.js # Comment form
    │   │   ├── Leaderboard.js  # Top users widget
    │   │   └── Login.js        # Authentication
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## API Endpoints

### Posts
- `GET /api/posts/` - List all posts
- `POST /api/posts/` - Create post
- `GET /api/posts/{id}/` - Get post with comment tree

### Comments
- `POST /api/comments/` - Create comment or reply

### Likes
- `POST /api/likes/toggle/` - Like/unlike post or comment

### Leaderboard
- `GET /api/leaderboard/top/` - Top 5 users (24h karma)

## Environment Variables

Backend `.env`:
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=playto_community
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Testing Database Queries

To verify N+1 prevention and karma calculation:

```python
# In Django shell (python manage.py shell)
from community.models import Post, Comment, Like
from django.db import connection
from django.test.utils import override_settings

# Enable query logging
import logging
l = logging.getLogger('django.db.backends')
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())

# Test post retrieval with comments (should be ~3-4 queries)
post = Post.objects.select_related('author').prefetch_related(
    'comments__author', 'comments__replies'
).first()

# Check query count
print(len(connection.queries))
```

## Production Deployment Checklist

- [ ] Set `DEBUG=False` in settings
- [ ] Use strong `SECRET_KEY`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use production database credentials
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure static file serving
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Use environment-specific settings

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `.env`
- Ensure database exists: `psql -l`

### CORS Errors
- Verify `CORS_ALLOWED_ORIGINS` in backend settings
- Check frontend is running on correct port

### Migration Issues
- Delete migration files (keep `__init__.py`)
- Delete database
- Recreate database and run migrations fresh

## License

MIT License - See LICENSE file for details
