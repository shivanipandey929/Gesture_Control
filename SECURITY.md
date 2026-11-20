# Security Policy

## Credentials and Secrets
- **Never commit `.env`**: `.env` contains local secrets and must never be checked into version control. It is explicitly ignored via `.gitignore`.
- **Client-Side Keys**: In the frontend application, only Supabase publishable / anon keys are utilized. Never expose or use the Supabase `service_role` key in frontend client bundles.
- **Client-Side Vision Privacy**: Video frames from `navigator.mediaDevices.getUserMedia` are processed in client-side WebAssembly memory buffers and never transmitted over the network.
- **Reporting Vulnerabilities**: If you discover a security concern, please submit a responsible disclosure report via GitHub Security Advisories.

