# Single File Components (SFC)

Core.js supports Single File Components (SFCs), allowing components to be written in a single `.html` file containing:

* component logic
* reactive state
* imports
* template markup

The format is inspired by frameworks such as:

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

Core.js uses the `#/` alias for absolute imports because the imported script from blob URLs does not have the relative context of the current domain.

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

# Philosophy

Core.js SFCs aim to combine:

* modern reactive rendering
* component-based architecture
* fine-grained updates

with a simpler browser-native development workflow inspired by the early web while incorporating ideas from modern frontend frameworks.
