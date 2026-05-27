# Controller Library (`controller.js`)

## Introduction

The controller library provides a lightweight way to manage state using actions.

It behaves similarly to simplified Flux/Redux-style patterns while remaining extremely small and framework-agnostic.

Features:

- Encapsulated state
- Action-based state updates
- Supports synchronous and asynchronous actions
- Type-safe action inference with JSDoc templates
- No dependencies

---

## Installation

```js
import { create_controller } from './controller.js';
```

---

## API

### `create_controller(initialState, actions)`

Creates a controller object containing:

- a `state` getter
- methods defined in `actions`

### Parameters

#### `initialState`

The initial value of the controller state.

```js
create_controller([], actions)
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
const counter = create_controller(0, {
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
console.log(counter.state); // 1

counter.add(5);
console.log(counter.state); // 6
```

---

## Async Actions

Actions may also be asynchronous.

```js
const users = create_controller([], {
    async fetchUsers(value) {
        const response = await fetch('/api/users');
        return response.json();
    }
});

await users.fetchUsers();
console.log(users.state);
```

---

## Todo Example

```js
const todo_controller = create_controller([], {
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


todo_controller.add_todo('Learn controllers');
todo_controller.add_todo('Build app');

console.log(todo_controller.state);
```

---

## Internal Behavior

The controller stores the state internally using a private `Symbol`.

```js
const CONTROLLER_VALUE = Symbol();
```

This prevents accidental collisions with user-defined keys.

---

## Return Type

The returned object contains:

```ts
{
    state: T,
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
controller.add(amount)
```

---

## Design Philosophy

The library intentionally avoids:

- reducers
- dispatch systems

The goal is simplicity and direct state mutation.
