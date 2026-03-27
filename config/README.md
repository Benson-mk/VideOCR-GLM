# Environment Variable Configuration

Vite supports specifying the current environment through the `--mode` parameter when starting the service or building, which is very friendly for business scenarios that often have different environments such as development, testing, and production.

## Official Documentation

- [Environment Variables and Modes](https://vitejs.dev/guide/env-and-mode.html)

## File Naming Rules

If there is only a single environment, you can use only the `.env` file, and write all configurations here.

If there are multiple environments, you can add environment suffixes. For example, `.env.dev` is only for the development environment. When using the `vite --mode dev` command, in addition to loading the `.env` file, the `.env.dev` file will also be loaded.

When `.env` and `.env.dev` have the same configuration, the configuration in `.env.dev` has higher priority.

Currently, configuration files and running commands for three environments are reserved as follows:

| Filename | Purpose | Service Start Command | Build Command |
| :-------: | :----------------: | :--------------: | :----------------: |
|   .env    | Common environment variable management |                  |
| .env.dev  | Development environment |   npm run dev    | npm run build:dev  |
| .env.test | Testing environment | npm run dev:test | npm run build:test |
| .env.prod | Production environment | npm run dev:prod |   npm run build    |

## Adding Other Environments

Add environment files according to the [File Naming Rules](#file-naming-rules), for example, add a `.env.uat` configuration for the UAT environment.

Open the `package.json` file in the project root directory and add the corresponding script commands in `scripts`:

```json
{
  "scripts": {
    "dev:uat": "vite --mode uat --host",
    "build:uat": "vue-tsc --noEmit && vite --mode uat build"
  }
}
```

In this way, running `npm run dev:uat` on the command line can start the UAT environment service, and the same applies to building.

## Configuration Variables

By default, all variables must start with `VITE_` to be exposed to code processed by Vite.

For example, `VITE_API_BASE_URL=https://api.github.com` can be accessed through `import.meta.env.VITE_API_BASE_URL`.

## VideOCR-GLM Project Configuration Description

### Common Configuration (.env)

| Variable Name | Description | Default Value |
|--------|------|--------|
| `VITE_APP_DEFAULT_THEME` | Application default theme (light/dark) | light |
| `VITE_APP_NAME` | Product name | VideOCR-GLM |
| `VITE_APP_TITLE` | Website title | VideOCR-GLM - Video Subtitle Recognition Tool |
| `VITE_APP_DESC` | Website description | Video subtitle recognition and extraction tool based on GLM model |
| `VITE_APP_KEYWORDS` | Website keywords | VideOCR,GLM,Video Recognition,Subtitle Extraction,OCR |

### Development Environment Configuration (.env.dev)

| Variable Name | Description | Default Value |
|--------|------|--------|
| `VITE_API_BASE_URL` | Backend API gateway address | http://localhost:5001 |
| `VITE_STORAGE_PREFIX` | Local storage prefix | videocr-glm-dev |

### Testing Environment Configuration (.env.test)

| Variable Name | Description | Default Value |
|--------|------|--------|
| `VITE_API_BASE_URL` | Backend API gateway address | http://test-api.videocr-glm.com |
| `VITE_STORAGE_PREFIX` | Local storage prefix | videocr-glm-test |

### Production Environment Configuration (.env.prod)

| Variable Name | Description | Default Value |
|--------|------|--------|
| `VITE_API_BASE_URL` | Backend API gateway address | https://api.videocr-glm.com |
| `VITE_STORAGE_PREFIX` | Local storage prefix | videocr-glm-prod |

## Usage Examples

### Accessing Environment Variables in Code

```typescript
// Get API base URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

// Get application configuration
const appName = import.meta.env.VITE_APP_NAME
const appTitle = import.meta.env.VITE_APP_TITLE

// Get default theme
const defaultTheme = import.meta.env.VITE_APP_DEFAULT_THEME
```

### Using in Vite Configuration

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    base: env.VITE_DEPLOY_BASE_URL,
    // Other configurations...
  }
})
```

## Important Notes

1. **Security**: Do not store sensitive information (such as API keys, passwords, etc.) in `.env` files, as these files will be committed to the version control system.

2. **Environment Variable Priority**: Environment-specific configuration files (such as `.env.dev`) will override variables with the same name in `.env`.

3. **Variable Naming**: All variables to be used in client-side code must start with `VITE_`.

4. **Type Definitions**: It is recommended to add type definitions for environment variables in `src/types/env.d.ts` to get better TypeScript support.

5. **Restart Service**: After modifying `.env` files, you need to restart the development server for the changes to take effect.

## Backend Environment Variables

The backend service (Express) uses Node.js's `process.env` to access environment variables. You can create a `.env` file in the project root directory (which will not be committed to Git), or set it through system environment variables:

```bash
# Backend service port
PORT=5001

# Other backend configurations...
```

Refer to the `.gitignore` file to ensure that sensitive environment variable files are not committed to the version control system.