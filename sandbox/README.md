Luminara sandbox
================

This folder contains a tiny sandbox/demo for local development. It's intended to be ignored from the package and from git.

How to run

- Open `sandbox/index.html` with a local static server. For example:

```powershell
npx serve sandbox
```

- Click "Run demo" to perform a sample request. The demo builds a `LuminaraClient` with a small browser driver and prints the response.

Notes
- This sandbox is intentionally simple and uses `fetch` directly so you can run it from a static server.
- It's excluded by `.gitignore` so it won't be published as part of the npm package or pushed to the main repository.
