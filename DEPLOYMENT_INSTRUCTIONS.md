# Complete Deployment Instructions

## Frontend Deployment (Vercel) ✅ COMPLETED

Your frontend is now live at:
- Production URL: https://frontend-ms08zzn6l-samthomas1405-4688s-projects.vercel.app

## Backend Deployment (Render) - Next Steps

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account (recommended) or email

### Step 2: Deploy Backend Using render.yaml

1. Once logged in, click **"New +"** → **"Blueprint"**
2. Connect your GitHub account if not already connected
3. Select repository: `samthomas1405/QuantInsight-AI`
4. Render will detect the `render.yaml` file
5. Review the services to be created:
   - quantinsight-backend (Web Service)
   - quantinsight-db (PostgreSQL)
   - quantinsight-redis (Redis)
6. Click **"Apply"**

### Step 3: Add Secret Environment Variables

After deployment starts:

1. Go to your **quantinsight-backend** service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** and add these:

   ```
   FINNHUB_API_KEY = your_finnhub_api_key
   OPENAI_API_KEY = your_openai_api_key
   ANTHROPIC_API_KEY = your_anthropic_api_key
   GROQ_API_KEY = your_groq_api_key
   SENDGRID_API_KEY = your_sendgrid_api_key
   SENDGRID_FROM_EMAIL = your_verified_email@example.com
   ```

4. Click **"Save Changes"**
5. Service will automatically redeploy with new variables

### Step 4: Wait for Deployment

1. Check the **"Events"** tab for deployment progress
2. Wait for "Deploy live" status (5-10 minutes)
3. Once deployed, copy your backend URL (e.g., `https://quantinsight-backend.onrender.com`)

### Step 5: Update Frontend with Backend URL

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **frontend** project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   REACT_APP_API_URL = https://quantinsight-backend.onrender.com
   ```
   (Replace with your actual Render backend URL)
5. Go to **Deployments** tab
6. Click **"Redeploy"** on the latest deployment → **"Use existing Build Cache"** → **"Redeploy"**

### Step 6: Test Your Application

1. Visit your frontend: https://frontend-ms08zzn6l-samthomas1405-4688s-projects.vercel.app
2. Test registration/login
3. Check that API calls work

## Troubleshooting

### Backend not starting?
- Check logs in Render dashboard → Logs tab
- Verify all environment variables are set
- Ensure database is connected

### CORS errors?
- Backend already configured to accept your Vercel URL
- Clear browser cache and cookies
- Try incognito mode

### Database issues?
- Go to your database service in Render
- Check if it's active
- Run migrations if needed

## Important URLs

- **Frontend**: https://frontend-ms08zzn6l-samthomas1405-4688s-projects.vercel.app
- **Backend**: Will be provided by Render after deployment
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure monitoring/alerts
3. Test all features thoroughly
4. Share your app! 🚀