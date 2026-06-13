# Core.js Internal Rendering Pipeline

This document explains how Core transforms a Single-File Component (SFC) into a running UI component.

Unlike Virtual DOM frameworks, Core compiles templates into executable DOM instructions. The resulting component function directly creates, updates, and disposes DOM nodes.

---

# High-Level Overview

```text
Component.html
      │
      ▼
Load SFC
      │
      ▼
Extract <script>
Extract Template
      │
      ▼
Process Components
      │
      ▼
Process Blocks
(if / each / await)
      │
      ▼
Generate Render Code
      │
      ▼
Inject Into Component Function
      │
      ▼
Create ESM Module
      │
      ▼
Dynamic Import
      │
      ▼
Mount Component
```

---

# 1. Loading the SFC

The entry point is:

```js
component(url)
```

which internally calls:

```js
sfc(url, template_processor)
```

The file is fetched and split into:

```html
<script>
export default function() {

}
</script>

<h1>Hello World</h1>
```

becoming:

```js
{
    script,
    template
}
```

---

# 2. Extracting User Code

The compiler locates:

```js
export default function() {

}
```

using:

```js
extract_default_function()
```

This function scans braces rather than using a regex to correctly handle nested scopes.

The extracted body becomes:

```js
const user_code =
`
const [count, setCount] = signal(0);
`
```

This allows the compiler to inject template rendering instructions directly into the component function.

---

# 3. Component Processing

Before template compilation begins, custom components are processed.

Example:

```html
<UserCard
    :name="name()"
    age="25"
/>
```

becomes an internal placeholder:

```html
<template
    data-block="component"
    data-component-tag="UserCard"
    data-component-id="..."
    data-block-props-id="..."
></template>
```

Metadata is stored inside:

```js
CORE.block_cache
```

including:

* static props
* dynamic props
* slots
* component references

---

# 4. Block Extraction

Core separates control-flow blocks from normal HTML.

Supported blocks:

```html
{{#if}}
{{#each}}
{{#await}}
```

Example:

```html
{{#if loggedIn()}}
    Welcome
{{/if}}
```

becomes:

```html
<template
    data-block="if"
    data-block-id="if-abc123">
</template>
```

The original block is parsed and stored in:

```js
CORE.block_cache
```

This means nested blocks become independent render units.

---

# 5. Block Parsing

Each block type is parsed differently.

---

## If Blocks

```html
{{#if loading()}}
    Loading...
{{:else if error()}}
    Error
{{:else}}
    Success
{{/if}}
```

becomes:

```js
{
    exprs: [
        "loading()",
        "error()",
        "true"
    ],
    fns: [
        renderLoading,
        renderError,
        renderSuccess
    ]
}
```

---

## Each Blocks

```html
{{#each users() as user}}
    {{ user().name }}
{{/each}}
```

becomes:

```js
{
    expr: "users()",
    key: "user",
    fn: renderUser
}
```

Notice:

```js
user()
```

is an accessor.

This allows updates to be scoped to a specific iteration.

---

## Await Blocks

```html
{{#await fetchUsers()}}
    Loading...
{{:then users}}
    ...
{{:catch error}}
    ...
{{/await}}
```

becomes:

```js
{
    expr: "fetchUsers()",
    pending_fn,
    then_fn,
    catch_fn
}
```

---

# 6. Template Discovery

Once all placeholders are inserted, the compiler analyzes the DOM tree.

```js
discover_node_instruction(fragment)
```

collects:

```js
{
    children,
    text_funcs,
    attr_funcs,
    events,
    blocks,
    component_blocks,
    use_directives
}
```

This is the compiler's internal instruction set.

---

# 7. Fragment Cache Creation

The parsed template is stored once.

```js
CORE.fragment_cache.push(fragment);
```

Each component instance later uses:

```js
cloneNode(true)
```

instead of reparsing HTML.

Conceptually:

```js
const template =
    fragment_cache[index];

const instance =
    template.cloneNode(true);
```

This removes HTML parsing costs during mounting.

---

# 8. Render Code Generation

The compiler generates JavaScript instructions.

Example:

```html
<h1>Hello {{ name() }}</h1>
```

