---
starter_id: 10x-astro-starter
package_manager: npm
project_name: keep-in-touch
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-workers
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

KeepInTouch is a small, solo-built web app with a three-week after-hours MVP budget, passwordless authentication, and synchronous AI-assisted note extraction. The scaffold has been upgraded to the security-patched Astro 7 line with React 19, Supabase, and the Astro Cloudflare adapter. The external model call will be added manually and awaited within the request; durable background jobs are not required for the MVP. Cloudflare Workers is the deployment target, Cloudflare Workers Builds deploys merges to `main`, and GitHub Actions remains the validation pipeline.
