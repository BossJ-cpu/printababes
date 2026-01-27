# Troubleshooting Log

## 2026-01-19: Database Manager Connected to Production

### Problem
The Database Manager page (`http://127.0.0.1:3000/database-manager`) in the Next.js frontend was displaying data from the production Render database instead of the local SQLite database.

### Cause
The API URL in `rebuild-copies/next-frontend/app/database-manager/page.tsx` was hardcoded to the production endpoint:
```typescript
const API_BASE = 'https://printababes-laravel.onrender.com/api';
```

### Solution
The code was updated to use the `NEXT_PUBLIC_API_URL` environment variable, falling back to `http://localhost:8000` if not set. This ensures the frontend connects to the local backend during development.

**File Changed:** `rebuild-copies/next-frontend/app/database-manager/page.tsx`

**Code Change:**
```typescript
// Before
const API_BASE = 'https://printababes-laravel.onrender.com/api';

// After
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api';
```

## 2026-01-19: Missing Template Name Input in PDF Editor (Database Mode)

### Problem
In the PDF Editor (`/pdf-editor?mode=database`), users could not enter a name for a new template because the input field was missing from the UI. Additionally, selecting "Create New Template" would sometimes cause the UI to break by resetting the selected table.

### Cause
1.  The "Template Name" input field was only rendered in the CSV mode block, not in the Database mode block.
2.  The `onChange` handler for the template dropdown used `loadProfile('')` which reset the entire template state, including the `source_table`, causing the database configuration block to hide itself (since it depends on `template.source_table`).

### Solution
1.  Added the "Template Name" input field to the Database mode section in `page.tsx`.
2.  Updated the template dropdown `onChange` handler to preserve `source_table` when selecting "Create New Template".

**File Changed:** `rebuild-copies/next-frontend/app/pdf-editor/page.tsx`

**Code Added:**
```typescript
{/* Template Name Input - Database Mode */}
{!template.id && template.source_table && (
  <div className="mt-3">
    <label className="...">Template Name *</label>
    <input ... />
    ...
  </div>
)}
```

## 2026-01-19: CORS Error - Multiple Access-Control-Allow-Origin Headers

### Problem
When fetching data from the API (e.g., generating submission PDFs), the browser blocked the request with a CORS error:
> The 'Access-Control-Allow-Origin' header contains multiple values '*, *', but only one is allowed.

This also caused `TypeError: Failed to fetch` errors in the frontend.

### Cause
The `HandleCors` middleware was being executed twice for each request, causing the `Access-Control-Allow-Origin` header to be added twice (once as `*` and then again as `*`), resulting in the invalid combined value `*, *`.

This happened because:
1.  Laravel 11 automatically includes `Illuminate\Http\Middleware\HandleCors` in the global middleware stack by default.
2.  The middleware was *also* manually added to the `web` and `api` middleware groups in `bootstrap/app.php`.

### Solution
Removed the manual registration of `HandleCors` middleware from `bootstrap/app.php`. Laravel's default global middleware stack now handles CORS correctly using the settings from `config/cors.php`.

**File Changed:** `bootstrap/app.php`

**Code Removed:**
```php
// Enable CORS for all web routes in development
$middleware->web(append: [
    \Illuminate\Http\Middleware\HandleCors::class,
]);
// Enable CORS for API routes
$middleware->api(prepend: [
    \Illuminate\Http\Middleware\HandleCors::class,
]);
```

### Update (Correction)
The root cause was actually in `App\Http\Controllers\SubmissionController.php`. The controller method `generatePdf` was manually adding `Access-Control-Allow-Origin` headers via `header()` function calls, duplicating the headers already added by Laravel's global middleware.

**Additional Fixes:**
1.  Removed manual `header()` calls and `OPTIONS` handling from `SubmissionController.php`.
2.  Removed `'options'` from the `Route::match` definition in `routes/api.php` to let middleware handle preflight requests.
3.  Restored default `bootstrap/app.php` configuration (removed the workaround to remove `HandleCors`).

**File Changed:** `app/Http/Controllers/SubmissionController.php`
```php
// Removed manual headers:
// header('Access-Control-Allow-Origin: *');
// header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
// ...
```
