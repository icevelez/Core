# Core.js 

Version: 0.5.0

---

Core is a compiler-driven UI framework for building reactive web applications.

It combines:

- Fine-grained reactivity through signals
- Direct DOM updates
- Compile-time template analysis
- Component-based architecture

Unlike frameworks that re-render components or diff a Virtual DOM, Core compiles templates into optimized DOM instructions. When state changes, only the affected parts of the DOM are updated.

Single-File Components (SFCs) are the primary way to build user interfaces in Core. An SFC combines component logic and template markup into a single `.html` file.

Unlike traditional HTML files, SFCs are compiled into JavaScript modules. During compilation, the template is transformed into optimized DOM instructions and injected into the component function.

```html
<script>
import { signal } from "../core/runtime.js";

export default function () {
    const [count, setCount] = signal(0);
}
</script>

<button
    on:click="() => setCount(count() + 1)"
>
    Count: {{ count() }}
</button>
```

The compiler transforms this component into JavaScript that:

* Creates DOM nodes once
* Registers reactive effects
* Wires event handlers
* Updates only affected nodes when state changes

No Virtual DOM is created.

No component re-rendering occurs.

---

# Core's Rendering Model

Core follows a compile-time rendering approach.

During compilation:

```text
Single-File Component
            ↓
      Parse Template
            ↓
    Analyze Reactivity
            ↓
 Generate DOM Instructions
            ↓
   Output JavaScript Module
```

For example:

```html
<h1>Hello {{ name() }}</h1>
```

is conceptually transformed into:

```js
effect(() => {
    textNode.textContent = `Hello ${name()}`;
});
```

The template becomes executable DOM instructions rather than a runtime template representation.

This allows Core to perform updates with minimal runtime overhead.

---

# What is a Single-File Component?

A Single-File Component (SFC) is the primary building block of a Core application.

An SFC combines:

* Component logic
* Reactive state
* Lifecycle functions
* Template markup

into a single `.html` file.

```html
<script>
export default function () {

}
</script>

<h1>Hello World</h1>
```

The `<script>` block contains the component logic.

The markup outside the script block becomes the component template.

During compilation, the template is analyzed and injected into the component's generated JavaScript output.

---

# Basic Component Structure

```html
<script>
import { signal } from "../core/runtime.js";

export default function () {
    const [name, setName] = signal("John");
}
</script>

<h1>Hello {{ name() }}</h1>
```

---

# Component Function

Every component must export a default function.

```html
<script>
export default function () {

}
</script>
```

This function acts as the component's setup phase.

Inside it you can:

* Create signals
* Register lifecycle hooks
* Define event handlers
* Create derived values
* Perform initialization logic

```html
<script>
import { signal } from "../core/runtime.js";

export default function () {
    const [count, setCount] = signal(0);
}
</script>
```

The compiler injects the template implementation directly into this function.

---

# Reactive State

State is created using signals.

```js
const [count, setCount] = signal(0);
```

Reading:

```js
count()
```

Writing:

```js
setCount(5);
```

Incrementing:

```js
setCount(count() + 1);
```

---

# Text Interpolation

Use `{{ }}` to insert values into text nodes.

```html
<h1>Hello {{ name() }}</h1>
```

Multiple expressions may be used.

```html
<p>
    {{ firstName() }} {{ lastName() }}
</p>
```

Expressions are reactive.

When dependencies change, only the affected text node updates.

---

# Attribute Bindings

Prefix an attribute with `:` to make it reactive.

```html
<input :value="name()">
```

Equivalent behavior:

```js
input.value = name();
```

Whenever `name()` changes, the attribute is updated automatically.

---

## Multiple Bindings

```html
<img
    :src="avatar()"
    :alt="displayName()"
>
```

---

# Event Handlers

Prefix events with `on:`.

```html
<button on:click="increment">
    Increment
</button>
```

Inline expressions are supported.

```html
<button on:click="() => setCount(count() + 1)">
    Increment
</button>
```

Accessing the event:

```html
<input
    on:input="(e) => setName(e.target.value)"
>
```

---

# Two-Way Input Example

```html
<script>
import { signal } from "../core/runtime.js";

export default function () {
    const [name, setName] = signal("John");
}
</script>

<input
    :value="name()"
    on:input="(e) => setName(e.target.value)"
>

<p>Hello {{ name() }}</p>
```

or use the built-in `bind` directive

```html
<script>
import { signal, bind } from "../core/runtime.js";

export default function () {
    const [name, setName] = signal("John");
}
</script>

<input use:bind="['value', name, setName]">
    
<p>Hello {{ name() }}</p>
```

---

# Conditional Rendering

Use `{{#if}}`.

