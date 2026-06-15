# Async Components

Core supports asynchronous components, allowing you to load and render components only when they are needed.

---

## Overview

In Core, components can be loaded asynchronously using `component()` and rendered conditionally using the `{{#await}}` syntax.

Since `component()` returns a Promise, Core can treat component loading as an asynchronous operation and integrate it directly into the template system.

---

## Basic Usage

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
