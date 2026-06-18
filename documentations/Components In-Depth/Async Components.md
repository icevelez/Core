# Async Components

Core supports asynchronous components, allowing you to load and render components only when they are needed.

---

## Overview

In Core, components can be loaded asynchronously using `component()` and rendered conditionally using the `{{#await}}` syntax.

Since `component()` returns a Promise, Core can treat component loading as an asynchronous operation and integrate it directly into the template system.

---

## Basic Usage

We can use Core's built-in `<CoreComponent>` to load asynchronous components like so

```html
{{#await component("./Dashboard.html")}} 
    <h1>Loading dashboar</h1>
{{:then Dashboard}}
    <CoreComponent default="Dashboard"/>
{{/await}}
```

Using `<CoreComponent>` passing down props 

```html
<script>
    import { signal } from "core";
    
    export default function() {
        const [name, setName] = signal("Doe");
    }
</script>

{{#await component("./Dashboard.html")}} 
    <h1>Loading dashboar</h1>
{{:then Dashboard}}
    <CoreComponent default="Dashboard" static="John" :name="name"/>
{{/await}}
```

Using `<CoreComponent>` injecting a slot

```html
<script>
    import { signal } from "core";
    
    export default function() {
        const [name, setName] = signal("Doe");
    }
</script>

{{#await component("./Dashboard.html")}} 
    <h1>Loading dashboar</h1>
{{:then Dashboard}}
    <CoreComponent default="Dashboard">
        <h1>Element From Parent Component</h1>
    </CoreComponent>
{{/await}}
```

---

## How It Works

When Core encounters an async component:

```js
component("./Benchmark.html")
```

it begins:

```text
Fetch Component
    ↓
Parse Template
    ↓
Compile Render Function
    ↓
Resolve Promise
```

During this time, the template enters an "awaiting state".

---

## Await Block Lifecycle

The `{{#await}}` block represents the lifecycle of an asynchronous operation.

### States

#### Pending

While the component is loading:

```html
<h1>Loading component</h1>
```

#### Resolved

Once the component is ready:

```html
<CoreComponent default="Dashboard"/>
```

---

## Core Component Renderer

`<CoreComponent/>` is responsible for rendering the resolved component.

It works by:

```
Component Reference
    ↓
Resolve Render Function
    ↓
Instantiate Component
    ↓
Mount into DOM
```

---

## Why Async Components Matter

Async components allow Core to:

- Load only what is needed
- Defer expensive UI work
- Improve perceived performance
- Enable modular application architecture
- Support dynamic feature loading

---

## Security and Trust Model

Dynamic component loading introduces an important concern: **trust**.

When applications can load and execute components at runtime, those components may come from different sources such as administrators, external plugins, or user-generated content. This raises a natural question:

> How does Core decide which components are safe to execute?

Core itself does not enforce a global trust system. Instead, it relies on the application layer to define clear boundaries for what sources are allowed to provide components.

For example, a developer might explicitly allow components only from trusted origins:

```text
Trusted sources:
- Same-origin server
- Verified CDN
- Internal CMS
```

While rejecting or sanitizing unknown sources:

```text
Untrusted sources:
- User-submitted raw input
- External unknown domains
```

Since Core executes components in the browser, it is important to treat component loading similarly to any other form of dynamic code execution, such as `import()` or external scripts.

### Key Principle

Core assumes a simple responsibility boundary:

> Core executes components, but the application decides what components are allowed to be executed.

This keeps Core flexible while allowing developers to implement their own security model based on their needs, such as whitelisting, authentication checks, or signed component verification.
