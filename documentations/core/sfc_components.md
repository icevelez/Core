# Single File Components (SFC)

Core.js supports Single File Components (SFCs), allowing components to be written in a single `.html` file containing:

* component logic
* reactive state
* imports
* template markup

The format is inspired by these frameworks:

* Vue.js
* Svelte

while remaining fully browser-native without requiring:

* npm
* Vite
* Webpack
* Node.js
* build tooling

---

# Basic Structure

A Core.js SFC contains:

* a `<script>` block
* an HTML template

Example:

```html
<script>
    import { sfc } from "#/core/parser/handlebar.js";
    import { signal } from "#/core/runtime.js";

    export default class {
        count = signal(0);
    }
</script>

<h1>{{ $.count() }}</h1>
<button on:click="() => $.count.set($.count()+1)">
    Click Me
</button>
```

---

# Importing Core.js APIs

Inside the `<script>` block you may import runtime APIs:

```js
import { signal } from "#/core/runtime.js";
```

Core.js uses the `#/` alias for absolute imports because the imported script from object URLs does not have any context of its current file path nor its domain.

Example:

```text
#/core/runtime.js
↓
https://localhost:8080/core/runtime.js
```

This avoids relative import issues caused by runtime Blob module loading.

---

# Reactive State with `signal()`

Signals are the primary reactive primitive in Core.js.

Example:

```js
name = signal("John");
count = signal(0);
```

Reading a signal:

```js
$.name()
```

Updating a signal:

```js
$.count.set($.count() + 1)
```

Signals automatically update the DOM when their value changes.

---

# Component Class

Each SFC must export a default class:

```js
export default class {
    name = signal("John");
}
```

The class instance becomes the component scope.

Inside templates, the component instance is accessible using `$.`

Example:

```html
<h1>{{ $.name() }}</h1>
```

---

# Event Bindings

Core.js uses the `on:` syntax for events.

Example:

```html
<button on:click="() => $.count.set($.count()+1)">
    Click Me
</button>
```

Supported events follow standard DOM event names:

```html
on:click
on:input
on:change
on:keydown
```

---

# Text Interpolation

Dynamic expressions use Handlebars-style interpolation:

```html
<h1>Hello {{ $.name() }}</h1>
```

Expressions are evaluated reactively.

---

# Two-Way Binding

Core.js supports two-way bindings using `bind:`.

Example:

```html
<input bind:value="$.name">
```

This automatically synchronizes:

* the input value
* the signal value

---

# Importing Components

Components are imported using `sfc()`:

```js
export const Example = sfc("/sfc/Example.html");
export const Another = sfc("/sfc/Another.html");
```

Unlike traditional component registration systems, every named export is automatically treated as a component import.

This means components become immediately usable inside the template.

Example:

```html
<Example/>
<Another/>
```

---

# Passing Props

Props use the `:` prefix syntax for evaluating JS expression. Core.js would treat one without a prefix as a static value

Example:

```html
<Example :name="`${$.name()} ${$.count()}`"/>
```

```html
<Example name="Static John"/>
```

Props may contain:

* signals
* expressions
* template literals
* computed values

---

# Component Slots / Children

Components may receive child content:

```html
<Example :name="`${$.name()} ${$.count()}`">
    <h1>Hi from Parent Scope {{ $.count() }}</h1>
</Example>
```

The child content retains access to the parent scope.

---

# Full Example

```html
<script>
    import { sfc } from "#/core/parser/handlebar.js";
    import { signal } from "#/core/runtime.js";

    export const Example = sfc("/sfc/Example.html");
    export const Another = sfc("/sfc/Another.html");

    export default class {
        name = signal("John");
        count = signal(0);
    }
</script>

<button on:click="() => $.count.set($.count()+1)">
    Click Me
</button>

<input bind:value="$.name">

<h1>Hello {{ $.name() }}</h1>

<hr>

<Example :name="`${$.name()} ${$.count()}`">
    <h1>Hi from Parent Scope {{ $.count() }}</h1>
</Example>

<hr>

<Another/>
```

---

# Browser-Native Workflow

Core.js SFCs are designed around a browser-first workflow.

Applications can run directly in the browser using native ES modules:

```html
<script type="module" src="/main.js"></script>
```

No mandatory:

* bundlers
* transpilers
* package managers
* dev servers

are required.

---

## SFC Interoperability

Core.js Single File Components (SFC) are fully interoperable with traditional JavaScript-based components.

This means you can freely mix:

* `.html` SFC components loaded via `sfc()`
* standard JavaScript components created with `component()`

inside the same application.

This allows gradual adoption of SFCs without rewriting existing components.

---

# Example Structure

```text
src/
├── App.js
├── App.html
└── sfc/
    └── Example.html
```

---

# JavaScript Component (`App.js`)

```js
import { component, sfc } from "../core/parser/handlebar.js";
import { signal, load } from "../core/runtime.js";

export default component({
    template: await load("src/App.html"),
    components: {
        Example: await sfc("sfc/Example.html")
    }
}, class {

    name = signal("John");
    
});
```

---

# Parent Template (`App.html`)

```html
<h1>Hello World</h1>

<Example :name="$.name()">
    <h1>Hello from parent scope</h1>
</Example>
```

---

# SFC Component (`Example.html`)

```html
<script>
export default class {

    constructor(props) {
        this.props = props;
    }

}
</script>

<h1>Hello from Example.html — {{ $.props.name }}</h1>
<Core:slot/>
<h2>End of Example.html</h2>
```

---

# What This Enables

This interoperability allows:

* mixing runtime-loaded SFCs and JS components
* gradual migration between component styles
* modular application structures
* lazy-loaded browser-native components via ES modules
* easier experimentation without build tooling

---

# Important Notes

## SFCs compile at runtime

`await sfc("Component.html")`

loads:

* the HTML template
* `<script>` section
* component class

then converts them into a normal Core.js component internally.

---

## JS Components and SFCs are equivalent at runtime

Both eventually become standard renderable Core.js component objects.

Meaning:

* props work identically
* slots work identically
* lifecycle hooks work identically
* context API works identically

regardless of whether the component originated from:

* a `.js` file
* or an `.html` SFC.

--- 

# Philosophy

SFC support in Core.js is intentionally lightweight.

Unlike traditional build-step SFC systems, Core.js SFCs are:

browser-native
runtime compiled
ES module friendly
directly loadable without bundlers

while still maintaining interoperability with standard JavaScript components.
