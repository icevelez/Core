# Core v0.4.0

## Runtime & Compiler Architecture Rewrite

This release introduces major architectural changes to the compiler, runtime, and reactivity system aimed at:

* reducing runtime overhead
* improving large `#each` rendering performance
* simplifying the compiler pipeline
* reducing memory pressure
* aligning the runtime closer to fine-grained reactive rendering models
* added context API
* added lifecycle hooks (onMount and onDestroy)

---

# Compiler Changes

## `$.` Prefix-Based Expression Scope

Templates now explicitly use the `$.` prefix for scope access:

```html
{{ $.name }}
<input bind:value="$.name" />
```

instead of relying on implicit expression evaluation.

### Why this change?

The previous compiler/runtime pipeline relied heavily on dynamic expression evaluation and caching:

```js
cache_expr[i] || (cache_expr[i] = CORE.evaluate(expr))
```

This introduced:

* expression cache allocations
* repeated evaluator indirection
* more complicated compiler output

The explicit `$.` prefix allows the compiler to:

* statically understand scope ownership
* generate direct property access
* eliminate most runtime expression evaluation
* significantly simplify generated render functions

### Result

* Cleaner generated output
* Reduced runtime allocations
* Simpler compiler architecture

---

# Reactivity System Rewrite

## Container-Based Reactive Identity

Reactive proxy ownership has been rewritten from:

```text
object owns subscriptions
```

to:

```text
container owns:
- current value
- subscriptions
- child containers
- child subscriptions
```

### Previous Architecture

Subscriptions were attached directly to proxied objects:

```text
WeakMap<object, deps>
```

Replacing objects caused:

* stale dependency graphs
* broken subscriptions
* identity invalidation
* difficult cleanup behavior

Example:

```js
state.set(new_object);
```

would replace the proxy target entirely.

---

## New Architecture

Reactive values now use stable container identities.

The container:

* persists across reassignment
* owns the current value
* maintains dependency graphs
* tracks child containers recursively

This allows:

```js
state.set(new_object);
```

without invalidating existing subscriptions.

### Benefits

* Stable reactive identity
* Better memory cleanup behavior
* No stale proxy subscriptions
* More predictable dependency ownership
* Improved nested object replacement performance

---

# Runtime Optimizations

## Removed DOM Batching Microtasks

Several DOM updates previously deferred through `queueMicrotask()` are now executed synchronously.

### Why?

The previous batching strategy:

* introduced additional microtask delays
* increased scheduling overhead
* produced unnecessary queue churn during large renders

### Result

* Lower update latency
* More immediate UI synchronization
* Reduced scheduler overhead
* Better responsiveness during large updates

---

# `#each` Runtime Rewrite

## Property-Based Sub Context Access

`#each` block aliases no longer rely on function calls:

```html
{{ item() }}
```

They now use direct property access:

```html
{{ $.item }}
```

### Implementation

Compiled `#each` blocks now generate stable sub-context objects using shared property descriptors:

```js
Object.defineProperties(...)
```

performed once during compilation/runtime setup.

### Benefits

* Cleaner template syntax
* Less runtime call overhead
* Better inline cache optimization
* Reduced closure allocations
* More ergonomic developer experience

---

## Simplified `#each` DOM Strategy

Large portions of previous DOM movement optimizations have been removed.

### Previous Approach

The runtime attempted to:

* move DOM nodes aggressively
* reorder fragments
* optimize physical DOM movement

This introduced:

* complex reconciliation logic
* higher runtime overhead
* difficult cleanup behavior

---

## New Approach

Rendering responsibility has shifted almost entirely into the reactive layer.

The runtime now primarily:

* reuses existing DOM nodes
* updates only affected bindings
* minimizes structural DOM operations

### Result

* Simpler reconciliation
* Lower runtime overhead
* More predictable rendering
* Better large list scalability

---

## Removed Per-Item `effect()` Execution in `#each`

Previous `#each` rendering created one reactive `effect()` per rendered instance.

Example:

```text
10,000 rows
→ 10,000 effects
```

### New Behavior

