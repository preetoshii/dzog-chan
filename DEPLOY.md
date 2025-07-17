# Deploying to GitHub Pages

Since your OAuth token doesn't have workflow permissions, here's how to deploy manually:

## Option 1: Deploy via GitHub UI (Recommended)

1. Go to your repository: https://github.com/preetoshii/dzog-chan
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "GitHub Actions"
5. Copy the workflow file from `.github/workflows/deploy.yml` and commit it via GitHub's web interface
6. Add your OpenAI API key as a repository secret:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_OPENAI_API_KEY`
   - Value: Your OpenAI API key

## Option 2: Deploy Manually

1. Build locally:
   ```bash
   npm run build
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to package.json scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

## Option 3: Use Vercel/Netlify (Easiest)

1. Go to https://vercel.com or https://netlify.com
2. Import your GitHub repository
3. Add environment variable: `VITE_OPENAI_API_KEY`
4. Deploy!

The app will be available at:
- GitHub Pages: https://preetoshii.github.io/dzog-chan/
- Vercel: https://dzog-chan.vercel.app
- Netlify: https://dzog-chan.netlify.app