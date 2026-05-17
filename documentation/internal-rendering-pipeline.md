# Core.js Internal Rendering Pipeline

## Overview

Core.js is a compiler-assisted reactive UI runtime inspired by modern front-end frameworks such as Svelte, Solid, and Vue

The architecture combines:

- Runtime template compilation using `new Function(...)`
- Fine-grained reactivity using `signals/effects`
- Cached `DocumentFragment` cloning
- Optimized block rendering for `{{#each}}`, `{{#if}}`, and `{{#await}}`
- DOM preprocessing to avoid repeated DOM walking during render

Unlike Virtual DOM frameworks, the runtime attempts to directly bind reactive effects to real DOM nodes.

---

# High Level Rendering Flow

```text
Template String
    ↓
Handlebar-style Block Processing
    ↓
Nested Block Extraction
    ↓
Placeholder Injection
    ↓
Template → DocumentFragment
    ↓
DOM Preprocessing
    ↓
Dynamic Instruction Collection
    ↓
Render Function Generation
    ↓
Render Object Cache
    ↓
Runtime Execution
    ↓
Reactive DOM Updates
```

---

# 1. Component Processing

The entry point of the framework begins in `handlebar.js`.

A component is created using:

```js
component(options, Ctx)
```

Where:

- `options.template` contains the HTML template string
- `Ctx` is the component state class

The compiler converts the HTML template into optimized render functions.

---

# 2. Template Block Parsing

The framework supports block syntax depending on the parser used like Handlebars:

```handlebars
{{#if}}
{{#each}}
{{#await}}
```

The template parser recursively searches for nested blocks using a regular expression:

```js
/{{#(await|if|each)(.*?)}}|{{\/(await|if|each)}}/gs
```

The parser:

1. Finds opening and closing of block pairs
2. Tracks nested blocks using a stack
3. Extracts the outermost blocks first
4. Recursively replaces nested inner blocks

---

# Example

Input:

```html
{{#if $.logged_in}}
    <div>
        {{#each $.users as user}}
            <p>{user.name}</p>
        {{/each}}
    </div>
{{/if}}
```

The parser transforms nested blocks into placeholders:

```html
<template data-block="if" data-block-id="if-abc123"></template>
```

Nested blocks are recursively replaced before further processing.

---

# 3. Placeholder Injection

Each discovered block receives a generated unique ID.

Example:

```html
{{#if $.logged_in}}
    <div>
        <template data-block="each" data-block-id="each-x8d2af"></template>
    </div>
{{/if}}
```

These placeholders act as mount anchors during runtime rendering.

The generated block ID becomes the lookup key for the compiled render object.

---

# 4. Converting HTML Into a DocumentFragment

After block extraction:

1. The remaining clean HTML template is converted into a `<template>` element
2. The framework retrieves its `DocumentFragment`
3. The fragment becomes the static cached structure of the component

This allows:

- Efficient cloning
- No repeated HTML parsing
- Reuse of static DOM structure

The runtime later clones the cached fragment instead of rebuilding DOM manually.

---

# 5. DOM Preprocessing

The framework recursively walks the `DocumentFragment` only once.

This preprocessing stage discovers:

- Dynamic text interpolations
- Dynamic attributes
- Event handlers
- Bindings
- Components
- Directives
- Block placeholders

The discovered instructions are stored in a lightweight metadata object.

---

# Example Collected Metadata

```js
{
    text_funcs: [],
    attr_funcs: [],
    bindings: [],
    events: [],
    blocks: [],
    component_blocks: []
}
```

The framework uses child indexes instead of repeated DOM queries.

This significantly improves runtime performance.

---

# 6. Whitespace Cleanup

The framework recursively removes empty text nodes.

Purpose:

- Reduce DOM node count
- Improve traversal speed
- Reduce unnecessary memory usage

Whitespace-sensitive elements such as:

- `<textarea>`
- `<pre>`

must be excluded from aggressive whitespace cleanup.

---

# 7. Dynamic Node Collection

During preprocessing, the compiler captures:

## Text Expressions

```html
<h1>{$.name}</h1>
```

Stored as:

```js
{
    child_index: 0,
    expr: "$.name"
}
```

---

## Dynamic Attributes

```html
<button disabled="{$.loading}">
```

Stored as:

```js
{
    child_index: 1,
    property: "disabled",
    expr: "$.loading"
}
```

---

## Event Handlers

```html
<button onclick="{$.increment()}">
```

Stored as:

```js
{
    child_index: 2,
    event_name: "click",
    expr: "$.increment()"
}
```

---

## Two-Way Bindings

```html
<input bind:value="$.name">
```

Stored as:

```js
{
    child_index: 0,
    property: "value",
    var: "$.name",
    event_name: "input"
}
```

---

# 8. Fragment Cache

Static template fragments are stored globally:

```js
CORE.fragment_cache
```

The cache contains preprocessed `DocumentFragment` objects.

During rendering:

```js
fragment.cloneNode(true)
```

is used instead of reparsing HTML.

This is one of the largest performance optimizations in the runtime.

---

# 9. Render Function Generation

