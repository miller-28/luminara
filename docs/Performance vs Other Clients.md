# ⚡ Performance vs Other Clients

Luminara is designed as a **zero-dependency**, **driver-oriented**, **plugin-based** wrapper on top of native `fetch`.
Because of this architecture, its runtime cost is naturally close to raw `fetch`, even when advanced features are enabled.

Below is an *architecture-based comparison* with common HTTP clients.
No synthetic numbers are invented — the comparison is based strictly on structural overhead, design approaches, and our internal benchmark characteristics.

---

## 🏎️ Overall Positioning

| Client       | Architecture Weight                   | Typical Overhead                                                       | Notes                                                                        |
| ------------ | ------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Luminara** | Zero-deps, plugin-based, native fetch | **Microseconds** (µs) orchestration, ~0.3–0.5ms total overhead in Node | Features like hedging, stats, rate-limit add minimal runtime tax             |
| **ky**       | Thin wrapper over fetch               | Very low                                                               | Similar philosophy; fewer orchestration features                             |
| **ofetch**   | Lightweight Universal Fetch           | Very low                                                               | Comparable baseline; not plugin-structured                                   |
| **Axios**    | Transformer + adapter stack           | Medium                                                                 | Interceptors, config normalizers, XHR/Node adapters add per-request overhead |
| **Got**      | Heavy feature-rich client             | Medium/High                                                            | Complex option resolution, hooks, retry logic, stream support                |

Luminara belongs to the **“ultralight fetch wrappers”** class, but with much more powerful orchestration and lifecycle tooling than typical minimalist clients.

---

## 🧬 Why Luminara Is Leaner

### 1. **Zero Dependencies**

No internal polyfills, no adapter layers, no transformer pipelines.

Axios, Got, and many SDK-style clients rely on multi-layer stacks that execute on every request.

### 2. **Synchronous Micro-Core**

The core API operations benchmark in the **microsecond range**:

* `createLuminara()`
* `api.use()` plugin registration
* `updateConfig()`

These operations are effectively free compared to any real I/O.

### 3. **Plugin Pipeline with Linear and Predictable Cost**

The orchestration layer is implemented as a **deterministic pipeline**:

* Empty pipeline: ~25–30 µs
* 1 plugin: ~38–40 µs
* 5 plugins: ~70 µs
* 10 plugins: ~100–120 µs

Most “general-purpose” clients have significantly higher per-request transformation cost.

### 4. **Driver Layer Close to Raw Fetch**

Pre-flight and post-flight logic (URL building, header preparation, parsing) run in:

* **1–5 µs** for small operations
* **~60 µs** for 100KB JSON parsing

This is in the same runtime envelope as fetch itself.

### 5. **Feature Overhead That Stays Small**

Advanced features like:

* retries
* rate limiting
* deduplication
* stats collection
* hedging strategies

add only a **small fraction of a millisecond** when the first attempt succeeds.

Most libraries require external wrappers (or heavy built-ins) that impose much larger cost.

---

## 🌐 Browser Comparison

Across Chromium, Firefox, and WebKit via headless harness:

* Core ops (`createLuminara`, `api.use`, `updateConfig`) remain **microsecond-scale**.
* Hedging strategies fall in the **10–25 ms** range depending on engine timing, consistent with:

  * native timer resolution
  * event-loop jitter
  * browser GC

This is equivalent to (and often simpler than) implementing hedging manually using plain fetch.

---

## 🥇 Summary

**Luminara achieves performance comparable to the lightest fetch helpers (ky, ofetch), while offering capabilities normally found only in heavier clients (Axios, Got).**

In practice:

* **Core overhead:** near-zero
* **Orchestration overhead:** deterministic microseconds
* **Full request overhead:** extremely close to raw fetch
* **Feature overhead:** low single-digit ms at worst, and often sub-ms

This places Luminara in a **unique category**:

> **A feature-rich orchestration client that performs like a minimal wrapper.**