## Components as Runtime Resources

Core treats components not as files that must be compiled before deployment, but as **runtime resources** that can be loaded, executed, and composed directly in the browser.

Unlike traditional frontend frameworks, where components are transformed into static JavaScript bundles during build time, Core preserves the original component structure as a deployable unit.

This means a component is not something that is compiled away — it is something that remains **addressable, retrievable, and executable at runtime**.

```
Component Source (.html / Core SFC)
        ↓
Deployed as-is
        ↓
Loaded by the browser
        ↓
Compiled at runtime
        ↓
Executed as UI
```

In this model, components behave more like web-native resources rather than precompiled application code.

---

## Core Idea: Components Are Addressable

A Core component is referenced by a URL:

```js
await component("/components/UserCard.html");
```

This makes components:

* Fetchable
* Cacheable
* Shareable
* Replaceable
* Dynamically loadable

In essence, a component behaves like a **runtime module exposed over HTTP** rather than a static compile-time application code.

---

## Without Core Assist: Runtime Resource Model

Even without Core Assist, Core already enables this model:

```text
Request Component
      ↓
Fetch Source
      ↓
Compile in Browser
      ↓
Execute
```

This allows applications to:

* Load components dynamically
* Compose UI at runtime
* Introduce new UI behavior without rebuilding the application

However, each load may involve repeated compilation work.

---

## With Core Assist: Persistent Resource Optimization

Core Assist extends this model by introducing a persistent compilation layer.

Instead of treating compilation as a repeated runtime cost, Core Assist treats it as a **one-time transformation per component per client**.

```
First Load
==========
Component Source
      ↓
Compile
      ↓
Store Compiled Module

Subsequent Loads
=================
Fetch Compiled Module
      ↓
Execute Immediately
```

This transforms components into **self-optimizing runtime resources**.

The more a component is used, the more efficient it becomes.

---

## Key Insight: Distribution vs Optimization

The core distinction is:

### Traditional frameworks

Components are **precompiled application code**

```
Source → Build → JavaScript Bundle → Deploy
```

Once deployed, the original component no longer exists in a usable form.

---

### Core (without Assist)

Components are **distributed as runtime resources**

```
Source → Deploy → Browser Compiles → Execute
```

The browser always retains the ability to interpret components.

---

### Core + Core Assist

Components become **adaptive runtime resources**

```text
Source → Deploy → Compile → Cache → Reuse → Optimize Over Time
```

This introduces an additional property:

> Component performance improves with usage.

---

## Why This Matters

This model enables a different class of applications:

### 1. Runtime-extensible systems

Applications can accept new components after deployment:

* CMS-driven UI systems
* Plugin architectures
* User-generated interfaces

---

### 2. Distributed UI ecosystems

Components can be shared like resources:

* Hosted on URLs
* Loaded on demand
* Cached per client
* Reused across sessions

---

### 3. Progressive optimization

Unlike build-time frameworks where optimization happens once at build time, Core shifts optimization into runtime:

* First use: compilation cost
* Future use: zero compilation cost
* Repeated use: fully cached execution

---

## Philosophical Shift

Core introduces a shift from:

> “UI is something you build and ship”

to:

> “UI is something you distribute and execute”

Core Assist extends this further:

> “UI is something that improves in performance the more it is used”

---

## Summary

Core treats components as first-class runtime resources.

Core Assist transforms those resources into **self-optimizing entities** by introducing persistent compilation caching in the browser.

Together, they form a model where:

* Components remain deployable after shipping
* Components remain executable in their original form
* Components become faster over time through caching
