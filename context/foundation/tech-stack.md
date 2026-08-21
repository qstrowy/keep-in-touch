---
starter_id: 10x-astro-starter
package_manager: npm
project_name: keep-in-touch
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: true
  has_background_jobs: false
---

## Why this stack

KeepInTouch is a small, solo-built web app with a three-week after-hours MVP budget, passwordless authentication, and synchronous AI-assisted note extraction. The 10x Astro Starter is the vetted JavaScript/TypeScript default for this product shape and provides an opinionated, typed application foundation with authentication, data access, and Cloudflare deployment already integrated. The external model call will be added manually and awaited within the request; durable background jobs are not required for the MVP. Cloudflare Pages is the starter's default deployment target, while GitHub Actions and automatic deployment after merges keep the delivery loop short.
