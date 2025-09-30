# 🔐 GitHub Secrets Setup Guide

This guide will help you configure the necessary secrets in your GitHub repository to enable the full CI/CD pipeline.

## Required Secrets

### 🌐 **Deployment Secrets**

#### For Vercel Deployment
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or use existing one
3. Go to Settings → General → Project ID (copy this)
4. Go to Account Settings → Tokens → Create new token
5. Add these secrets to your GitHub repository:

```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here
```

#### For Netlify Deployment (Alternative)
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Go to User Settings → Applications → Personal Access Tokens
3. Create new access token
4. Add this secret:

```
NETLIFY_AUTH_TOKEN=your_netlify_token_here
```

### 🔒 **Security Scanning Secrets**

#### Snyk Security Scanning
1. Go to [Snyk.io](https://snyk.io/)
2. Create account and get API token
3. Add secret:

```
SNYK_TOKEN=your_snyk_token_here
```

#### CodeCov Coverage Reporting
1. Go to [Codecov.io](https://codecov.io/)
2. Connect your GitHub repository
3. Get the upload token
4. Add secret:

```
CODECOV_TOKEN=your_codecov_token_here
```

### 🚀 **Lighthouse CI Token (Optional)**
1. Install Lighthouse CI GitHub App
2. Get the token from the app
3. Add secret:

```
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token_here
```

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact name shown above

## 🛠️ Setting Up GitHub Actions

1. **Enable Actions**: Go to repository Settings → Actions → General
2. **Set Permissions**: Allow GitHub Actions to create and approve pull requests
3. **Configure Workflow Permissions**: Set to "Read and write permissions"

## 🌐 Quick Deployment Setup

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login and setup
vercel login
vercel --prod

# Get project details for secrets
vercel project ls
```

### Option 2: Netlify
```bash
# Install Netlify CLI  
npm i -g netlify-cli

# Login and setup
netlify login
netlify init
netlify deploy --prod --dir=dist/angular-expense-tracker/browser
```

## 🔍 Validating Setup

After adding secrets, push a commit to trigger the pipeline:

```bash
git add .
git commit -m "feat: activate CI/CD pipeline"
git push origin main
```

## 📊 Monitoring Your Pipeline

1. **GitHub Actions**: Repository → Actions tab
2. **Vercel Deployments**: [Vercel Dashboard](https://vercel.com/dashboard)
3. **Security Scans**: Repository → Security tab
4. **Coverage Reports**: Check Codecov dashboard

## 🚨 Troubleshooting

### Common Issues:

1. **Secret Not Found**: Check secret names match exactly (case-sensitive)
2. **Permission Denied**: Ensure GitHub Actions has proper permissions
3. **Build Failures**: Check Actions logs for detailed error messages
4. **Deployment Issues**: Verify platform-specific configuration files

### Quick Fixes:

```bash
# Test build locally first
npm run build:prod

# Test with Docker (if available)
docker build -t test-app .

# Run security audit
npm audit --audit-level=high
```

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review platform-specific documentation
3. Ensure all secrets are properly configured
4. Test deployments manually first

---

**🎉 Once configured, your pipeline will automatically:**
- ✅ Run tests on every push/PR
- 🔒 Scan for security vulnerabilities  
- 🚀 Deploy to production on main branch
- 📊 Monitor performance and bundle size
- ♿ Check accessibility compliance