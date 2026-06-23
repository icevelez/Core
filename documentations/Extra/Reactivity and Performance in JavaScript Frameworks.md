# Reactivity and Performance in JavaScript Frameworks

One of the most common misconceptions in frontend development is:

> Signals automatically make a framework faster.

In reality, signals are only one piece of the performance puzzle.

To understand why frameworks perform differently, we need to separate four distinct concerns:

1. **Change Detection** — How does the framework know something changed?
2. **Scheduling Granularity** — How much work gets scheduled?
3. **DOM Update Granularity** — How much UI work executes?
4. **DOM Update Strategy** — How does the framework determine what DOM operations to perform?

Many framework comparisons accidentally combine these concepts together, leading to misleading conclusions such as:

> Signals are faster than dirty checking.

or

> Virtual DOM is slower than signals.

Neither statement is universally true because they compare different layers of the rendering pipeline.

---

# Layer 1: Change Detection

Change detection answers a single question:

> How does the framework know state changed?

| Framework             | Change Detection                                   |
| --------------------- | -------------------------------------------------- |
| React                 | Explicit state updates (`setState`, Hooks setters) |
| Angular (Pre-Signals) | Change detection cycle + binding comparisons       |
| Vue 2                 | Getter/Setter dependency tracking                  |
| Vue 3                 | Proxy-based dependency tracking                    |
| Svelte 3/4            | Compiler-generated invalidation                    |
| Svelte 5              | Signals (Runes)                                    |
| Solid                 | Signals                                            |
| Alpine                | Vue reactivity (Proxy-based dependency tracking)   |

Notice that change detection says nothing about how the UI updates.

It only determines that a change occurred.

---

# Layer 2: Scheduling Granularity

Scheduling granularity answers:

> How much runtime work gets scheduled after a change?

| Framework             | Scheduling Granularity      |
| --------------------- | --------------------------- |
| React                 | Component                   |
| Angular (Pre-Signals) | Root View                   |
| Vue 2                 | Watcher → Component         |
| Vue 3                 | Reactive Effect → Component |
| Svelte 3/4            | Component                   |
| Svelte 5              | Effect                      |
| Solid                 | Effect                      |
| Alpine                | Effect                      |

This determines how much work begins executing.

It does not determine how much DOM work ultimately occurs.

---

# Layer 3: DOM Update Granularity

DOM update granularity answers:

> How much UI work executes once updates begin?

| Framework             | DOM Update Granularity |
| --------------------- | ---------------------- |
| React                 | Component subtree      |
| Angular (Pre-Signals) | Binding                |
| Vue 2                 | Component subtree      |
| Vue 3                 | Dynamic VDOM regions   |
| Svelte 3/4            | Binding                |
| Svelte 5              | Effect                 |
| Solid                 | Effect                 |
| Alpine                | Directive / Effect     |

This layer often has a larger impact on performance than the reactivity model itself.

---

# Layer 4: DOM Update Strategy

DOM update strategy answers:

> How does the framework determine which DOM mutations to perform?

| Framework             | DOM Update Strategy                    |
| --------------------- | -------------------------------------- |
| React                 | Virtual DOM reconciliation             |
| Angular (Pre-Signals) | Binding comparison                     |
| Vue 2                 | Virtual DOM reconciliation             |
| Vue 3                 | Compiler-assisted Virtual DOM patching |
| Svelte 3/4            | Compiler-generated update instructions |
| Svelte 5              | Compiler-generated reactive effects    |
| Solid                 | Runtime dependency graph               |
| Alpine                | Runtime directive effects              |

This is where much of the actual performance difference between frameworks originates.

---

# Why Signals Do Not Automatically Improve Performance

Consider two hypothetical frameworks.

## Framework A

```txt
Signal changed
    ↓
Component update
    ↓
Virtual DOM creation
    ↓
Virtual DOM diff
    ↓
DOM update
```

## Framework B

```txt
Signal changed
    ↓
Effect executes
    ↓
Text node updated
```

Both use signals.

However, Framework B performs significantly less work.

Signals only answer:

> What changed?

They do not answer:

> How much work should run?

or

> How should the DOM update?

Those decisions are made by the scheduling and rendering layers.

---

# React

React uses explicit state updates.

```jsx
const [count, setCount] = useState(0);
```

When state changes:

```txt
setState()
    ↓
Component scheduled
    ↓
Component function executes
    ↓
New Virtual DOM tree
    ↓
Reconciliation
    ↓
DOM mutations
```

React's update granularity is generally component-oriented.

The framework re-executes components and compares Virtual DOM trees to determine which DOM operations are required.

Advantages:

* Predictable rendering model
* Strong composability
* Flexible runtime behavior

Tradeoffs:

* Component execution cost
* Virtual DOM allocation
* Reconciliation overhead

---

# Angular (Pre-Signals)

Angular's templates compile into binding instructions.

```html
<p>{{ name }}</p>
```

Conceptually:

```js
if (oldValue !== name) {
    textNode.data = name;
}
```

Angular stores previous values inside LView arrays.

