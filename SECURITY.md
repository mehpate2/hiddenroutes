# Security Policy

## Private Software

This is **private, proprietary software**. Do not share, fork, copy, or
redistribute without explicit written permission from the copyright holder.

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately to the
project owner. Do not open public issues for security concerns.

## Sensitive Files

The following files contain secrets and must never be committed to version control:

- `.env` — API keys and credentials
- `.env.*` — Any environment-specific overrides
- Firebase service account JSON files
- Any file named `*secret*`, `*credential*`, or `*key*`

## Environment Variables Required

| Variable | Description |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FIREBASE_ADMIN_KEY` | Firebase Admin SDK service account (base64 JSON) |

## Production Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] Firebase security rules restrict access to authenticated users
- [ ] Stripe webhook secret is configured and verified
- [ ] Firebase Admin SDK service account key is set in hosting environment
- [ ] API routes are not publicly listed or browsable
