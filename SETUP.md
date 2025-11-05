# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to **SQL Editor**
3. Copy and paste the entire contents of `supabase-schema.sql` and run it
4. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret!)

## Step 3: Create Environment File

Create a file named `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ADMIN_PASSWORD=your-secure-password-here
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password-here
```

**Important**: Replace all placeholder values with your actual Supabase credentials!

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your website.

## Step 5: Access Admin Portal

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and enter your admin password.

## Troubleshooting

### "Module not found" errors
- Make sure you ran `npm install`

### Supabase connection errors
- Verify your `.env.local` file has correct values
- Make sure you ran the SQL schema in Supabase

### Photo upload errors
- Ensure the `photos` storage bucket was created (check Supabase Storage)
- Verify storage policies allow public uploads

### Admin login not working
- Check that `ADMIN_PASSWORD` is set in `.env.local`
- Try clearing browser cache/sessionStorage

## Next Steps

1. Test the registration form
2. Test the admin portal
3. Customize colors/styling if needed
4. Deploy to Vercel or your preferred platform

---

**Once a Kohatian, Always a Kohatian** 🇵🇰


