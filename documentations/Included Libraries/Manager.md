# Manager Library (`manager.js`)

## Introduction

The manager library provides a lightweight way to manage state using actions.

It behaves similarly to simplified Flux/Redux-style patterns while remaining extremely small

Features:

- Encapsulated state
- Action-based state updates
- Supports synchronous and asynchronous actions
- Type-safe action inference with JSDoc templates
- No dependencies

---

## Installation

```js
import { create_managed_value } from './lib/manager.js';
```

or with importmaps

```html
<script type="importmap">
    {
        "imports": {
            "manager": "./lib/manager.js"
        }
    }
</script>
```
```js
import { create_managed_value } from 'manager';
```

---

## API

### `create_managed_value(initialState, actions)`

Creates a store object containing:

- a `value` getter
- methods defined in `actions`

### Parameters

#### `initialState`

The initial value of the controller state.

```js
create_managed_value([], actions)
```

#### `actions`

An object where each key is a function.

Each action receives:

1. the current state as the first parameter
2. additional custom arguments

The action must return:

- the new state
- or a `Promise` resolving to the new state

---

## Basic Example

```js
const counter = create_managed_value(0, {
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

counter.increment();
console.log(counter.value); // 1

counter.add(5);
console.log(counter.value); // 6
```

---

## Async Actions

Actions may also be asynchronous.

```js
const users = create_managed_value([], {
    async fetchUsers(value) {
        const response = await fetch('/api/users');
        return response.json();
    }
});

await users.fetchUsers();
console.log(users.value);
```

---

## Todo Example

```js
const todos = create_managed_value([], {
    add_todo(value, todo) {
        value.push({
            todo,
            completed: false
        });

        return value;
    },

    delete_todo(value, index) {
        value.splice(index, 1);
        return value;
    },

    mark_complete(value, index) {
        value[index].completed = true;
        return value;
    }
});


todos.add_todo('Learn flux pattern');
todos.add_todo('Build app');

console.log(todos.value); // [{ todo : "Learn flux pattern", done : false }, { todo : "Build app", done : false }]
```

---

## Internal Behavior

The manager instance holds the value internally using a private `Symbol`.

```js
const STORE_VALUE = Symbol();
```

This prevents accidental collisions with user-defined keys.

---

## Return Type

The returned object contains:

```ts
{
    value: T,
    ...actions
}
```

Each action automatically removes the first `value` parameter from the public API.

Example:

```js
add(value, amount)
```

becomes:

```js
add(amount)
```

---

## Design Philosophy

The library intentionally avoids:

- reducers
- dispatch systems

The goal is simplicity and direct state mutation.
