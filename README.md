# 🌌 Luminara

**Luminara** is a tiny, extensible HTTP client built on top of [ofetch](https://github.com/unjs/ofetch).  
It works seamlessly in both **React (browser)** and **Node.js** environments, providing a minimal yet powerful foundation for data fetching — with built-in plugin support for retries, debouncing, interceptors, and more.

---

## ✨ Features

- 🌍 Universal — works in Browser, Node.js, and Serverless environments  
- ⚡ Based on modern native `fetch` (via `ofetch`)  
- 🔌 Plugin architecture (add retries, interceptors, rate-limiters, etc.)  
- 💎 Tiny footprint (~1KB + ofetch)  
- 🪶 Zero dependencies besides `ofetch`  
- 🔁 Fully promise-based and type-friendly  

---

## 📦 Installation

```bash
# npm
npm install luminara

# or yarn
yarn add luminara

# or pnpm
pnpm add luminara
```

> **Requirements:**  
> Node.js **v18+** or any modern browser.  
> For Node < 18, add `undici` and polyfill global fetch:
> ```js
> import { fetch } from "undici";
> globalThis.fetch = fetch;
> ```

---

## 🚀 Quick Start

### Create a Luminara instance

```js
import { createLuminara } from "luminara";

const api = createLuminara();

// Basic GET
const res = await api.get("https://jsonplaceholder.typicode.com/users");
console.log(res.data);

// POST example
await api.post("https://jsonplaceholder.typicode.com/posts", {
  title: "Luminara",
  body: "Hello world!",
  userId: 1
});
```

---

## ⚙️ Adding Plugins

Luminara is designed around a **plugin pipeline** similar to middleware.  
You can intercept requests, transform responses, or handle errors globally.

```js
api.use({
  onRequest(req) {
    console.log("➡️ Requesting:", req.url);
    return {
      ...req,
      headers: { ...(req.headers || {}), Authorization: "Bearer TOKEN_123" }
    };
  },
  onSuccess(res) {
    console.log("✅ Success:", res.status);
    return res;
  },
  onError(err, req) {
    console.error("❌ Error fetching:", req.url, err.message);
  }
});
```

Now, every request passing through `api` will automatically trigger those hooks.

---

## 🌈 Example in React

```jsx
import { useEffect, useState } from "react";
import { createLuminara } from "luminara";

const api = createLuminara();

export default function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("https://jsonplaceholder.typicode.com/users")
       .then(res => setUsers(res.data))
       .catch(err => console.error(err));
  }, []);

  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
```

---

## 🧩 Project Structure

```
luminara/
  src/
    index.js              # entry point
    core/
      driver.js           # generic driver interface
      luminara.js         # core client + plugin system
    drivers/
      ofetch.js           # default driver
  package.json
  README.md
  LICENSE
```

---

## 🪄 Future Add-ons

Luminara’s roadmap includes:

- [ ] Retry with exponential backoff  
- [ ] Request debouncer (per key)  
- [ ] Rate limiter (token bucket)  
- [ ] Cache adapter (localStorage / memory)  
- [ ] Request tracing and metrics  
- [ ] Configurable interceptors  

---

## 🧠 License

MIT © 2025 Jonathan Miller  
Includes portions of [ofetch](https://github.com/unjs/ofetch) (MIT License)

---

## 🪐 Name Origin

**Luminara** — derived from “lumen” (light) — symbolizes clarity and adaptability.  
A library that brings *light* to the world of fetching: minimal yet full of potential.