The framework dynamically generates optimized render functions using:

```js
new Function(...)
```

The generated code:

- Avoids repeated DOM walking
- Avoids repeated selector queries
- Avoids template reparsing
- Directly references child indexes
- Installs reactive effects

The generated render function behaves similarly to compiled framework output.

---

# Example Conceptual Generated Output

```js
const child0 = fragment.childNodes[0];
const text0 = child0.firstChild;

CORE.effect(() => {
    text0.data = $.name;
});
```

Instead of runtime template evaluation.

---

# 10. Render Objects

Compiled blocks are stored as specialized render objects.

The structure depends on block type.

---

## If Block

```js
{
    fns: [],
    expr: "$.logged_in"
}
```

---

## Each Block

```js
{
    fn,
    empty_fn,
    expr,
    key,
    keys,
    index_key
}
```

---

## Await Block

```js
{
    pending_fn,
    then_fn,
    catch_fn,
    expr
}
```

These render objects are stored in a global cache.

---

# 11. Global Block Cache

Blocks are globally cached using their generated block IDs.

Example:

```js
CORE.block_cache.set(block_id, render_object)
```

The runtime later resolves placeholders using these IDs.

---

# 12. Runtime Rendering

The compiled render function executes using:

```js
render(anchor, ctx)
```

Where:

- `anchor` is the mount node
- `ctx` is the reactive component state

The render function:

1. Clones cached fragments
2. Resolves block placeholders
3. Installs reactive effects
4. Attaches event listeners
5. Mounts child components
6. Appends DOM nodes

---

# 13. Reactive System

The reactive runtime is implemented in `reactivity.js`.

The system is composed of:

- Signals
- Effects
- Dependency tracking
- Batched microtask updates
- Proxy-based object reactivity

---

# Signals

```js
const count = signal(0);
```

Signals store reactive values.

---

# Effects

```js
effect(() => {
    console.log(count());
});
```

Effects automatically track dependencies.

---

# Dependency Graph

Dependencies are stored using:

```js
WeakMap<object, dep>
```

or container-based reactive structures.

This allows:

- Fine-grained updates
- Automatic dependency tracking
- Efficient cleanup

---

# 14. Effect Queue Batching

Reactive updates are batched using:

```js
queueMicrotask(...)
```

This prevents:

- Duplicate effect executions
- Excessive synchronous DOM updates

The queue behaves similarly to scheduler systems in modern frameworks.

---

# 15. Fine-Grained DOM Updates

Instead of rerendering entire components:

Only the exact affected DOM node updates.

Example:

```html
<p>{$.name}</p>
```

becomes:

```js
text.data = $.name;
```

without rerendering sibling nodes.

---

# 16. Each Block Optimization

`{{#each}}` blocks are optimized using:

- Cached sub contexts
- Child node reuse
- Keyed rendering
- Fine-grained effects
- Fragment cloning

The runtime attempts to update only changed rows.

---

# Example

```html
{{#each $.users as user}}
    <Row :user="user" />
{{/each}}
```

Each row receives its own reactive sub-context.

---

# 17. Sub Context Inheritance

The framework creates lightweight sub-contexts using:

```js
Object.create(parent_ctx)
```

This allows:

- Property inheritance
- Reduced object duplication
- Scoped variables inside loops

Example:

```js
const $sub = Object.create($);
```

Dynamic getters expose loop variables.

---

# 18. Event Binding

Event attributes are transformed into delegated DOM listeners.

Example:

```html
<button onclick="{$.increment()}">
```

becomes:

```js
CORE.delegate(node, "click", handler)
```

Cleanup functions remove listeners during disposal.

---

# 19. Component Rendering

Child components are compiled into render functions.

During rendering:

```js
Child(anchor, props)
```

is executed.

Props may contain:

- Static values
- Dynamic expressions
- Signals
- Reactive accessors

---

# 20. Cleanup and Disposal

Every render function returns a dispose function.

Purpose:

- Remove effects
- Remove event listeners
- Remove child components
- Prevent memory leaks

Example:

```js
const dispose = render(anchor, ctx);
```

Later:

```js
dispose();
```

---

# 21. Memory Management

The framework aggressively attempts to:

- Dispose effects
- Remove dependency references
- Clear child render ownership
- Remove event listeners
- Remove detached DOM references

This is critical for:

- Large `#each` blocks
- Dynamic component trees
- Long-running applications

---

# 22. Compiler Philosophy

The framework follows a compiler-assisted runtime model.

Instead of:

- Runtime template parsing
- Virtual DOM diffing
- Generic reconciliation

The compiler generates:

- Specialized render functions
- Specialized block handlers
- Direct DOM update instructions

This allows:

- Faster updates
- Lower memory usage
- Fine-grained reactivity
- Reduced runtime overhead

---

# 23. Key Design Goals

The framework prioritizes:

- Fine-grained reactivity
- Minimal rerendering
- Direct DOM manipulation
- Compiler-assisted optimization
- Cached fragment cloning
- Minimal runtime traversal
- Efficient cleanup/disposal
- Runtime template compilation