During change detection:

```txt
Root View
    ↓
Traverse Views
    ↓
Evaluate Bindings
    ↓
Compare Values
    ↓
Update DOM
```

Angular's binding comparisons are extremely cheap.

In isolation, a single binding comparison is typically cheaper than Virtual DOM reconciliation work.

However, Angular must traverse views before reaching those bindings.

This demonstrates an important principle:

> The cost of scheduling and traversal can matter as much as the cost of change detection itself.

---

# Vue 2

Vue 2 combines dependency-tracked reactivity with Virtual DOM rendering.

```txt
Reactive Dependency
    ↓
Watcher
    ↓
Component Update
    ↓
Virtual DOM Diff
    ↓
DOM Patch
```

Vue 2's dependency tracking is more selective than Angular's root-level traversal because only dependent watchers are notified.

However, rendering remains component-oriented and Virtual DOM-based.

---

# Vue 3

Vue 3 modernized Vue's reactivity using Proxies and effects.

Its biggest performance improvement was not merely introducing Proxy-based tracking.

It was combining:

```txt
Dependency Tracking
+
Compiler Hints
+
Optimized Virtual DOM
```

For example:

```html
<div>
  <h1>Hello</h1>
  <p>{{ name }}</p>
</div>
```

The compiler knows:

```txt
<h1> static
<p> dynamic
```

and generates patch flags.

During updates Vue can skip large portions of the Virtual DOM tree and patch only known dynamic regions.

This significantly reduces reconciliation work compared to traditional Virtual DOM approaches.

---

# Svelte 3/4

Svelte 3 and 4 are frequently mischaracterized as component-level rendering systems.

In reality, only the scheduling is component-oriented.

The DOM updates themselves are binding-oriented.

Example:

```html
<h1>{name}</h1>
<button>{count}</button>
```

Compiles into something conceptually similar to:

```js
function update(dirty) {
    if (dirty & NAME) {
        h1.textContent = name;
    }

    if (dirty & COUNT) {
        button.textContent = count;
    }
}
```

When:

```js
name = "Mary";
```

Only the instructions associated with `name` execute.

No Virtual DOM exists.

No template diff occurs.

This makes Svelte 3/4 an example of:

```txt
Component Scheduling
+
Binding-Level DOM Updates
+
Compiler-Generated Rendering
```

---

# Svelte 5

Svelte 5 introduces signals through runes.

Rather than organizing updates primarily around component boundaries, dependencies are tracked through reactive effects.

Conceptually:

```txt
Signal Changed
    ↓
Reactive Effect
    ↓
Generated DOM Updates
```

Unlike Solid, much of the reactive structure is still compiler-generated rather than entirely runtime-driven.

This continues Svelte's philosophy of moving work from runtime into compilation.

---

# Solid

Solid represents one of the clearest examples of fine-grained reactivity.

```jsx
const [count, setCount] = createSignal(0);
```

Dependencies form a runtime graph:

```txt
count
  ↓
effect
  ↓
DOM node
```

When the signal changes:

```txt
Signal Changed
    ↓
Effect Executes
    ↓
DOM Mutation
```

No component re-render occurs.

No Virtual DOM exists.

The dependency graph directly determines which effects execute.

---

# Alpine

Alpine uses Vue's reactivity system internally.

Updates are generally organized around directives and effects.

```txt
Signal Changed
    ↓
Directive Effect
    ↓
Expression Evaluation
    ↓
DOM Update
```

Alpine demonstrates another important lesson:

> Signals alone do not determine rendering performance.

Although Alpine uses dependency tracking and effects, it performs significantly more runtime expression evaluation than compiler-driven frameworks such as Svelte.

For most Alpine use cases this tradeoff is entirely acceptable because simplicity and bundle size are prioritized over maximum rendering throughput.

---

# Understanding Effect-Level Updates

Effect-level updates are often misunderstood.

Many developers assume:

```txt
One Binding
=
One Effect
```

This is not necessarily true.

Consider:

```html
<p>{name}</p>
<span>{name}</span>
```

One framework may generate:

```txt
name
  ↓
effect A
  ↓
<p>
```

```txt
name
  ↓
effect B
  ↓
<span>
```

Another framework may generate:

```txt
name
  ↓
effect A
  ↓
<p>
<span>
```

Both are effect-level systems.

The exact performance characteristics depend on how effects are grouped and scheduled.

---

# Conclusion

Framework performance is not determined by a single feature.

Not by signals.

Not by dirty checking.

Not by Virtual DOM.

Instead, performance emerges from the interaction of four independent layers:

1. Change Detection
2. Scheduling Granularity
3. DOM Update Granularity
4. DOM Update Strategy

Two frameworks can use identical reactivity systems while exhibiting completely different rendering performance.

Likewise, two frameworks can use radically different change detection techniques yet achieve similar runtime characteristics.

The question is therefore not:

> Does this framework use signals?

The better questions are:

> How does it detect changes?

> How much work gets scheduled?

> How much UI work executes?

> How does it determine which DOM mutations to perform?
