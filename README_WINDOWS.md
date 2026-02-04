# Playto Community Feed

A production-grade community feed system with threaded comments, likes, dynamic karma calculation, and real-time leaderboard.

## Tech Stack

- **Backend**: Django 5.0 + Django REST Framework
- **Frontend**: React 18 + Tailwind CSS
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

- Python 3.10+ ([Download](https://www.python.org/downloads/))
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/windows/))
- Git Bash (comes with [Git for Windows](https://git-scm.com/download/win))

---

## Setup Instructions for Windows (Git Bash)

### 1. Install PostgreSQL

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Set password for `postgres` user (remember this!)
   - Default port: `5432`
   - Install pgAdmin 4 (GUI tool)
4. Add PostgreSQL to PATH:
   ```bash
   # Add this to your ~/.bashrc or run each time:
   export PATH="/c/Program Files/PostgreSQL/14/bin:$PATH"
   ```

### 2. Create Database

**Option A: Using pgAdmin 4 (GUI)**
1. Open pgAdmin 4
2. Connect to PostgreSQL server (use your password)
3. Right-click "Databases" → Create → Database
4. Database name: `playto_community`
5. Click "Save"

**Option B: Using Git Bash (Command Line)**
```bash
# Start PostgreSQL shell (use your postgres password)
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE playto_community;
\q
```

### 3. Extract Project Files

```bash
# Navigate to your projects folder
cd ~/Documents/Projects  # or wherever you want

# Extract the tar.gz file (assuming it's in Downloads)
tar -xzf ~/Downloads/playto-community-feed.tar.gz

# Navigate into project
cd playto-community-feed
```

### 4. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Git Bash)
source venv/Scripts/activate

# You should see (venv) in your prompt now

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env file with your settings
# Use: notepad .env
# Or: nano .env
# Or: code .env (if you have VS Code)

# Update these lines in .env:
# DB_PASSWORD=your_postgres_password_here
# (Change other settings if needed)

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser
# Enter username, email (optional), and password

# Create some test data (optional)
python manage.py shell
```

In the Python shell, paste this to create test data:
```python
from community.models import User, Post, Comment, Like
from django.utils import timezone

# Create test users
user1 = User.objects.create_user('alice', password='test123')
user2 = User.objects.create_user('bob', password='test123')
user3 = User.objects.create_user('charlie', password='test123')

# Create posts
post1 = Post.objects.create(author=user1, content='Welcome to Playto Community! This is my first post.')
post2 = Post.objects.create(author=user2, content='Just discovered this platform. Looking forward to connecting!')
post3 = Post.objects.create(author=user3, content='What are everyone\'s thoughts on the new features?')

# Create comments
c1 = Comment.objects.create(post=post1, author=user2, content='Great post! Excited to be here.')
c2 = Comment.objects.create(post=post1, author=user3, parent=c1, content='Same here! This looks promising.')
c3 = Comment.objects.create(post=post2, author=user1, content='Welcome Bob!')

# Create likes
Like.objects.create(user=user2, post=post1)
Like.objects.create(user=user3, post=post1)
Like.objects.create(user=user1, comment=c1)

print("Test data created successfully!")
exit()
```

```bash
# Start development server
python manage.py runserver
```

**Backend is now running on `http://localhost:8000`** ✅

Keep this terminal open!

### 5. Frontend Setup

**Open a NEW Git Bash terminal** (keep backend running in the first one)

```bash
# Navigate to project folder
cd ~/Documents/Projects/playto-community-feed

# Navigate to frontend folder
cd frontend

# Install dependencies (this may take a few minutes)
# This will install React, Tailwind CSS, and all other dependencies
npm install

# Start development server
npm start
```

**Frontend will automatically open in your browser at `http://localhost:3000`** ✅

**Note**: The project uses **Tailwind CSS** for styling. The configuration is already set up in `tailwind.config.js` and `postcss.config.js`.

### 6. Access the Application

1. **Main App**: `http://localhost:3000`
   - Log in with test account: `alice` / `test123`
   - Or create a new account

2. **Admin Panel**: `http://localhost:8000/admin`
   - Log in with superuser credentials you created

---

## Common Windows Issues & Solutions

### Issue: `python` command not found
**Solution**: 
```bash
# Try using py instead
py -m venv venv
py manage.py runserver
```

Or add Python to PATH:
1. Search "Environment Variables" in Windows
2. Edit PATH variable
3. Add: `C:\Python310\` (or your Python location)

### Issue: `psql` command not found
**Solution**: Add PostgreSQL to PATH
```bash
# Add to ~/.bashrc
echo 'export PATH="/c/Program Files/PostgreSQL/14/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: Permission denied on venv/Scripts/activate
**Solution**: Make sure you're using Git Bash (not CMD or PowerShell)
```bash
source venv/Scripts/activate  # Git Bash
# NOT: venv\Scripts\activate.bat (that's for CMD)
```

### Issue: Port 8000 already in use
**Solution**: Kill the process
```bash
# Find process using port 8000
netstat -ano | grep 8000

# Kill it (use PID from above)
taskkill /PID <PID_NUMBER> /F
```

### Issue: PostgreSQL connection refused
**Solution**: 
1. Open Windows Services (`services.msc`)
2. Find "postgresql-x64-14" 
3. Right-click → Start
4. Set to "Automatic" startup

### Issue: npm install fails
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

---

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
│   ├── requirements.txt
│   └── .env                    # Your configuration (create this)
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
    ├── package.json
    └── node_modules/           # Created by npm install
```

---

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

---

## Environment Variables

Your `backend/.env` file should look like this:

```env
# Django Settings
SECRET_KEY=your-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (CHANGE THE PASSWORD)
DB_NAME=playto_community
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Stopping the Servers

**To stop the backend:**
1. Go to the terminal running Django
2. Press `Ctrl + C`
3. Type `deactivate` to exit virtual environment

**To stop the frontend:**
1. Go to the terminal running React
2. Press `Ctrl + C`
3. Type `Y` when asked to confirm

---

## Restarting After Closing

**Backend:**
```bash
cd ~/Documents/Projects/playto-community-feed/backend
source venv/Scripts/activate
python manage.py runserver
```

**Frontend:**
```bash
cd ~/Documents/Projects/playto-community-feed/frontend
npm start
```

---

## Testing Database Queries (Advanced)

To verify N+1 prevention and karma calculation:

```bash
# In backend folder with venv activated
python manage.py shell
```

```python
from community.models import Post, Comment, Like
from django.db import connection
from django.db import reset_queries

# Enable query logging
import logging
l = logging.getLogger('django.db.backends')
l.setLevel(logging.DEBUG)
l.addHandler(logging.StreamHandler())

# Test: Fetch post with all comments (should be ~3-4 queries)
reset_queries()
post = Post.objects.prefetch_related('comments__author', 'comments__replies').first()
print(f"Total queries: {len(connection.queries)}")

# Test: Get leaderboard
from community.views import LeaderboardViewSet
# Check EXPLAINER.md for the exact query
```

---

## Getting Help

**If you encounter issues:**

1. Check if services are running:
   - PostgreSQL: Open Services app, look for postgresql-x64-14
   - Backend: Should see output in Git Bash terminal
   - Frontend: Should see "Compiled successfully!" in terminal

2. Check the logs:
   - Backend errors appear in Django terminal
   - Frontend errors appear in browser console (F12)

3. Verify database connection:
   ```bash
   psql -U postgres -d playto_community
   # Should connect without errors
   \dt  # List tables
   \q   # Quit
   ```

4. Check `.env` file:
   - Make sure DB_PASSWORD matches your PostgreSQL password
   - No spaces around `=` signs

---

## Production Deployment Notes

For production deployment on Windows Server or cloud platforms:

- [ ] Set `DEBUG=False` in settings
- [ ] Use strong `SECRET_KEY`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use production database credentials
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure static file serving with WhiteNoise or Nginx
- [ ] Set up database backups
- [ ] Configure logging to files
- [ ] Use environment-specific settings
- [ ] Consider using Docker for easier deployment

---

## Quick Reference Commands

**Backend Commands:**
```bash
# Activate venv
source venv/Scripts/activate

# Run server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Deactivate venv
deactivate
```

**Frontend Commands:**
```bash
# Install packages
npm install

# Start dev server
npm start

# Build for production
npm run build
```

**Git Bash Tips:**
```bash
# Clear screen
clear

# List files
ls -la

# Navigate up
cd ..

# Go to home
cd ~

# View file contents
cat filename.txt

# Edit file
nano filename.txt  # or: code filename.txt
```

---

## License

MIT License - See LICENSE file for details

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Git Bash Guide](https://git-scm.com/doc)

For detailed technical explanations, see **EXPLAINER.md**
