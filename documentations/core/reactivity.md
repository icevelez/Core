# 📘 Reacitivty API

The reactvity syntax is based on the concept of `Signals` or auto-tracked observable subscriptions

---

## 1. Signal

It is a reactive container that holds a value of any type. When the value is accessed inside an `effect`, it automatically tracks the dependency. When the value is updated, all subscribed effects are scheduled to re-run.

### Constructor
```js
signal<T>(initialValue: T)
```
```
Properties
    () => T
    Getter tracks access in effect.

    set(new_value)
    Sets a new internal value then triggers subscribed effects.

    update((current_value) => new_value)
    updates the internal value using a callback to either mutate the current value or replace it entirely which then triggers subscribed effects.
```
### Example
```js
import { signal } from "/core/reactvity.js";

const count = signal(0);

effect(() => {
  console.log("Count is:", count());
});

count.set(1); // Console logs: "Count is: 1"
```

---

## 3. Effect

A function that will automatically re-run when any of the signal values it accesses change.

### Function Signature
```js
/**
 * @param {() => (void | () => void)} fn 
 * @param {{ track_inner_effect : boolean }} options a flag to skip tracking inner effects and resort to manual disposal. Used in `if`, `each`, `await` render functions of Core
 */
effect(fn, options)
```

> Automatically tracks signal access. Returns a cleanup function to manually stop the effect.

### Example
```js
import { signal, effect } from "/core/reactvity.js";

const message = signal("Hello");

const stop = effect(() => {
  console.log("Message is:", message());
});

message.set("World"); // Console logs: "Message is: World"
stop();
message.set("Another World"); // Effect callback no longer re-run
```
