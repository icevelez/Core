# Runtime Compilation Trade-offs

Core takes a different approach from frameworks that compile components ahead of time. Instead of requiring a build step to transform templates into JavaScript, Core ships its compiler and performs compilation in the browser.

When a component is loaded, Core parses its template, discovers the DOM and reactive instructions, and generates a specialized render function. After compilation, the generated function is used for rendering and updates; the template does not need to be interpreted again.

This approach provides several benefits, but it also introduces a deliberate trade-off.

## Why runtime compilation?

Core's compiler is designed to produce specialized render functions rather than a general-purpose virtual DOM representation. The generated code is inspired by the approach used by Svelte: the compiler knows the structure of the component and can generate code specifically for that component.

This allows Core to avoid carrying a virtual DOM through the update path while still retaining the flexibility of compiling components at runtime.

The result is a model that looks roughly like this:

```text
Template
   │
   ▼
Runtime Compiler
   │
   ├─ Parse template
   ├─ Discover DOM instructions
   └─ Generate specialized render function
   │
   ▼
DOM + Reactive Updates
```

Once the render function has been generated, subsequent updates use the compiled function directly.

## Performance benefits

Runtime compilation introduces an initial cost, but the compiler only needs to run once for a component.

In a benchmark rendering 10,000 rows, Core's measured initial render after compilation averaged **76.51 ms**, while its warm update averaged **65.48 ms**.

For comparison, the same benchmark measured:

* Svelte: 58.92 ms initial / 59.71 ms warm
* Vue: 89.69 ms initial / 89.62 ms warm
* React: 205.59 ms initial / 104.87 ms warm

Core does not eliminate the advantage of ahead-of-time compilation. Svelte, for example, can begin execution with an already-generated render function because its compiler runs during development/build time.

However, Core's results show that moving compilation into the browser does not necessarily impose a large ongoing runtime cost. Once compilation has completed, Core's update path remains relatively close to that of an ahead-of-time compiled framework.

Core also avoids the additional VDOM representation and reconciliation work used by VDOM-based frameworks such as Vue and React.

## The runtime compilation cost

The trade-off is that a Core component cannot be rendered immediately from its source template.

The component must first be:

1. Loaded
2. Parsed by the runtime compiler
3. Converted into instructions
4. Compiled into a specialized render function
5. Evaluated
6. Rendered

In the 10,000-row benchmark, compilation of the two application templates took:

```text
App.html          4.02 ms
Benchmark.html    6.79 ms
------------------------
Total            10.81 ms
```

This compilation time was **not included** in Core's reported initial-render measurements.

Therefore, the benchmark's 76.51 ms initial-render result represents rendering **after the render functions have already been generated**. The complete cold path would include the one-time compilation cost as well.

For these templates, that gives an approximate:

```text
Runtime compilation     10.81 ms
Initial render           76.51 ms
-------------------------------
Compilation + render    ~87.32 ms
```

The exact cost will depend on the size and complexity of the components being compiled.

## Bundle size trade-off

Runtime compilation also changes what needs to be delivered to the browser.

Unlike Svelte and Vue, where application components can be compiled during the build process, Core must ship the compiler itself.

In this benchmark, the total compressed payload was:

| Framework | Total payload |
| --------- | ------------: |
| Svelte    |       29.2 KB |
| **Core**  |   **37.6 KB** |
| Vue       |       46.5 KB |
| React     |       83.2 KB |

Core's payload is therefore larger than Svelte's because it includes the runtime compiler, but it remains smaller than Vue and substantially smaller than React in this particular application.

The Core payload consisted of:

```text
runtime.js       6.5 KB
compiler.js      7.8 KB
App.html         1.0 KB
Benchmark.html  21.6 KB
index.html       0.7 KB
-----------------------
Total           37.6 KB
```

### The compiler accounts for much of the difference

An interesting way to look at the bundle-size trade-off is to remove the compiler from Core's payload.

Core's total payload is **37.6 KB**, of which the compiler contributes **7.8 KB**:

```text
Core total              37.6 KB
Compiler                -7.8 KB
-------------------------------
Without compiler       ~29.8 KB
```

That is approximately the same size as Svelte's **29.2 KB** payload in this benchmark.

The comparison can also be viewed in the opposite direction. If the Svelte application were required to ship a compiler of roughly the same size as Core's 7.8 KB compiler, its payload would become approximately:

```text
Svelte                  29.2 KB
+ Core compiler size     7.8 KB
-------------------------------
≈                       37.0 KB
```

That is again very close to Core's **37.6 KB** total.

This is not intended to imply that Svelte's actual compiler would be exactly 7.8 KB when shipped to the browser; Svelte's compiler is not designed or packaged as a runtime compiler in this benchmark. Instead, this comparison illustrates the architectural cost of moving compilation from build time to runtime.

In other words, much of Core's additional payload relative to Svelte can be understood as the cost of **shipping the compiler that Svelte runs before deployment**.

This makes the compiler both Core's primary bundle-size cost and one of the defining capabilities of its build-free architecture.

## The trade-off

Core's runtime compiler is therefore a deliberate exchange.

**Advantages**

* No mandatory build step for compiling components
* Components can be compiled directly in the browser
* Generated render functions are specialized for each component
* No VDOM representation is required for updates
* Compilation happens only once per component
* The resulting update path can remain lightweight
* The compiler can be part of the runtime rather than the development toolchain
* Without the compiler, Core's measured application payload is approximately comparable to Svelte's

**Costs**

