# 🚀 Deployment Guide

This guide will help you deploy your WebRTC Camera Stream application to production.

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render account (for backend)

## Step 1: Prepare Your Repository

1. **Initialize Git repository**:
```bash
cd webrtc
git init
git add .
git commit -m "Initial commit: WebRTC camera streaming app"
```

2. **Create GitHub repository** and push your code:
```bash
git remote add origin https://github.com/yourusername/webrtc-camera-stream.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `webrtc-signaling-server`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
   
6. **Deploy** and copy the service URL (e.g., `https://webrtc-signaling-server.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SIGNALING_SERVER_URL=https://your-render-app.onrender.com
   ```

6. **Deploy** and copy the app URL (e.g., `https://webrtc-camera-stream.vercel.app`)

## Step 4: Update Environment Variables

### Update Backend Environment Variables in Render:
```
NODE_ENV=production
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

### Update Frontend Environment Variables in Vercel:
```
NEXT_PUBLIC_SIGNALING_SERVER_URL=https://your-actual-render-url.onrender.com
```

## Step 5: Test Your Deployment

1. **Visit your Vercel app URL**
2. **Create a new session**
3. **Test QR code scanning with your phone**
4. **Verify video streaming works**

## 🔧 Troubleshooting

### Common Issues:

**CORS Errors**
- Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly
- Check that both apps are using HTTPS

**Camera Access Issues**
- HTTPS is required for camera access in production
- Both Vercel and Render provide HTTPS by default

**Connection Failures**
- Verify environment variables are set correctly
- Check browser developer tools for error messages
- Ensure both services are running

**Render Free Tier Limitations**
- Services may sleep after 15 minutes of inactivity
- First request after sleeping may take 30+ seconds
- Consider upgrading to paid tier for production use

## 📱 Testing Checklist

- [ ] Home page loads
- [ ] Session creation works
- [ ] QR code generates
- [ ] Phone can access stream URL
- [ ] Camera permission request works
- [ ] Video stream displays on viewer
- [ ] Camera switching works (mobile)
- [ ] Disconnect/reconnect handling

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployment:

- **Vercel**: Automatically deploys on push to main branch
- **Render**: Automatically deploys on push to main branch

Your app will be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

## 🌟 Next Steps

After successful deployment, consider:

1. **Custom Domain**: Configure custom domains in Vercel/Render
2. **Analytics**: Add analytics to track usage
3. **Error Monitoring**: Implement error tracking (Sentry, etc.)
4. **Performance**: Monitor and optimize performance
5. **Scaling**: Upgrade to paid tiers for better performance

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review browser developer tools
3. Check Render/Vercel logs
4. Ensure all environment variables are correct
