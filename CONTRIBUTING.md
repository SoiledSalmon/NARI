# Contributing to NARI

We welcome contributions to NARI! Whether you are fixing a bug, adding a feature, or improving documentation, your help is appreciated.

## 🤝 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/nari.git
   ```
3. **Create a new branch** for your work. Use descriptive names:
   - `feat/add-new-sensor`
   - `fix/calibration-logic`
   - `docs/update-setup-guide`

## ⚙️ Quick Setup

We provide setup scripts to initialize the development environment:

**On Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

**On Linux/macOS (Bash):**
```bash
chmod +x ./setup.sh
./setup.sh
```

These scripts configure a Python virtual environment, install dependencies, and create template environment files.

## 🧪 Running Tests

Before submitting a pull request, run the end-to-end integration test suite to verify onboarding and sensor pipelines:

1. Start the FastAPI backend:
   ```bash
   .\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --port 8000
   ```
2. Start the Expo web frontend (on port 8081):
   ```bash
   cd frontend
   npm run web -- --port 8081
   ```
3. Run the E2E Playwright verification script:
   ```bash
   .\.venv\Scripts\python.exe scratch/e2e_test.py
   ```

Make sure the tests run successfully and all assertions pass.

## 💬 Commit Messages

We use **Conventional Commits** to keep our history readable and automate changelogs. Please format your commit messages as follows:

- `feat:` — A new feature
- `fix:` — A bug fix
- `docs:` — Documentation changes
- `style:` — Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor:` — A code change that neither fixes a bug nor adds a feature
- `perf:` — A code change that improves performance
- `test:` — Adding missing tests or correcting existing tests
- `chore:` — Changes to the build process or auxiliary tools and libraries

Example: `feat: implement SOS countdown animation`

## 🚀 Pull Request Process

1. **Keep PRs focused**. Large, cross-cutting PRs are harder to review and may be split.
2. **Update tests**. Ensure that your changes are covered by appropriate unit or integration tests.
3. **Run lints**. Before submitting, run `npm run lint` and `npx tsc --noEmit`.
4. **Link issues**. Reference any related issues in your PR description (e.g., `Fixes #123`).
5. **Wait for review**. A maintainer will review your PR. We aim to provide feedback within 2-3 business days.

## 📜 Code of Conduct

Please be respectful and professional in all interactions within the NARI community. We are committed to providing a safe and inclusive environment for everyone.

## 🛡️ Security

If you discover a security vulnerability, please do **not** open a public issue. Instead, email us at [security@nari-app.org](mailto:security@nari-app.org) (placeholder) or contact a maintainer directly.
