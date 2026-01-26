# Complete Installation Guide for PDF Printables Application

This guide lists **ALL programs, dependencies, and versions** needed to run this application on a new PC.

---

## 🖥️ REQUIRED SOFTWARE TO INSTALL

### 1. PHP 8.2 or Higher
- **Version Required:** `^8.2` (8.2.x or higher)
- **Download:** https://windows.php.net/download/
- **Recommended:** Install via XAMPP (easier for Windows)

#### Option A: XAMPP (Recommended for Windows)
- **Download:** https://www.apachefriends.org/download.html
- **Version:** XAMPP 8.2.x (includes PHP 8.2, Apache, MySQL)
- This gives you PHP, Apache web server, and MySQL all in one package

#### Option B: Standalone PHP
- Download PHP 8.2.x from https://windows.php.net/download/
- Get the **Thread Safe** version for Windows

#### Required PHP Extensions (enable in php.ini):
```ini
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=pdo_sqlite
extension=zip
```

---

### 2. Composer (PHP Package Manager)
- **Version Required:** Latest (2.x)
- **Download:** https://getcomposer.org/download/
- **Windows Installer:** https://getcomposer.org/Composer-Setup.exe

---

### 3. Node.js
- **Version Required:** `18.x` or higher (LTS recommended: `20.x` or `22.x`)
- **Download:** https://nodejs.org/
- This includes `npm` (Node Package Manager) automatically

---

### 4. Git (Optional but Recommended)
- **Version:** Latest
- **Download:** https://git-scm.com/download/win

---

### 5. Database (Choose One)

#### Option A: SQLite (Default - No Installation Needed)
- Built into PHP, no separate installation required
- Recommended for local development

#### Option B: MySQL
- **Version:** 8.0 or higher
- Included with XAMPP, or download separately: https://dev.mysql.com/downloads/mysql/

---

## 📦 PHP/LARAVEL DEPENDENCIES (composer.json)

These are installed automatically with `composer install`:

### Production Dependencies
| Package | Version |
|---------|---------|
| php | ^8.2 |
| laravel/framework | ^12.0 |
| laravel/sanctum | ^4.0 |
| laravel/tinker | ^2.10.1 |
| maatwebsite/excel | ^3.1 |
| setasign/fpdf | ^1.8 |
| setasign/fpdi | ^2.6 |

### Development Dependencies
| Package | Version |
|---------|---------|
| fakerphp/faker | ^1.23 |
| laravel/pail | ^1.2.2 |
| laravel/pint | ^1.24 |
| laravel/sail | ^1.41 |
| mockery/mockery | ^1.6 |
| nunomaduro/collision | ^8.6 |
| phpunit/phpunit | ^11.5.3 |

---

## 📦 NODE.JS DEPENDENCIES - ROOT (package.json)

### Production Dependencies
| Package | Version |
|---------|---------|
| next | ^16.1.1 |
| react | ^19.2.3 |
| react-dom | ^19.2.3 |

### Development Dependencies
| Package | Version |
|---------|---------|
| @tailwindcss/vite | ^4.0.0 |
| autoprefixer | ^10.4.23 |
| axios | ^1.11.0 |
| concurrently | ^9.0.1 |
| laravel-vite-plugin | ^2.0.0 |
| postcss | ^8.5.6 |
| tailwindcss | ^4.1.18 |
| vite | ^7.0.7 |

---

## 📦 NODE.JS DEPENDENCIES - NEXT.JS FRONTEND (rebuild-copies/next-frontend/package.json)

### Production Dependencies
| Package | Version |
|---------|---------|
| next | ^15.0.0 |
| pdfjs-dist | ^4.10.38 |
| react | ^19.0.0 |
| react-dom | ^19.0.0 |
| react-pdf | ^9.2.1 |

### Development Dependencies
| Package | Version |
|---------|---------|
| @types/node | ^20.19.27 |
| @types/react | ^19.2.7 |
| @types/react-dom | ^19.0.0 |
| autoprefixer | ^10.4.23 |
| postcss | ^8.5.6 |
| tailwindcss | ^3.4.19 |
| typescript | ^5.9.3 |

---

