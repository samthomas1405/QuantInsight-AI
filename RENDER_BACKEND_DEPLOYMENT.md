# Render Backend Deployment Guide

## Prerequisites
- GitHub account with your repository
- Render account (sign up at render.com)
- API keys ready (Finnhub, OpenAI, etc.)

## Quick Deploy with render.yaml (Recommended)

### Step 1: Push render.yaml to GitHub
```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Deploy to Render
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select your repository and branch
5. Render will detect the `render.yaml` file
6. Click "Apply"

### Step 3: Configure Environment Variables
After deployment starts, add these secret environment variables:

1. Go to your service dashboard
2. Click "Environment" tab
3. Add these variables:
   - `FINNHUB_API_KEY`: Your Finnhub API key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `GROQ_API_KEY`: Your Groq API key
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `SENDGRID_FROM_EMAIL`: Your verified sender email

## Manual Deploy (Alternative)

If you prefer manual setup:

### Step 1: Create Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `quantinsight-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Branch**: `main`

### Step 2: Add Environment Variables
Add all environment variables:

```
DATABASE_URL=<auto-provided by Render>
SECRET_KEY=<generate a secure key>
FINNHUB_API_KEY=<your key>
OPENAI_API_KEY=<your key>
ANTHROPIC_API_KEY=<your key>
GROQ_API_KEY=<your key>
SENDGRID_API_KEY=<your key>
SENDGRID_FROM_EMAIL=<your email>
FRONTEND_URL=https://quantinsight-ai.vercel.app
CORS_ORIGINS=https://quantinsight-ai.vercel.app,http://localhost:3000
```

### Step 3: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `quantinsight-db`
   - **Database**: `quantinsight`
   - **User**: `quantinsight`
   - **Region**: Same as your web service
3. Connect to your web service

## Post-Deployment Steps

### 1. Update Frontend Environment Variable
In your Vercel dashboard:
1. Go to Settings → Environment Variables
2. Update `REACT_APP_API_URL` to your Render backend URL
   - Example: `https://quantinsight-backend.onrender.com`
3. Redeploy frontend

### 2. Test the Deployment
```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Test API endpoint
curl https://your-backend.onrender.com/
```

### 3. Monitor Logs
- Go to your service dashboard
- Click "Logs" tab to see real-time logs

## Database Migrations

Run migrations after deployment:

1. Go to your service dashboard
2. Click "Shell" tab
3. Run:
```bash
cd /app
python -m alembic upgrade head
```

## Important Notes

### Free Tier Limitations
- **Auto-sleep**: Service sleeps after 15 minutes of inactivity
- **Cold start**: First request after sleep takes 30-60 seconds
- **Monthly limit**: 750 hours (enough for one service 24/7)

### Performance Tips
1. **Prevent sleep**: Set up a health check monitor (e.g., UptimeRobot)
2. **Optimize Docker image**: Use multi-stage builds
3. **Cache dependencies**: Leverage Docker layer caching

### Security Best Practices
1. Use strong `SECRET_KEY` (generate with `openssl rand -hex 32`)
2. Enable HTTPS (automatic on Render)
3. Restrict CORS origins to your domains only
4. Use environment variables for all secrets

## Troubleshooting

### Service Won't Start
- Check logs for errors
- Ensure all required environment variables are set
- Verify Dockerfile syntax

### Database Connection Failed
- Check DATABASE_URL is properly set
- Ensure database and web service are in same region
- Verify database is not suspended

### CORS Errors
- Update CORS_ORIGINS environment variable
- Include both production and development URLs
- Restart service after changes

### Slow Performance
- Service might be sleeping (cold start)
- Consider upgrading to paid plan for always-on service
- Optimize database queries

## Monitoring

### Set up Alerts
1. Go to service Settings → Notifications
2. Configure email alerts for failures
3. Set up health check monitoring

### View Metrics
- CPU usage
- Memory consumption
- Request count
- Response times

## Cost Optimization

### Free Tier Strategy
- Use one web service + one PostgreSQL database
- Implement caching to reduce API calls
- Use client-side rate limiting

### When to Upgrade
- Need always-on service (no sleep)
- Require more than 750 hours/month
- Need better performance
- Want custom domains with SSL

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Update frontend with backend URL
3. ✅ Test all API endpoints
4. 📊 Set up monitoring
5. 🚀 Share your deployed app!

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Status Page: https://status.render.com