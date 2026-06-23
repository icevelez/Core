# Reactivity and Performance in JavaScript Frameworks

A common misconception in frontend development is:

> Signals automatically make a framework faster.

In reality, signals are only one part of the performance system.

Framework performance emerges from four independent layers:

1. **Change Detection** — how state changes are observed
2. **Scheduling Granularity** — what unit of work is scheduled
3. **DOM Update Granularity** — how much UI is affected per update
4. **DOM Update Strategy** — how DOM mutations are computed and applied

These layers are often conflated, leading to incorrect comparisons such as:

> “Signals are faster than Virtual DOM”

or

> “Dirty checking is inefficient”

These statements are incomplete because they mix different architectural layers.

---

# Layer 1: Change Detection

Change detection answers:

> How does the framework know something changed?

| Framework             | Change Detection                                     |
| --------------------- | ---------------------------------------------------- |
| React                 | Explicit state updates (setState / hooks)            |
| Angular (Pre-Signals) | Zone-triggered change detection + binding evaluation |
| Vue 2                 | Getter/Setter dependency tracking                    |
| Vue 3                 | Proxy-based dependency tracking                      |
| Svelte 3/4            | Compile-time invalidation markers                    |
| Svelte 5              | Signals (runes-based reactive primitives)            |
| Solid                 | Signals                                              |
| Alpine                | Proxy-based reactive system                          |

Change detection only answers *what changed*, not how updates occur.

---

# Layer 2: Scheduling Granularity

Scheduling granularity defines:

> What unit of work is executed when state changes?

| Framework             | Scheduling Granularity             |
| --------------------- | ---------------------------------- |
| React                 | Component                          |
| Angular (Pre-Signals) | View tree (with subtree skipping)  |
| Vue 2                 | Watcher → Component                |
| Vue 3                 | Reactive effect → Component update |
| Svelte 3/4            | Component                          |
| Svelte 5              | Reactive effect                    |
| Solid                 | Reactive effect                    |
| Alpine                | Reactive effect                    |

Important: scheduling does NOT describe DOM update efficiency.

---

# Layer 3: DOM Update Granularity

DOM update granularity defines:

> How much of the UI is affected per update execution?

| Framework  | DOM Update Granularity                |
| ---------- | ------------------------------------- |
| React      | Component subtree                     |
| Angular    | Binding-level                         |
| Vue 2      | Component subtree                     |
| Vue 3      | Dynamic VDOM subtree                  |
| Svelte 3/4 | Binding-level (compiled instructions) |
| Svelte 5   | Effect-level                          |
| Solid      | Fine-grained binding/effect-level     |
| Alpine     | Directive-level                       |

---

# Layer 4: DOM Update Strategy

DOM update strategy defines:

> How DOM mutations are determined and executed

| Framework  | DOM Update Strategy                           |
| ---------- | --------------------------------------------- |
| React      | Virtual DOM reconciliation                    |
| Angular    | Binding comparison (dirty checking)           |
| Vue 2      | Virtual DOM reconciliation                    |
| Vue 3      | Compiler-assisted VDOM patching               |
| Svelte 3/4 | Compile-time generated update instructions    |
| Svelte 5   | Compiler-generated reactive effects + signals |
| Solid      | Runtime reactive dependency graph             |
| Alpine     | Reactive directive execution                  |

---

# Why Signals Do Not Guarantee Performance

Consider:

### Framework A

```txt
Signal change
  ↓
Component update
  ↓
VDOM generation
  ↓
Diff
  ↓
DOM update
```

### Framework B

```txt
Signal change
  ↓
Effect executes
  ↓
Direct DOM update
```

Both use signals, but performance differs due to:

* scheduling model
* update granularity
* DOM strategy

Signals only answer:

> What changed?

They do not define how updates are executed.

---

# React

React uses component-based rendering with Virtual DOM reconciliation.

```txt
setState
  ↓
Component scheduled
  ↓
Component re-executes
  ↓
Virtual DOM created
  ↓
Reconciliation
  ↓
DOM updates
```

