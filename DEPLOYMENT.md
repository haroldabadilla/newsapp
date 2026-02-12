# Vercel Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- MongoDB Atlas database (or other cloud MongoDB)
- NewsAPI key (https://newsapi.org)

## Deployment Steps

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from root directory**
   ```bash
   cd c:\Users\c04-labuser812449\Desktop\newsapp
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? Yes
   - Which scope? (Select your account)
   - Link to existing project? No
   - Project name? newsapp (or your choice)
   - In which directory is your code located? ./

5. **For production deployment:**
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Vercel will auto-detect the configuration

2. **Configure Build Settings** (usually auto-detected)
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave default)
   - Output Directory: (leave default)

## Environment Variables

Set these in your Vercel project dashboard (Settings → Environment Variables):

### Required for Backend:
- `MONGODB_URI` - Your MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/newsapp?retryWrites=true&w=majority`
- `NEWS_API_KEY` - Your NewsAPI.org API key
- `JWT_SECRET` - Secret for JWT tokens (generate a random 32+ character string)
- `SESSION_SECRET` - Secret for sessions (generate a random 32+ character string)
- `NODE_ENV` - Set to `production`

### Optional:
- `PORT` - Default is 5000 (Vercel will override this)
- `COOKIE_SECURE` - Set to `true` for HTTPS
- `COOKIE_SAMESITE` - Set to `none` or `lax`

## Post-Deployment

1. **Test your deployment**
   - Visit your Vercel URL (e.g., https://newsapp-xyz.vercel.app)
   - Test login/registration
   - Test news fetching
   - Test favorites functionality

2. **Check logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on a deployment to see logs
   - Check for any errors

3. **Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB Atlas allows connections from anywhere (IP: 0.0.0.0/0)
- Or add Vercel's IP ranges to whitelist
- Check connection string format

### API Routes Not Working
- Verify `vercel.json` routing configuration
- Check that environment variables are set
- Review function logs in Vercel dashboard

### Build Failures
- Check that all dependencies are in package.json
- Ensure Node version compatibility
- Review build logs for specific errors

### Session/Cookie Issues
- Set `COOKIE_SECURE=true` in production
- Set `COOKIE_SAMESITE=none` or `lax` for cross-origin
- Ensure `trust proxy` is set in Express

## Important Notes

1. **MongoDB Atlas Setup**
   - Create a free cluster at https://cloud.mongodb.com
   - Create a database user
   - Whitelist all IPs (0.0.0.0/0) for Vercel
   - Get your connection string

2. **Environment Variables**
   - Never commit `.env` files to git
   - Set all variables in Vercel dashboard
   - They apply to all functions automatically

3. **Serverless Functions**
   - Vercel runs backend as serverless functions
   - Each API request spins up a function instance
   - MongoDB connections are pooled

4. **Cold Starts**
   - First request after inactivity may be slower
   - This is normal for serverless architecture
   - Subsequent requests are fast

## Useful Commands

```bash
# Deploy to preview (temporary URL)
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs [deployment-url]

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Link local project to Vercel project
vercel link

# Pull environment variables locally
vercel env pull
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [NewsAPI Documentation](https://newsapi.org/docs)
