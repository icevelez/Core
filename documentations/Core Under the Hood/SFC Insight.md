# SFC Insight

One question you might have about Core is:

> How can Core provide a Single File Component (SFC) experience similar to Vue or Svelte while running entirely in the browser?

The answer is that Core's SFC support was not originally planned. It emerged naturally from the evolution of Core's rendering architecture and several attempts to simplify component authoring.

This document explains that journey.

---

## Before Single File Components

Prior to Core v0.5.0, components were authored entirely in JavaScript. I call it JSC (JavaScript Components)

A typical component looked like this:

```js
import { component } from "core/handlebar";

export default component({
    template: "..."
}, class {
    // state and UI logic
});
```

The template could either be provided directly as a string or loaded separately using the built-in `load()` provided by Core.

Core would then:

1. Generate a render function based from the template.
2. Instantiate the class.
3. Use the class instance as the template's data source.

---

## Early Scope Resolution

One of the challenges during early versions of Core was resolving variable references inside template expressions.

In v0.3.0, Core generated expressions using a parameter expansion approach:

```js
const func = new Function(...keys, expression);
func(...values);
```

This worked, but it required converting the component instance into separate arrays of keys and values for every expression evaluation.

While functional, the implementation was verbose and added unnecessary complexity.

---

## The `$` Prefix

Core v0.4.0 introduced a simpler solution.

Instead of generating functions with dynamic parameters, templates could access component state through a special object reference:

```js
$.name
$.count
$.items
```

Internally, the render function received the component instance as `$`.

```js 
function render_function($) {}
```

This removed the need for:

```js
new Function(...keys)
```

and significantly simplified template code generation.

---

## The First SFC Experiment

While developing v0.3.0, an idea emerged:

*"What if Core components could be authored as a single file containing both script and template?"*

The prototype worked like this:

1. Download the component file.
2. Extract the `<script>` block.
3. Extract the template.
4. Create a Blob from the script content.
5. Generate a URL using:

```js
URL.createObjectURL(blob)
```

6. Import the Blob URL as a JavaScript module.

```js
const module = await import(blob_url);
```

Meanwhile, the template would continue through Core's existing rendering pipeline.

A small proof-of-concept was created on May 7, 2025.

Although it worked, it initially seemed more like an experiment than a practical direction for the framework.

---

## Core v0.4.0

As development continued, Core v0.4.0 expanded support for multiple component authoring styles:

### JavaScript Components (JSC)

```js
component({...}, class {})
```

### Function Components

```js
function($) {
  $.name = signal("john")
}
```

### Single File Components (SFC)

```html
<script>
export default class {
    message = "World"
}
</script>

<h1>Hello {{ message }}!</h1>
```

At this point, all formats were supported.

However, one annoyance remained.

The `$` prefix.

---

## The Problem

Although the `$` prefix simplified render generation, writing:

```js
$.count
$.name
$.items
```

felt less natural than:

```js
count
name
items
```

The question became:

> Is there a way for template expressions to naturally share the component's variable scope?

Several approaches were explored.

### Variable Interception

Many attempts were made to determine whether JavaScript could intercept variable declarations inside functions.

No practical solution was found.

### Class Property Interception

Another idea was intercepting class fields before instantiation.

Again, no solution emerged.

The problem appeared fundamentally constrained by JavaScript's lexical scoping rules.

---

## The Realization

While working on SFC support, an observation changed everything.

Core already processed the script block before importing it.

That meant Core already had access to the user's source code.

The realization was:

> If Core can modify the script before importing it, why not inject the render code directly into the user's component function?

Instead of generating a separate render function and trying to bridge scopes later, Core could place the render code inside the same scope as the user's variables.

The result looked like this:

```js
export default function() {
    // user code

    // render code injected here
}
```

Now the render logic and component logic shared the same lexical scope.

No `$` prefix was required.

No object lookup layer was required.

No dynamic scope reconstruction was required.

The browser's own scope resolution system handled everything naturally.

---

## Signals and the New Authoring Model