The runtime now avoids creating reactive effects per item instance wherever possible.

Rendering updates are instead driven by:

* direct dependency ownership
* property-level subscriptions
* shared reactive containers

### Result

* Reduced memory pressure
* Faster initial render
* Lower GC activity
* Better scaling for large datasets

---

# Component System

## Reactive Props Rewrite

Reactive props previously triggered full component rerenders.

Example:

```html
<Comp :name="$.name()" />
```

would:

* rerun component render
* recreate bindings
* recreate closures
* recreate internal effects

---

## New Architecture

Reactive props are now attached through shared reactive prop objects using:

```js
Object.defineProperties(...)
```

during compilation/runtime initialization.

Runtime component instances reuse these shared prop structures.

### Result

* Components mount once
* Props update reactively without rerendering the whole component
* Lower allocation pressure
* Better scaling in nested component trees
* More fine-grained rendering behavior

---

# Documentation

## Rendering Pipeline Documentation

New documentation explains:

* template preprocessing
* nested block extraction
* render object generation
* runtime render execution
* dynamic binding collection
* optimized render function generation
* reactive dependency ownership

This includes a more detailed explanation of how:

* HTML templates are transformed into render instructions
* dynamic bindings become runtime update points
* nested blocks form a render graph

---

## Context API

Added a new Context API system for dependency propagation across deeply nested component trees without prop drilling.

### Architecture

The Context API is implemented using prototype-chain inheritance through:

```js
const child_ctx = Object.create(parent_ctx);
```

instead of the previous implementation of:

* stack-based context traversal
* nested `Map` lookups
* recursive parent walking

### Benefits

* Faster context lookup through optimized prototype-chain access
* Reduced runtime allocations
* Cleaner scope inheritance model

### Example

```js
const THEME = Symbol();

set_context(THEME, "dark");
```

Child components automatically inherit access through the prototype chain.

---

# Lifecycle Hooks

Added component lifecycle hooks:

* `onMount`
* `onDestroy`

Unlike many frameworks, lifecycle hooks are not registered through imported runtime functions.

Hooks are declared directly on the component instance:

```js
component({
    template : "..."
}, class {

    onMount = () => {

        return () => { // on mount clean up
            
        }
    }

    onDestroy = () => {

    }

});
```

### Why this approach?

This design:

* avoids runtime hook registration overhead
* simplifies compilation/runtime integration
* avoids maintaining a global lifecycle dispatcher

### Result

* Cleaner component API
* Lower runtime overhead
* More predictable lifecycle ownership

---

# Block Cleanup & Disposal Fixes

Fixed a major cleanup issue affecting:

* `{{#if}}`
* `{{#each}}`
* `{{#await}}`

blocks.

---

## The Problem

Blocks internally used reactive `effect()` calls to manage rendering state:

```js
return CORE.effect(() => {

    if (current_if_block === if_block) return;

    dispose_current_block();

    current_if_block = if_block;

});
```

However, disposal logic was unintentionally skipped when:

* the effect itself was disposed
* the condition short-circuited early
* cleanup execution never re-entered the effect body

As a result:

* DOM nodes could remain mounted
* subscriptions could remain active
* block memory was not fully released
* nested effects could leak

This issue applied similarly to:

* `if`
* `each`
* `await`

block implementations.

---

## The Fix

Cleanup ownership was separated from the reactive effect itself:

```js
const effect_dispose = CORE.effect(() => {

    if (current_if_block === if_block) return;

    dispose_current_block();

    current_if_block = if_block;
});

return () => {
    dispose_current_block();
    
    effect_dispose();
}
```

The runtime now explicitly:

1. disposes the currently mounted block
2. disposes the effect itself

---

## Result

* Proper DOM cleanup
* Correct nested block disposal
* Reduced memory leaks
* Improved long-running application stability
* More predictable lifecycle teardown behavior

This fix significantly improved memory behavior during:

* large `#each` updates
* conditional block toggling
* async block replacement
* component destruction

---

## Missing implementation

* Map/Set/Iterable support in `{{#each}}` 
    * supporting these data types will force me to make per-item variable as read-only
