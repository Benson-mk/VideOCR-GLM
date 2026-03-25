# Constants Management

Environment variables configured in `.env` files under the `/config` directory can be accessed via `import.meta.env.xxx` in Vite projects. However, if you need to migrate build tools later, such as reverting to Webpack, you would need to roll back to `process.env`, which is a high migration cost for large projects.

Therefore, it is recommended to uniformly encapsulate constants in the project and maintain them in the constants directory.

```diff
# If originally judging directly through variables on `import.meta`
-const isDev = import.meta.env.MODE === 'dev'

# Now change to use constants for judgment
+import { ENV_MODE } from '@/constants'
+const isDev = ENV_MODE === 'dev'
```

In addition, some environment variables are configured separately for different environments like `dev` / `prod`. They may be configured in `.env.dev` for the development environment, but forgotten in `.env.prod`, which will cause production accidents after going online. When encapsulating, you can also do fault tolerance handling:

```ts
// @/constants/index.ts

// API gateway domain
// Prevent forgetting to configure variables in production environment, set it to default to production gateway
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://example.com'
```