* The compiler must be shipped to the browser
* Components incur a one-time compilation cost before their first render
* Initial loading can be slower than an equivalent ahead-of-time compiled component
* The compiler itself consumes network and memory resources
* Core cannot completely match the cold-start characteristics of a framework whose components are already compiled

The goal of Core is therefore not to claim that runtime compilation is universally better than ahead-of-time compilation. Instead, Core explores whether the benefits of generating specialized render functions can be retained while moving compilation into the browser.

The benchmark suggests that this trade-off can be relatively small: Core incurs a measurable one-time compilation cost and carries the compiler in its payload, but after compilation its rendering and update performance remains competitive with ahead-of-time compiled frameworks while retaining a build-free, browser-centric architecture.

### Architectural comparison

|                                   | Core                                                 | Svelte                       | Vue                                 | React                      |
| --------------------------------- | ---------------------------------------------------- | ---------------------------- | ----------------------------------- | -------------------------- |
| Reactivity                        | Signal/dependency tracking                           | Signal/dependency tracking   | Signal/dependency tracking          | View-tree / reconciliation |
| Compilation                       | **Runtime**                                          | Build-time                   | Build-time                          | JSX build transform        |
| Intermediate representation       | **Specialized render function**                      | Specialized render function  | Optimized VDOM render function      | React element/view tree    |
| Compiler optimizations            | Runtime template → instructions → generated renderer | Ahead-of-time specialization | VDOM hints, static hoisting, blocks | JSX transformation         |
| Compiler included in payload      | **Yes**                                              | No                           | No                                  | No                         |
| Compilation cost included in benchmark | **No**                                               | N/A                          | N/A                                 | N/A                        |
| Minified                          | No                                                   | Yes                          | Yes                                 | Yes                        |
| Gzipped                           | Yes                                                  | Yes                          | Yes                                 | Yes                        |
| Cold compilation cost             | **~10.81 ms** in this test                           | Build-time                   | Build-time                          | Build-time JSX transform   |
| Initial render benchmark          | 76.51 ms                                             | **58.92 ms**                 | 89.69 ms                            | 205.59 ms                  |
| Warm update                       | 65.48 ms                                             | **59.71 ms**                 | 89.62 ms                            | 104.87 ms                  |

### Compilation happens on the main thread

Core's runtime compiler executes in the browser's main thread. Every component that needs to be compiled introduces additional work before that component can be rendered.

With an ahead-of-time compiled framework, compilation happens during development or the application's build process:

```text
Development / Build
        │
        ├── Component A → compiled
        ├── Component B → compiled
        ├── Component C → compiled
        └── Component D → compiled
                 │
                 ▼
              Browser
                 │
               render
```

The browser receives components that are already transformed into executable code.

Core instead performs this work when the components are loaded:

```text
Browser
   │
   ├── Component A → compile → render
   ├── Component B → compile → render
   ├── Component C → compile → render
   └── Component D → compile → render
```

Consequently, loading more components can mean more compilation work on the main thread.

```text
More components
      │
      ▼
More templates to compile
      │
      ▼
More main-thread work
      │
      ▼
More time before components are ready
```

This is one of the fundamental costs of Core's runtime compilation model.

### Dynamism has a cost

The ability to dynamically load and render a component without a build step is useful:

* Components can be loaded dynamically.
* Templates can be deployed without first being compiled.
* Applications do not require a mandatory compilation pipeline.
* Components that were not known when the application was built can still be compiled and rendered.
* Compilation can happen only when a component is actually loaded.

For example, an application can load a component and allow Core to compile it at runtime:

```text
Application
│
├── Dashboard  ← loaded + compiled
├── Settings   ← not loaded
├── Reports    ← not loaded
└── Admin      ← not loaded
```

In this case, Core does not need to compile components that the user never loads.

However, this does not make runtime compilation free. When those components eventually load, their compilation work is performed by the user's browser.

Modern build systems can achieve similar loading behavior through code splitting, so this should not be considered an advantage unique to Core. Core's distinction is that the dynamically loaded component can remain a template until it reaches the browser.

### A deliberate cost-shifting strategy

Core does not eliminate compilation; it moves part of the compilation cost from the development environment to the user's browser.

```text
Ahead-of-time compilation

Build machine
      │
      ▼
  compilation
      │
      ▼
compiled components
      │
      ▼
   Browser
```

```text
Core

Development
      │
      ▼
  source templates
      │
      ▼
   Browser
      │
      ▼
  compilation
      │
      ▼
compiled components
```

This makes the trade-off straightforward:

|                           | Ahead-of-time compilation         | Core runtime compilation                      |
| ------------------------- | --------------------------------- | --------------------------------------------- |
| Compilation               | Build time                        | Component load time                           |
| Browser compiler          | Not required                      | Required                                      |
| Initial component cost    | Lower                             | Higher                                        |
| Main-thread compilation   | None                              | Yes                                           |
| Build requirement         | Required                          | Not required                                  |
| Runtime component loading | Usually requires pre-built chunks | Can compile templates directly                |
| Unused components         | Can be code-split                 | Can remain completely uncompiled until loaded |

Core therefore exchanges some initial runtime performance for flexibility.

For applications with many components loaded simultaneously, the additional compilation work can become significant because it is performed on the main thread. For applications that benefit from dynamically loading relatively few components, compiling only what is actually used can reduce unnecessary work.

The important distinction is that **runtime compilation is a capability with a cost, not a free performance optimization**. Core's goal is to make that trade-off worthwhile by compiling each component only once and generating a specialized render function that can be used for all subsequent rendering and reactive updates.
