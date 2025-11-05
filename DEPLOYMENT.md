# Deployment Guide - Vercel

## Fixing Admin Portal Not Updating on Vercel

If your admin portal shows old code after deployment, follow these steps:

### 1. Clear Vercel Build Cache

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Scroll down to **Build & Development Settings**
4. Click **Clear Build Cache** or **Clear Cache**
5. Redeploy your project

### 2. Force Redeploy

1. Go to your Vercel project dashboard
2. Click on **Deployments** tab
3. Click the **⋯** (three dots) on the latest deployment
4. Select **Redeploy**
5. Check **Use existing Build Cache** → **UNCHECK** this option
6. Click **Redeploy**

### 3. Verify Environment Variables

Make sure all environment variables are set in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (optional, if not using Supabase admin_settings table)
   - `NEXT_PUBLIC_ADMIN_PASSWORD` (optional, fallback)

3. After adding/updating variables, **redeploy** your project

### 4. Clear Browser Cache

The issue might be browser caching:

1. **Hard Refresh**:
   - **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
   - **Safari**: `Cmd + Option + R`

2. **Clear Site Data**:
   - Open browser DevTools (F12)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Click **Clear site data**
   - Refresh the page

3. **Incognito/Private Mode**:
   - Test in incognito/private window to bypass cache

### 5. Check Deployment Logs

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Check **Build Logs** for any errors
4. Check **Runtime Logs** for runtime errors

### 6. Verify Git Commit

Make sure your latest changes are committed and pushed:

```bash
git status
git add .
git commit -m "Update admin portal"
git push
```

### 7. Add Cache Headers (if needed)

If issues persist, you can add a `vercel.json` file to control caching:

```json
{
  "headers": [
    {
      "source": "/admin",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate, max-age=0"
        }
      ]
    },
    {
      "source": "/api/admin/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate, max-age=0"
        }
      ]
    }
  ]
}
```

### 8. Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Refresh the admin page
4. Check if the JavaScript files are loading from cache or server
5. Look for any 304 (Not Modified) responses - these indicate caching

### Common Issues:

- **Old JavaScript bundle**: Clear Vercel cache and redeploy
- **Environment variables not set**: Add them in Vercel dashboard
- **Browser caching**: Hard refresh or clear browser cache
- **CDN caching**: Vercel uses CDN, may take a few minutes to propagate
- **Service worker**: Check if a service worker is caching old files

### Quick Fix Checklist:

- [ ] Clear Vercel build cache
- [ ] Redeploy without build cache
- [ ] Verify environment variables
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test in incognito mode
- [ ] Check deployment logs
- [ ] Verify latest code is pushed to Git

If issues persist, check the browser console and Vercel function logs for errors.

