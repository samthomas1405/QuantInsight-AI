# Detailed Render Backend Deployment Guide

## Prerequisites Checklist
- [x] Frontend deployed to Vercel: https://frontend-ms08zzn6l-samthomas1405-4688s-projects.vercel.app
- [x] GitHub repository updated with render.yaml
- [ ] Your API keys ready:
  - Finnhub API key
  - OpenAI API key
  - Anthropic API key
  - Groq API key (optional)
  - SendGrid API key (for emails)

## Step 1: Create Render Account

1. Open your browser and go to https://render.com
2. Click **"Get Started for Free"**
3. **Sign up with GitHub** (recommended) - this makes connecting your repo easier
   - Click "Sign up with GitHub"
   - Authorize Render to access your GitHub
4. Verify your email if required

## Step 2: Deploy Using Blueprint (render.yaml)

1. Once logged in to Render dashboard, click the **"New +"** button (top right)
2. Select **"Blueprint"** from the dropdown
3. If you signed up with GitHub, your repos should appear. If not:
   - Click "Configure GitHub"
   - Select your GitHub account
   - Choose "All repositories" or select "QuantInsight-AI"
4. Find and select **"samthomas1405/QuantInsight-AI"**
5. Render will detect the `render.yaml` file and show:
   ```
   Blueprint detected: render.yaml
   Services to create:
   - quantinsight-backend (Web Service)
   - quantinsight-db (PostgreSQL)
   - quantinsight-redis (Redis)
   ```
6. Review the services and click **"Apply"**

## Step 3: Monitor Initial Deployment

1. You'll be redirected to your dashboard showing all services
2. Click on **"quantinsight-backend"** service
3. Go to the **"Logs"** tab to watch the deployment progress
4. Initial deployment will fail - this is expected! We need to add API keys

## Step 4: Add Environment Variables (Critical Step)

1. In the quantinsight-backend service, click **"Environment"** tab
2. You'll see some variables already set (DATABASE_URL, REDIS_URL, etc.)
3. Click **"Add Environment Variable"** for each of these:

   **Required Variables:**
   ```
   Key: FINNHUB_API_KEY
   Value: [your Finnhub API key]
   
   Key: OPENAI_API_KEY
   Value: [your OpenAI API key]
   
   Key: ANTHROPIC_API_KEY
   Value: [your Anthropic API key]
   
   Key: SENDGRID_API_KEY
   Value: [your SendGrid API key]
   
   Key: SENDGRID_FROM_EMAIL
   Value: [your verified SendGrid email]
   ```

   **Optional Variables (if you have them):**
   ```
   Key: GROQ_API_KEY
   Value: [your Groq API key]
   ```

4. After adding all variables, click **"Save Changes"**
5. The service will automatically redeploy

## Step 5: Verify Deployment Success

1. Go back to the **"Logs"** tab
2. Wait for deployment to complete (5-10 minutes)
3. Look for these success indicators:
   ```
   ==> Starting service with 'docker run...'
   INFO:     Started server process
   INFO:     Waiting for application startup
   INFO:     Application startup complete
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```
4. Once you see "Live", your backend is deployed!

## Step 6: Get Your Backend URL

1. In your service dashboard, look at the top for your URL
2. It will be something like: `https://quantinsight-backend-xxxx.onrender.com`
3. Test it by visiting: `https://quantinsight-backend-xxxx.onrender.com/health`
4. You should see: `{"status":"healthy","service":"quantinsight-backend"}`

## Step 7: Update Frontend with Backend URL

1. Go to https://vercel.com/dashboard
2. Click on your **frontend** project
3. Navigate to **Settings** → **Environment Variables**
4. Click **"Add New"**:
   ```
   Name: REACT_APP_API_URL
   Value: https://quantinsight-backend-xxxx.onrender.com
   Environment: Production, Preview, Development (check all)
   ```
5. Click **"Save"**
6. Go to **"Deployments"** tab
7. Find the latest deployment and click the **"..."** menu → **"Redeploy"**
8. Select **"Use existing Build Cache"** → **"Redeploy"**

## Step 8: Test Your Full Application

1. Wait 2-3 minutes for Vercel to redeploy
2. Visit your frontend: https://frontend-ms08zzn6l-samthomas1405-4688s-projects.vercel.app
3. Test these features:
   - User registration
   - Login
   - Stock search
   - Market data loading

## Troubleshooting Common Issues

### "Build Failed" Error
- Check if all required environment variables are added
- Look at logs for specific error messages
- Ensure API keys are valid and not expired

### "502 Bad Gateway" Error
- Service might be sleeping (first request takes 30-60s on free tier)
- Check logs for Python errors
- Verify database connection

### CORS Errors in Browser
- Clear browser cache and cookies
- Try incognito mode
- Check that CORS_ORIGINS includes your Vercel URL

### Database Connection Failed
- Go to your database service in Render
- Ensure it's in "Available" status
- Check if DATABASE_URL is properly set

### No Market Data Loading
- Verify FINNHUB_API_KEY is correct
- Check API rate limits
- Look at backend logs for API errors

## Free Tier Limitations

- **Auto-sleep**: Service sleeps after 15 minutes of inactivity
- **Cold start**: First request after sleep takes 30-60 seconds
- **Monthly limit**: 750 hours (enough for one service running 24/7)
- **Database**: 1GB storage limit

## What Happens Next?

After successful deployment:

1. **First visit will be slow** (30-60s) as service wakes up
2. **Subsequent visits will be fast** while service is active
3. **After 15 min of no traffic**, service sleeps again
4. To keep it always active, you can:
   - Set up a monitoring service (like UptimeRobot) to ping every 10 minutes
   - Upgrade to paid plan ($7/month)

## Success Checklist

- [ ] Render account created
- [ ] Backend deployed and shows "Live"
- [ ] All API keys added as environment variables
- [ ] Backend health check returns success
- [ ] Frontend updated with backend URL
- [ ] Frontend redeployed on Vercel
- [ ] Can register/login on the app
- [ ] Market data loads correctly

## Need Help?

1. **Check Logs**: Always check the Logs tab first
2. **Render Docs**: https://render.com/docs
3. **Community Forum**: https://community.render.com
4. **Status Page**: https://status.render.com

Your app should now be fully deployed and functional! 🚀