# Composable

As applications grow, it becomes common to encounter logic that needs to be reused across multiple components. Rather than duplicating logic across components, Core encourages extracting reusable functionality into **composable functions**.

A composable is simply a function that encapsulates reactive state, effects, lifecycle hooks, and reusable behavior.

---

## What Is a Composable?

A composable is a regular JavaScript function.

```js
export function use_counter() {
    const [count, setCount] = signal(0);

    const increment = () => {
        setCount(count() + 1);
    };

    return {
        count,
        increment
    };
}
```

Components can then reuse the same logic:

```html
<script>
    import { use_counter } from "./use-counter.js";

    export default function() {
        const { count, increment } = use_counter();
    }
</script>

<button on:click="increment">
    Count: {{ count() }}
</button>
```

---

## Why Use Composables?

Without composables:

```html
<script>
    export default function() {
        const [count, setCount] = signal(0);

        function increment() {
            setCount(count() + 1);
        }
    }
</script>
```

The same code may end up copied into multiple components.

With composables:

```js
const { count, increment } = use_counter();
```

The logic exists in one place and can be reused anywhere.

---

## Using Reactive State

Composables commonly create and expose signals.

```js
import { signal } from "core";

export function use_toggle(initial = false) {
    const [enabled, setEnabled] = signal(initial);

    const toggle = () => {
        setEnabled(!enabled());
    };

    return {
        enabled,
        toggle
    };
}
```

Usage:

```html
<script>
    import { use_toggle } from "./use-toggle.js";

    export default function() {
        const { enabled, toggle } = use_toggle();
    }
</script>

<button on:click="toggle">
    {{ enabled() ? "Enabled" : "Disabled" }}
</button>
```

---

## Using Lifecycle Hooks

Composables can use lifecycle hooks.

```js
import { signal, on_mount } from "core";

export function use_time() {
    const [time, setTime] = signal(new Date());

    on_mount(() => {

        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    });

    return {
        time
    };
}
```

Usage:

```html
<script>
    import { use_time } from "./use-time.js";

    export default function() {
        const { time } = use_time();
    }
</script>

<p>{{ time().toLocaleTimeString() }}</p>
```

The interval is automatically cleaned up when the component is destroyed.

---

## Using Effects

Composables can also encapsulate effects.

```js
import { effect } from "core";

export function use_logger(signal_getter) {

    effect(() => {
        console.log(signal_getter());
    });

}
```

Usage:

```js
const [count] = signal(0);

use_logger(count);
```

Now any changes to `count()` are automatically logged.

---

## Using Browser APIs

Composables are a convenient place to interact with browser APIs.

### Window Size

```js
import {
    signal,
    on_mount
} from "core";

export function use_window_size() {

    const [width, setWidth] = signal(window.innerWidth);
    const [height, setHeight] = signal(window.innerHeight);

    on_mount(() => {

        const resize = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        };

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
        };
    });

    return {
        width,
        height
    };
}
```

Usage:

```html
<p>
    {{ width() }} × {{ height() }}
</p>
```

---

## Sharing State

Composables can either create new state or share existing state.

### Independent State

Each call creates a new signal:

```js
export function use_counter() {
    const [count, setCount] = signal(0);

    return {
        count,
        setCount
    };
}
```

```js
const counterA = use_counter();
const counterB = use_counter();
```

These counters are completely independent.

---

### Shared State

State can be moved outside the composable.

```js
const [count, setCount] = signal(0);

export function use_counter() {
    return {
        count,
        setCount
    };
}
```

```js
const counterA = use_counter();
const counterB = use_counter();
```

Now both components share the same state.

---

## Naming Convention

Composable names typically begin with `use`.

```js
use_counter()
use_toggle()
use_window_size()
use_auth()
use_theme()
```

This naming convention helps identify reusable stateful logic.

---

## Composables vs Components

A composable is not a component.

A composable:

```js
export function use_counter() {

}
```

* Has no UI
* Has no template
* Encapsulates reusable logic

A component:

```html
<script>
    export default function() {

    }
</script>

<h1>Hello</h1>
```

* Renders UI
* Owns a template
* May use composables internally

---

## When to Create a Composable

Consider extracting a composable when:

* Logic is reused in multiple components
* Browser API integration is needed
* State management becomes repetitive
* Lifecycle setup and cleanup appear repeatedly
* Complex behavior becomes difficult to maintain

A good rule of thumb is:

> If you copy the same reactive logic into multiple components, it may be a candidate for a composable.

---

## Inspiration

The concept of composables in Core is heavily inspired by the composable pattern popularized by Vue.

If you are familiar with Vue's Composition API, many of the ideas presented here will feel familiar:

Like Vue composables, Core composables are simply functions that encapsulate reusable stateful logic and can be shared across components.

The primary difference is that Core uses its own reactive primitives such as:

* `signal()`
* `memo()`
* `effect()`
* `on_mount()`
* `on_destroy()`

instead of Vue's:

* `ref()`
* `computed()`
* `watchEffect()`
* `onMounted()`
* `onUnmounted()`

While the APIs differ, the underlying goal remains the same:

> Extract reusable reactive logic from components and compose applications from small, focused pieces of functionality.

For more information about Vue's composable pattern, see the Vue documentation: [Vue Composables Guide](https://vuejs.org/guide/reusability/composables.html?utm_source=chatgpt.com)

---

## Key Concepts

* Composables are regular JavaScript functions.
* They encapsulate reusable reactive logic.
* They can use signals, effects, lifecycle hooks, and browser APIs.
* They can create independent state or expose shared state.
* They do not render UI.
* Components consume composables to build reusable behavior.