Strengths:

* predictable rendering model
* composability

Cost:

* component re-execution
* VDOM allocation
* diffing overhead

---

# Angular (Pre-Signals)

Angular performs tree-based change detection with binding evaluation.

```txt
Change detection trigger
  ↓
Traverse view tree
  ↓
Evaluate bindings
  ↓
Compare values
  ↓
Apply DOM updates
```

Angular's binding comparisons are extremely cheap. In isolation, a single binding comparison is typically cheaper than Virtual DOM reconciliation work.

However, Angular must traverse views before reaching those bindings.

This demonstrates an important principle:

> The cost of scheduling and traversal can matter as much as the cost of change detection itself.

> [!NOTE]
> Important nuance:
> Angular is not purely “root-level”; it supports subtree skipping via OnPush and other optimizations.

---

# Vue 2

Vue 2 uses dependency tracking + Virtual DOM.

```txt
Dependency tracked
  ↓
Watcher triggered
  ↓
Component render
  ↓
VDOM diff
  ↓
DOM patch
```

Vue 2's dependency tracking is more selective than Angular's root-level traversal because only dependent watchers are notified.

However, rendering remains component-oriented and Virtual DOM-based.

---

# Vue 3

Vue 3 improves performance via compiler-assisted VDOM optimization.

Key idea:

* static parts are hoisted
* dynamic parts are flagged

```txt
Reactive change
  ↓
Component update
  ↓
VDOM patch (optimized via flags)
  ↓
DOM update
```

Vue still relies on VDOM, but reduces unnecessary diffing.

---

# Svelte 3/4

Svelte 3/4 uses compile-time generated update instructions.

```txt
State change
  ↓
Component marked dirty
  ↓
Generated update function runs
  ↓
Only affected bindings execute
  ↓
DOM updated directly
```

Key property:

* no Virtual DOM
* no runtime diffing
* updates are compiled per binding

This is:

> Component-scheduled + binding-update + compiler-generated execution

---

# Svelte 5

Svelte 5 introduces a hybrid reactive system using signals (runes).

Important distinction:

* reactivity is signal-based at runtime
* updates are compiled into effects

```txt
Signal change
  ↓
effect
  ↓
Generated DOM updates
```

Unlike Solid, Svelte 5 relies more on compiler-generated effect structure rather than fully runtime-managed dependency graphs.

---

# Solid

Solid uses fine-grained runtime reactivity.

```txt
Signal
  ↓
Dependency graph
  ↓
Effect
  ↓
DOM mutation
```

Each reactive dependency directly tracks subscribers.

Key property:

* no component re-render
* updates propagate through runtime graph

---

# Alpine

Alpine uses reactive directives with expression evaluation.

```txt
Signal change
  ↓
Directive re-execution
  ↓
Expression evaluation
  ↓
DOM update
```

Alpine demonstrates another important lesson:

> Signals alone do not determine rendering performance.

Although Alpine uses dependency tracking and effects, it performs significantly more runtime expression evaluation than compiler-driven frameworks such as Svelte.

For most Alpine use cases this tradeoff is entirely acceptable because simplicity and bundle size are prioritized over maximum rendering throughput.

---

# Effect-Level Reactivity Clarification

Effect-level systems differ in implementation:

### Solid

* runtime dependency graph
* minimal, direct subscriptions

### Svelte 5

* compiler-generated reactive effects
* partially pre-wired execution units

Both are effect-based, but:

* Solid = runtime graph construction
* Svelte 5 = compile-time effect generation + runtime signals

---

# Conclusion

Framework performance is determined by the interaction of:

1. Change detection model
2. Scheduling granularity
3. DOM update granularity
4. DOM update strategy

Signals, Virtual DOM, and dirty checking are not performance features by themselves.

They are simply different mechanisms for answering:

> “What changed?”

Actual performance depends on:

> “How much work runs, and how precisely does it map to DOM mutations?”