This architectural shift also enabled a cleaner reactive API.

Older signal syntax resembled Angular Signals because we originally authored components as Class similar to Angular

```js
const name = signal("john");

name();
name.set("mary");
```

After moving to function-based components, Core adopted a getter/setter pair:

```js
const [name, setName] = signal("john");

setName("mary");
```

This made authoring feel more familiar to developers coming from React and Solid.

---

## Why It Works

The key insight behind Core's SFC implementation is surprisingly simple:

Core does not attempt to recreate JavaScript scope.

Instead, it injects rendering logic into the same scope where the user's code already exists.

Rather than teaching the renderer about component state:

```text
Template
    ↓
Find State
    ↓
Resolve Scope
```

Core reverses the relationship:

```text
User Scope
    ↓
Inject Render Logic
    ↓
Execute Together
```

The browser becomes responsible for scope resolution because both pieces of code live in the same function.

---

## The Result

This approach allows Core to provide a modern Single File Component authoring experience entirely in the browser without requiring a build step.

The final developer experience feels similar to frameworks like Vue and Svelte:

```html
<script>
    import { signal } from "core";

    export default function() {
        const [count, setCount] = signal(0);
    }
</script>

<button on:click="() => setCount(count() + 1)">
    Count is: {{ count() }}
</button>
```

Yet under the hood, the implementation emerged from a much simpler realization:

> If the compiler already controls the source code before import, the easiest way to share scope is to place the render logic inside it.

---

## In Retrospect

Looking back, the resulting architecture bears a surprising resemblance to modern compiler output.

For example, a simplified Svelte 5 render function:

```js
export default function App($$anchor) {
    let name = $.state('world');

    function change() {
        $.set(name, 'Hello');
    }

    // generated render code
}
```

User code and render code exist within the same function scope.

Core arrived at a similar structure independently.

```js
export default function() {
    const [name, setName] = signal("john");

    // generated render code injected here
}
```

The underlying implementations differ, but the final shape is remarkably similar. 

---

An interesting parallel can also be found in React's evolution toward Hooks. In the talk *React Today and Tomorrow and 90% Cleaner React With Hooks*, Dan Abramov explained that one advantage of function components is that rendering logic naturally shares the same lexical scope as component state, eliminating the need for patterns such as:

```js
this.state.name
this.props.title
```

because variables can be referenced directly:

```js
const [name, setName] = useState("john");

return <h1>{name}</h1>;
```

Although Core arrived at its architecture independently through its SFC compilation model, it ultimately benefited from the same property: user code and generated rendering code exist within the same lexical scope, allowing variables to be referenced naturally without additional indirection.

--- 

## What This Means

As a consequence, the older component authoring styles were removed:

### JavaScript Components (JSC)

```js
export default component({...}, class {

});
```

### Function Scope Components

```js
export default function($) {

}
```

Both formats required Core to bridge the gap between component state and template execution through an intermediate scope object.

With Single File Components, that bridge is no longer necessary.

```html
<script>
    import { signal } from "core";

    export default function() {
        const [name, setName] = signal("John");
    }
</script>

<h1>{{ name() }}</h1>
```

The template and component logic naturally share the same lexical scope because the generated rendering code is injected into the same function as the user code.

In retrospect, this greatly simplified Core's architecture:

```text
v0.3.0
=======
Template
    ↓
Extract Variables
    ↓
Generate Function Parameters
    ↓
Evaluate

v0.4.0
=======
Template
    ↓
Generate $.variable Access
    ↓
Evaluate

v0.5.0
=======
Template
    ↓
Inject Render Code
    ↓
Use Native JavaScript Scope
```

What began as an attempt to remove the `$` prefix ultimately led to a simpler rendering model, a cleaner component API, and the adoption of Single File Components as the primary component format in Core.

In many ways, Core v0.5.0 stopped trying to emulate scope and instead started relying on JavaScript's own lexical scoping system. Once that became possible, supporting multiple component authoring models no longer provided enough benefits to justify the additional complexity.