becomes:

```js
$CORE.effect(() => {
    $CORE.set_text(
        $CHILD0,
        `Hello ${name()}`
    );
});
```

---

## Attribute Bindings

```html
<input :value="name()">
```

becomes:

```js
$CORE.effect(() => {
    $CORE.set_attr(
        $CHILD0,
        name(),
        "value"
    );
});
```

---

## Event Bindings

```html
<button
    on:click="increment">
</button>
```

becomes:

```js
$CORE.delegate(
    "click",
    $CHILD0,
    increment
);
```

---

# 9. Template Injection

Generated code is injected directly into the component function.

User source:

```js
export default function() {
    const [count, setCount] =
        signal(0);
}
```

Compiler output:

```js
export default function() {

    const [count, setCount] =
        signal(0);

    /* injected template code */

    const $TEMPLATE =
        fragment.cloneNode(true);

    ...

    return dispose;
}
```

The component function becomes both:

* setup phase
* render procedure

---

# 10. ESM Module Creation

The modified source is turned into:

```js
Blob(...)
```

and dynamically imported:

```js
import(blob_url)
```

This produces:

```js
{
    default: component,
    ...
}
```

without requiring a build step.

---

# 11. Mounting

Mounting begins with:

```js
mount(component, target)
```

Core creates a context:

```js
const context =
    create_new_context();
```

and calls:

```js
component();
```

The generated render code then:

```js
target.append(template);
```

inserts the DOM.

---

# 12. Lifecycle Execution

Core discovers lifecycle functions by name.

```js
function onMount() {

}
```

or

```js
const onMount = () => {

}
```

are both valid.

When mounted:

```js
onMount()
```

is executed.

If it returns a function:

```js
return () => {

}
```

that function becomes the mount cleanup handler.

---

## Destruction Order

```text
onMount()
      │
      ▼
Component Active
      │
      ▼
Mount Cleanup
      │
      ▼
onDestroy()
      │
      ▼
Dispose Effects
      │
      ▼
Dispose Events
      │
      ▼
Remove DOM
```

---

# 13. Reactivity Pipeline

Signals drive updates.

```js
const [count, setCount] =
    signal(0);
```

Reading:

```js
count()
```

registers the current effect.

Internally:

```text
Effect
   │
   ▼
Dependency Set
```

Updating:

```js
setCount(1)
```

triggers all subscribed effects.

---

## Effect Scheduling

Effects are not executed immediately.

Core places them into:

```js
effect_queue
```

and flushes them through:

```js
queueMicrotask(...)
```

This batches multiple updates into a single flush cycle.

```text
Signal Update
      │
      ▼
Queue Effect
      │
      ▼
Microtask Flush
      │
      ▼
Run Effects
```

---

# 14. Context System

Each component receives its own context.

```js
const context =
    create_new_context();
```

Contexts form a prototype chain.

```text
Root Context
      │
      ▼
Parent Context
      │
      ▼
Child Context
```

This powers:

* component hierarchy
* dependency injection
* lifecycle coordination

---

# 15. Disposal

Every generated resource returns a cleanup function.

```js
const $DISPOSE_FNS = [];
```

Examples:

```js
effect(...)
delegate(...)
if(...)
each(...)
await(...)
component(...)
```

all contribute disposal handlers.

Destroying a component:

```js
dispose()
```

will:

```text
Run Lifecycle Cleanup
      │
      ▼
Dispose Effects
      │
      ▼
Dispose Event Delegates
      │
      ▼
Dispose Blocks
      │
      ▼
Dispose Components
      │
      ▼
Remove DOM Nodes
```

---

# Core's Philosophy

Core treats templates as compile-time syntax rather than runtime data.

```text
Template
      │
      ▼
Compiler
      │
      ▼
DOM Instructions
      │
      ▼
JavaScript Component
```

A mounted component does not produce a Virtual DOM tree.

Instead, it:

1. Clones a cached template fragment.
2. Creates reactive effects.
3. Delegates events.
4. Mounts child blocks and components.
5. Updates only affected DOM nodes.
6. Cleans itself up through a unified disposal system.

The resulting component function acts as both the component's setup phase and its rendering pipeline.