## 🚀 STEP-BY-STEP INSTALLATION INSTRUCTIONS

### Step 1: Install Required Software

1. **Install XAMPP 8.2.x** from https://www.apachefriends.org/
   - During installation, select PHP 8.2
   - This includes Apache, MySQL, and PHP

2. **Install Composer** from https://getcomposer.org/Composer-Setup.exe
   - Run the installer
   - Point it to your PHP installation (e.g., `C:\xampp\php\php.exe`)

3. **Install Node.js LTS** from https://nodejs.org/
   - Download the LTS version (20.x or 22.x)
   - Run the installer with default settings

4. **Install Git** from https://git-scm.com/download/win (optional)

### Step 2: Verify Installations

Open Command Prompt or PowerShell and run:

```bash
php -v
# Should show: PHP 8.2.x or higher

composer -V
# Should show: Composer version 2.x.x

node -v
# Should show: v20.x.x or v22.x.x

npm -v
# Should show: 10.x.x or higher
```

### Step 3: Copy Project Files

Copy the entire project folder to:
```
C:\xampp\htdocs\printables
```
(or any location you prefer)

### Step 4: Install PHP Dependencies

Open terminal in the project root folder:

```bash
cd C:\xampp\htdocs\printables

# Install PHP dependencies
composer install
```

### Step 5: Configure Environment

```bash
# Copy environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

### Step 6: Setup Database

For SQLite (default, easiest):
```bash
# Create SQLite database file
type nul > database\database.sqlite

# Run migrations
php artisan migrate
```

For MySQL:
1. Edit `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=printables
DB_USERNAME=root
DB_PASSWORD=
```
2. Create database in MySQL
3. Run: `php artisan migrate`

### Step 7: Install Node.js Dependencies (Root)

```bash
# In project root
npm install
```

### Step 8: Install Node.js Dependencies (Next.js Frontend)

```bash
# Navigate to Next.js frontend
cd rebuild-copies\next-frontend

# Install dependencies
npm install

# Go back to root
cd ..\..
```

### Step 9: Run the Application

```bash
# Run both backend and frontend simultaneously
npm run dev:full
```

Or run separately in two terminals:

**Terminal 1 (Backend):**
```bash
php artisan serve
```

**Terminal 2 (Frontend):**
```bash
cd rebuild-copies\next-frontend
npm run dev
```

### Step 10: Access the Application

- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:3000

---

## 📋 QUICK CHECKLIST

| Item | Version | Download Link |
|------|---------|---------------|
| ✅ XAMPP | 8.2.x | https://www.apachefriends.org/ |
| ✅ PHP | ^8.2 | Included in XAMPP |
| ✅ Composer | 2.x | https://getcomposer.org/Composer-Setup.exe |
| ✅ Node.js | 20.x LTS | https://nodejs.org/ |
| ✅ npm | 10.x | Included with Node.js |
| ✅ Git | Latest | https://git-scm.com/download/win |

---

## 🔧 TROUBLESHOOTING

### PHP Extension Errors
If you get extension errors, enable them in `C:\xampp\php\php.ini`:
- Find the line starting with `;extension=` 
- Remove the `;` to enable it

### Port Already in Use
- Backend default: 8000 (change with `php artisan serve --port=8001`)
- Frontend default: 3000 (Next.js will auto-increment if busy)

### Permission Errors
Run these commands:
```bash
php artisan cache:clear
php artisan config:clear
php artisan storage:link
```

### Node.js Memory Issues
Set environment variable:
```bash
set NODE_OPTIONS=--max-old-space-size=4096
```

---

## 📁 FILES TO TRANSFER

When copying to a new PC, copy the **entire project folder** EXCEPT:
- `vendor/` (will be recreated by `composer install`)
- `node_modules/` (will be recreated by `npm install`)
- `.env` (copy `.env.example` and configure)

---

## 🐳 ALTERNATIVE: Docker Installation

If you prefer Docker, the project includes a Dockerfile. Install:
- **Docker Desktop:** https://www.docker.com/products/docker-desktop/

Then run:
```bash
docker build -t printables .
docker run -p 8000:80 printables
```

---

**Last Updated:** January 23, 2026
