# Core v0.5.0

Core v0.5.0 focuses on improving the component architecture, rendering pipeline, and overall developer experience. While many of Core's foundational features such as fine-grained reactivity and runtime template compilation already existed in previous releases, this release refines how those systems work together and introduces new capabilities for building larger applications.

---

## Added

### HTML Components

HTML Components are now the primary way of building applications in Core.

```html
<script>
    export default function() {
    }
</script>

<div>
    Hello World
</div>
```

Components can encapsulate their own state, template, lifecycle hooks, and imported components within a single file.

---

### Component Imports

Added support for importing components directly from HTML files.

```js
import { component } from "core/handlebar";

export const UserCard = component("./UserCard.html");
```

Exported component declarations are automatically discovered and made available to the current template.

---

### Context Hooks

Added support for component context.

```js
set_context(key, value);
get_context(key);
```

Context allows values to be shared throughout a component hierarchy without passing them through every level using props.

---

### Component Cache

Components loaded through:

```js
component("./Component.html");
```

are now cached internally.

Subsequent requests for the same component reuse the previously processed render function rather than re-fetching and recompiling the component.

This behavior is similar to how native ES module imports are evaluated only once.

---

## Changed

### Rendering Pipeline Redesign

The internal rendering pipeline has been redesigned.

Instead of generating render functions entirely outside the component scope, Core now injects generated render code directly beneath the component's user code during compilation.

Conceptually:

```js
export default function() {
    const [count, setCount] = signal(0);

    // Generated render code injected here
}
```

This allows generated render instructions to naturally access component variables without additional scope management mechanisms.

Benefits include:

* Simpler generated code
* Native JavaScript scoping
* Reduced runtime complexity
* Improved maintainability of generated render functions

The final rendering behavior remains unchanged, but the internal architecture is significantly simpler.

---

### Component Resolution

Component loading now resolves exported component declarations concurrently.

When multiple components are exported:

```js
export const Header = component("./Header.html");
export const Sidebar = component("./Sidebar.html");
export const Footer = component("./Footer.html");
```

Core batches all component promises and resolves them together before rendering.

This reduces component startup overhead and improves loading efficiency.

---

## Documentation

Documentation has been substantially expanded and rewritten.

New documentation includes:

* Getting Started
* Browser-First Philosophy
* Template Syntax
* Introduction to Signals
* Derived Values
* Event Handling
* Form Input Bindings
* Introduction to Effects
* Composable Behaviors
* Component Basics
* Context Hooks

The documentation now better reflects Core's goals and intended use cases.

---

## Philosophy

Core continues to pursue a browser-first approach to frontend development.

Rather than requiring a mandatory build pipeline, Core embraces modern browser capabilities while still providing a component model, reactive state management, and runtime template compilation suitable for building modern web applications.

This release represents an important step toward making those capabilities easier to understand, easier to adopt, and easier to scale.
