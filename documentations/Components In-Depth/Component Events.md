# Component Events

Core does not use traditional component event emitters.

Instead of emitting and listening to custom events between components, Core uses **callback props** as the primary mechanism for child-to-parent communication.

This approach keeps data flow explicit, predictable, and aligned with JavaScript function semantics.

---

## Why Callback Props?

In many frameworks, components communicate using an event system:

```
Child → emits event → Parent listens
```

While flexible, this introduces an indirect communication layer that can make data flow harder to trace in large applications.

Core replaces this with a simpler model:

```
Parent → passes function → Child calls function
```

This is known as **callback props**.

It is similar in spirit to the approach used in Svelte’s event API changes (v5 migration), where component events are discouraged in favor of explicit function props.

---

## Basic Example

### Parent Component

```html
<script>
    import { component } from "core";

    export const Button = component("./Button.html");

    export default function() {
        const handleClick = () => {
            console.log("Button clicked from child");
        };
    }
</script>

<Button on:click="handleClick" />
```

---

### Child Component

```html
<script>
    export default function(props) {}
</script>

<button on:click="props.onClick()">
    Click Me
</button>
```

---

## How It Works

Callback props follow standard JavaScript function behavior:

```
Parent defines function
    ↓
Function passed as prop
    ↓
Child invokes function directly
    ↓
Parent logic executes
```

There is no event bus, no emitter, and no subscription layer.

---

## Benefits

### 1. Explicit Data Flow

It is always clear where a function originates and where it is used.

```js
<Button on:click="handleClick" />
```

---

### 2. No Event Name Matching

There is no risk of mismatched event names:

```
❌ "on-click" vs "click" vs "clicked"
```

Instead:

```js
on:click="handleClick"
```

---

### 3. Native JavaScript Semantics

Callback props behave like normal function references.

This makes debugging and reasoning about behavior straightforward.

---

### 4. Easier Composition

Callback functions can be composed naturally:

```js 
const save = () => {
    validate();
    submit();
    notify();
};
```

---

## Naming Convention

Callback props typically follow the `on:` convention:

```
on:click
on:change
on:submit
on:select
```

This makes intent clear and consistent across components.

---

## Multiple Callbacks

A component may accept multiple callback props:

### Parent

```html
<UserForm
    on:submit="handleSubmit"
    on:cancel="handleCancel"
/>
```

### Child

```html
<script>
    export default function(props) {
        const { onSubmit, onCancel } = props;
    }
</script>

<button on:click="onSubmit()">
    Submit
</button>

<button on:click="onCancel()">
    Cancel
</button>
```

---

## Comparison with Event Emitters

| Feature | Event Emitters | Callback Props (Core) |
|--------|----------------|----------------------|
| Communication style | Indirect | Direct |
| Debugging | Harder | Easier |
| Type safety | Optional | Natural (JS functions) |
| Coupling | Loose but implicit | Explicit |
| Complexity | Higher | Lower |

---

## When to Use Callback Props

Use callback props when:

- A child needs to notify a parent
- A reusable component needs configurable behavior
- You want explicit control flow

Avoid overusing them for deep component communication; consider context instead.
