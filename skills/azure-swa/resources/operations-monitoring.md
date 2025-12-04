# Custom Domains, SSL, Monitoring & Troubleshooting

## Custom Domains and SSL

### Adding Custom Domain

**Via Azure Portal:**
1. Navigate to Static Web App
2. Settings → Custom domains
3. Click "Add"
4. Enter domain name
5. Follow DNS verification steps

**Via Azure CLI:**

```bash
# Add custom domain
az staticwebapp hostname set \
  --name my-static-app \
  --hostname www.example.com

# List custom domains
az staticwebapp hostname list \
  --name my-static-app

# Delete custom domain
az staticwebapp hostname delete \
  --name my-static-app \
  --hostname www.example.com
```

### DNS Configuration

**For root domain (example.com):**
- Type: `ALIAS` or `ANAME`
- Value: `<app-name>.azurestaticapps.net`

**For subdomain (www.example.com):**
- Type: `CNAME`
- Value: `<app-name>.azurestaticapps.net`

**TXT Record for validation:**
- Type: `TXT`
- Name: `@` (root) or subdomain
- Value: Provided by Azure during setup

### SSL Certificates

SSL certificates are automatically provisioned and renewed by Azure (free).

- **Auto-renewal:** Yes
- **Certificate type:** Managed by Azure
- **HTTPS enforcement:** Available
- **Cost:** Free

### Enforce HTTPS

**In staticwebapp.config.json:**

```json
{
  "routes": [
    {
      "route": "/*",
      "headers": {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
      }
    }
  ]
}
```

## Monitoring and Diagnostics

### Application Insights Integration

**Enable Application Insights:**

```bash
az staticwebapp appsettings set \
  --name my-static-app \
  --setting-names \
    APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

**Custom Telemetry in Functions:**

```javascript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
const client = appInsights.defaultClient;

module.exports = async function (context, req) {
    // Track custom event
    client.trackEvent({
        name: "UserAction",
        properties: {
            action: "getData",
            user: req.headers['x-ms-client-principal-name']
        }
    });

    // Track metric
    client.trackMetric({
        name: "ProcessingTime",
        value: 123
    });

    context.res = {
        status: 200,
        body: "OK"
    };
};
```

### Viewing Logs

**Function Logs:**

```bash
# View logs via Azure CLI
az webapp log tail \
  --name <app-name> \
  --resource-group <resource-group>

# Stream logs
az staticwebapp functions stream-logs \
  --name <app-name>
```

**In Azure Portal:**
1. Navigate to Static Web App
2. Monitoring → Application Insights
3. View logs, metrics, and performance

### Health Checks

**Example health endpoint:**

```javascript
// api/health/index.js
module.exports = async function (context, req) {
    const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    };

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: health
    };
};
```

### Metrics to Monitor

- **Request count** - Traffic volume
- **Response time** - Performance
- **Error rate** - Application health
- **Function execution time** - API performance
- **Bandwidth** - Cost optimization
- **Cache hit rate** - CDN effectiveness

## Troubleshooting

### Problem: Routes not working (404 errors)

**Solution:** Check `staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,png,jpg}"]
  }
}
```

**Common causes:**
- Incorrect `navigationFallback` configuration
- Static file patterns not excluded
- Missing `staticwebapp.config.json`

### Problem: API calls failing

**Solutions:**
- Verify `api_location` in workflow
- Check `function.json` bindings
- Review API logs in Azure Portal
- Test locally with SWA CLI
- Ensure API folder structure is correct

**Debug command:**

```bash
swa start http://localhost:3000 --api-location ./api --verbose
```

### Problem: Authentication not working

**Solutions:**
- Check provider configuration in Azure Portal
- Verify redirect URLs match
- Review allowed roles in config
- Test with `/.auth/me` endpoint

**Test authentication:**

```bash
swa start http://localhost:3000 --api-location ./api --auth-tenant-id <tenant-id>
```

### Problem: Build failing in GitHub Actions

**Solutions:**
- Check `app_location` and `output_location`
- Verify Node version compatibility
- Review build logs in GitHub Actions
- Test build locally

**Verify output location:**

```bash
# Build locally
npm run build

# Check output directory
ls -la build/
```

### Problem: Environment variables not available

**Solutions:**
- Ensure variables are set in Azure
- Check naming (no `REACT_APP_` prefix in Functions)
- Restart deployment after adding variables
- Verify `local.settings.json` for local dev

**Verify variables:**

```bash
# List current settings
az staticwebapp appsettings list --name my-static-app

# Test in function
console.log('All env vars:', Object.keys(process.env));
```

### Problem: Custom domain not working

**Solutions:**
- Verify DNS propagation (can take 24-48 hours)
- Check CNAME/ALIAS record configuration
- Ensure TXT record for validation
- Review SSL certificate status

**Check DNS:**

```bash
# Check CNAME record
nslookup www.example.com

# Verify Azure DNS
nslookup <app-name>.azurestaticapps.net
```

### Problem: High latency or slow performance

**Solutions:**
- Analyze Application Insights
- Check bundle size
- Enable code splitting
- Optimize images
- Review API function performance

### Problem: "DeploymentFailed" error

**Solutions:**
- Check artifact size (must be < 100 MB)
- Verify all dependencies are available
- Review build logs for errors
- Ensure node_modules not included in output

## Debugging

### Local API Debugging

```bash
# Start with verbose logging
swa start http://localhost:3000 --api-location ./api --verbose

# View detailed logs
swa start --verbose=silly
```

### Production Debugging

1. Enable Application Insights
2. View live metrics
3. Check function logs
4. Review deployment logs

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `401` | Authentication required | Implement login flow |
| `403` | Forbidden (role not allowed) | Check user roles |
| `404` | Route not found | Verify routing config |
| `500` | Server error | Check function logs |
| `502` | Bad gateway | Check API availability |

### Logging Best Practices

```javascript
// Good logging in Azure Functions
module.exports = async function (context, req) {
    context.log('Function triggered', {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });

    try {
        // Business logic
        context.log('Operation successful');
    } catch (error) {
        context.log.error('Operation failed:', error);
        throw error;
    }
};
```

## Performance Optimization

### Frontend Optimization

```javascript
// Code splitting in React
const MyComponent = React.lazy(() => import('./MyComponent'));

// Critical CSS inline
// Non-critical CSS async
// Optimize images
// Tree shake unused code
```

### API Optimization

```javascript
// Add caching header
module.exports = async function (context, req) {
    context.res = {
        status: 200,
        headers: {
            'Cache-Control': 'public, max-age=3600'
        },
        body: data
    };
};
```

### Configuration Optimization

```json
{
  "routes": [
    {
      "route": "/api/*",
      "headers": {
        "Cache-Control": "no-cache"
      }
    },
    {
      "route": "/static/*",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  ]
}
```

