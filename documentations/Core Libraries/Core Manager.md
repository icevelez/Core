# Core Manager (`core-manager.js`)

Core Manager provides a structured way to manage reactive state by centralizing all state updates into explicitly defined actions.

Instead of exposing a writable signal directly, updates are performed through named actions, making state transitions easier to understand, maintain, and debug.

This pattern is conceptually similar to:

* Flux Stores
* Redux reducers and dispatchers
* Pinia stores
* Zustand stores with actions

---

## Creating a Managed Value

A managed value is created using `create_managed_value()`.

```js
import { create_managed_value } from "manager";

const CounterManager = create_managed_value(0, {
    increment(value) {
        return value + 1;
    },

    decrement(value) {
        return value - 1;
    },

    add(value, amount) {
        return value + amount;
    }
});
```

The first argument is the initial state.

The second argument is an object containing actions responsible for updating the state.

---

## Using a Managed Value

`create_managed_value()` returns a tuple:

```js
const [
    counter,
    counter_actions,
    counter_pending,
    counter_error
] = CounterManager;
```

| Value               | Description                                  |
| ------------------- | -------------------------------------------- |
| `counter()`         | Reactive state getter                        |
| `counter_actions`   | Object containing action methods             |
| `counter_pending()` | Indicates whether an async action is running |
| `counter_error()`   | Contains the most recent action error        |

---

## Synchronous Actions

Actions receive the current state as their first argument and return the next state.

```js
counter_actions.increment();

console.log(counter()); // 1
```

Actions may also accept additional parameters.

```js
counter_actions.add(5);

console.log(counter()); // 6
```

---

## Asynchronous Actions

Actions can return a Promise.

```js
const UserManager = create_managed_value(null, {
    async load() {
        return fetch("/api/user")
            .then(response => response.json());
    }
});
```

When a Promise is returned:

1. `pending()` becomes `true`
2. The Promise is awaited
3. The resolved value becomes the new state
4. `pending()` becomes `false`

```js
await actions.load();
```

---

## Loading State

The `pending()` signal can be used to display loading indicators.

```js
if (pending()) {
    console.log("Loading...");
}
```

```html
{{#if pending()}}
    <p>Loading...</p>
{{/if}}
```

---

## Error Handling

If an async action throws an error, it is stored in the error signal.

```js
if (error()) {
    console.error(error());
}
```

```html
{{#if error()}}
    <p>{{ error().message }}</p>
{{/if}}
```

---

## Example

```js
import { create_managed_value } from "manager";

export const UserManager = create_managed_value(null, {

    async load() {
        return fetch("/api/user")
            .then(response => response.json());
    },

    clear() {
        return null;
    }
});
```

```js
const [
    user,
    actions,
    pending,
    error
] = UserManager;

await actions.load();

console.log(user());
```

---

## Why Use Managed Values?

Managed Values help:

* Centralize state mutations
* Keep state transitions predictable
* Encapsulate business logic
* Handle loading and error states automatically
* Create lightweight stores without additional boilerplate

Rather than allowing any part of an application to modify state directly, updates flow through well-defined actions.

```text
Action
   ↓
State Update
   ↓
Reactive UI Update
```

This makes application behavior easier to reason about as it grows.
