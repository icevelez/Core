# What is Core Assist?

## Overview

Core Assist is a companion library for Core that extends Core by turning runtime compilation into a largely one-time cost, allowing components to remain deployable runtime resources while benefiting from persistent browser-side compilation caching.

Core normally compiles components at runtime like so:

```
Component Request
        ↓
Fetch Component
        ↓
Parse Template
        ↓
Generate Render Code
        ↓
Inject Render Code
        ↓
Import Modified Module
```

This process is already fast enough and is one of the foundations of Core's browser-first philosophy.

However, some applications may benefit from avoiding repeated compilation work entirely.

Core Assist provides a mechanism for caching compiled components so that subsequent requests can reuse previously generated modules.

> [!NOTE]
> Core Assist is an optional library and is not required to use Core.
>
> Applications that do not use Core Assist continue to use Core's standard runtime compilation behavior.

---

## Installation

> [!IMPORTANT]
> You must download and place `core-assist.js` and `core-worker.js` at the same folder as your HTML app entry point which is usually `index.html` 

To enable Core Assist, first register the library in your import map:

```html
<script type="importmap">
{
    "imports": {
        "core/handlebar": "./core/parser/handlebar.js",
        "core": "./core/runtime.js",
        "core-assist": "./core-assist.js"
    }
}
</script>
```

Then initialize Core Assist before loading any Core components:

```html
<script type="module">
    import { component } from "core/handlebar";
    import { mount } from "core";
    import { start_core_assist } from "core-assist";

    await start_core_assist();

    const App = await component("./src/App.html");
    mount(App, "#app");
</script>
```

A complete example:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Core Application</title>
    </head>
    <body>
        <div id="app"></div>

        <script type="importmap">
        {
            "imports": {
                "core/handlebar": "./core/parser/handlebar.js",
                "core": "./core/runtime.js",
                "core-assist": "./core-assist.js"
            }
        }
        </script>

        <script type="module">
            import { component } from "core/handlebar";
            import { mount } from "core";
            import { start_core_assist } from "core-assist";

            await start_core_assist();

            const App = await component("./src/App.html");
            mount(App, "#app");
        </script>
    </body>
</html>
```

---

## What `start_core_assist()` Does

Calling `start_core_assist()` initializes the Core Assist runtime.

This includes:

* Registering the Service Worker
* Establishing communication channels
* Initializing the component cache
* Enabling component cache lookups
* Enabling background cache validation

```js
await start_core_assist();
```

Core Assist should be started before loading any Core components so that component requests can immediately participate in the caching workflow.

---

## Why Core Assist Exists

One [drawback of runtime compilation](https://youtu.be/ANtSWq-zI0s?si=m3BjuOcvLPdA0uo5&t=1759) is that compilation work happens in the browser.

While Core intentionally embraces runtime compilation, the reality is that a component only needs to be compiled once before its generated output can be reused.

Core Assist takes advantage of this observation.

Instead of repeatedly processing the same component:

```
Visit #1
========
Compile Component

Visit #2
========
Compile Component Again

Visit #3
========
Compile Component Again
```

Core Assist changes the workflow to:

```
Visit #1
========
Compile Component
Store Compiled Result

Visit #2
========
Load Compiled Result

Visit #3
========
Load Compiled Result
```

The browser effectively becomes its own compilation cache.

---

## How It Works

When a Core component is requested, Core Assist first checks whether a compiled version already exists.

### Cache Hit

If a compiled module is found:

```text
Component Request
        ↓
Cache Hit
        ↓
Return Compiled Module
```

The runtime compiler is skipped entirely.

No template processing occurs.

No render function generation occurs.

No additional network request is required.

---

### Cache Miss

If no compiled version exists:

```text
Component Request
        ↓
Cache Miss
        ↓
Fetch Component
        ↓
Compile Component
        ↓
Generate Module
        ↓
Store Compiled Module
        ↓
Return Compiled Module
```

The generated module is then available for future requests.

---

## Service Worker Integration

Core Assist uses a Service Worker to persist compiled modules.

The Service Worker acts as a local compilation cache.

```text
Core Component
        ↓
Compile
        ↓
Core Assist Runtime
        ↓
Broadcast Channel
        ↓
Service Worker
        ↓
Store Compiled Module
```

Future component requests can then be resolved directly from the cached module.

```text
Component Request
        ↓
Service Worker
        ↓
Compiled Module
```

This avoids:

* Additional network requests
* Template parsing
* Render code generation
* Runtime compilation

---

## Communication

Core Assist communicates with the Service Worker through the browser's Broadcast Channel API.

```text
Core Assist Runtime
        ↓
Broadcast Channel
        ↓
Core Worker (Service Worker)
```

This allows component compilation and cache management to remain isolated from the application code.

---

## Cache Validation

Core Assist can validate cached modules against the original component source.

When a component changes:

```text
Component Updated
        ↓
Cache Invalidated
        ↓
Recompile on next request
        ↓
Store Updated Module
```

This ensures that cached modules remain synchronized with the component source.

---

## Benefits

Core Assist provides several advantages:

### Faster Subsequent Loads

Previously compiled components can be loaded immediately.

### Reduced CPU Work

Template processing and render code generation are skipped.

### Reduced Network Requests

Compiled modules can be served directly from the local cache.

### Optional

Applications that prefer Core's standard runtime compilation can continue using it without modification.

---

## Design Philosophy

Core Assist exists for developers who want some of the benefits traditionally associated with build tools while preserving Core's browser-first development experience.

The goal is not to replace runtime compilation.

The goal is to make runtime compilation a one-time cost whenever possible.

In other words:

> Compile once, reuse many times.

Core Assist allows the browser itself to become the compilation cache, reducing repeated work while remaining fully compatible with Core's runtime-driven architecture.