```html
{{#if loggedIn()}}
    <h1>Welcome back</h1>
{{/if}}
```

---

## If / Else

```html
{{#if loggedIn()}}
    <h1>Welcome back</h1>
{{else}}
    <h1>Please sign in</h1>
{{/if}}
```

---

## Else If

```html
{{#if loading()}}
    Loading...
{{else if error()}}
    Error
{{else}}
    Success
{{/if}}
```

---

# Iteration Variables

Use `{{#each}}`.

```html
{{#each items() as item}}
    <p>{{ item().name }}</p>
{{/each}}
```

with index Access 

```html
{{#each items() as item, i}}
    <p>{{ i }} {{ item().name }}</p>
{{/each}}
```

> **Compiler Note**
>
> Iteration variables are compiled as **accessors** rather than plain values. This allows the compiler and runtime to associate reactive updates with a specific iteration block, reducing unnecessary work when list items change.

---

# Async Rendering

Use `{{#await}}`.

```html
{{#await fetchUsers()}}
    Loading...
{{/await}}
```

---

## Await With Result

```html
{{#await fetchUsers()}}
    Loading...
{{:then users}}
    <ul>
    {{#each users as user}}
        <li>{{ user().name }}</li>
    {{/each}}
    </ul>
{{/await}}
```
---

## Await With Error

```html
{{#await fetchUsers()}}
    Loading...
{{:catch error}}
    {{ error }}
{{/await}}
```

---

# Lifecycle Hooks

Lifecycle hooks are registered inside the component function.

```html
<script>
export default function () {
    function onMount() {
        console.log("Mounted");
    });

    function onDestroy() {
        console.log("Destroyed");
    });
}
</script>
```

---

# Context API

Lifecycle hooks are registered inside the component function.

`Parent.html`
```html
<script>
import { component } from "handlebar.js";

export const Child = component("Child.html")

export default function () {
    setContext("key", "value from parent");
}
</script>

<Child/>
```

`Child.html`
```html
<script>
import { get_context } from "handlebar.js";

export const Child = component("Child.html")

export default function () {
    console.log(get_context("key")) // "value from parent"
}
</script>

<h1>Hello World</h1>
```

---

## Cleanup Function

```js
function onMount() {
    const timer = setInterval(work, 1000);
    return () => clearInterval(timer);
});
```

---

# Nested Components

```html
<script>
import { component } from "handlebar.js";

export const Header = component("Header.html");

export default function () {

}
</script>

<Header />
```

---

# Passing Props

```html
<UserCard
    name="John"
    age="25"
/>
```

Reactive props:

```html
<UserCard
    :name="name()"
    :age="age()"
/>
```

---

# Slots

Default slot:

```html
<Card>
    Hello World
</Card>
```

Component:

```html
<div class="card">
    <CoreSlot />
</div>
```

---

# Dnyamic Components

```html
<script>
import { component } from "handlebar.js";
</script>

{{#await component("Header.html")}}
    Loading component...
{{:then Header}}
    <CoreComponent default="Header"/>
{{/await}}
```

With `slots` and `props`

```html
<script>
import { component } from "handlebar.js";
import { signal } from "runtime.js";

export default function() {
    const [name, setName] = signal("John");
    const [count, setCount] = signal(0);
}
</script>

{{#await component("Header.html")}}
    Loading component...
{{:then Header}}
    <CoreComponent default="Header" :name="name()">
        {{ count() }}
    </CoreComponent>
{{/await}}
```

---

# Template Rules

Templates must contain valid HTML.

### Valid

```html
<div>
    <h1>Hello</h1>
</div>
```

### Invalid

```html
<div>
<h1>Hello
```

---

# Component Lifecycle

When a component is mounted:

```text
Component Function
        ↓
Create Signals
        ↓
Create DOM
        ↓
Register Effects
        ↓
Register Events
        ↓
Mount Nodes
        ↓
Run onMount
```

When destroyed:

```text
Dispose Effects
        ↓
Remove Events
        ↓
Run onDestroy
        ↓
Remove DOM
```

---

# Complete Example

```html
<script>
import { signal } from "../core/runtime.js";

export default function () {
    const [name, setName] = signal("John");
    const [count, setCount] = signal(0);
}
</script>

<h1>Hello {{ name() }}</h1>

<input
    :value="name()"
    on:input="(e) => setName(e.target.value)"
>

<button
    on:click="() => setCount(count() + 1)"
>
    Count: {{ count() }}
</button>
```

This component creates two reactive signals, binds an input to `name`, updates text automatically, and increments a counter without re-rendering the component. The compiler converts the template into direct DOM operations and fine-grained reactive effects.
