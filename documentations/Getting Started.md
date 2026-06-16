# Introduction

## What is Core?

> Core is a browser-first JavaScript framework for building modern web applications using HTML components, fine-grained reactivity, and runtime compiler optimizations—all without requiring a mandatory build pipeline.

Core embraces the capabilities of the modern web platform while providing the features developers expect from contemporary frontend frameworks.

Whether you're building a small interactive widget or a large Single-Page Application, Core scales using the same concepts and APIs.

Here is a starting example:
```html
<!-- App.html -->
<script>
    import { signal } from "core";
    
    export default function() {
        const [count, setCount] = signal(0);
    }
</script>

<button on:click="() => setCount(count()+1)">
    Count is: {{ count() }}
</button>
```

```html
<!-- index.html -->
<html>
    <head>
        <
    </head>
    <body>
        <div id="app"></div>
        <script type="module">
            import { component } from "core/handlebar";
            import { mount } from "core";
            
            const App = await component("App.html");
            mount(App, "#app");
        </script>
    </body>
</html>
```

Even though the example is minimal, it demonstrates two of Core's key features.

- HTML Components - Components are authored using familiar HTML and JavaScript.

This keeps components close to the web platform while remaining expressive enough for complex applications.

- Fine-Grained Reactivity - Core automatically tracks reactive state and updates only the UI affected by a state change.

When `count` changes, Core updates the text displaying the value rather than rerendering the entire component.

---

The example above introduces the fundamental ideas behind Core. Don't worry if every detail isn't immediately clear—the rest of the documentation will build on these concepts step by step.

For now, focus on understanding the overall approach and what Core brings to modern web development.

> [!IMPORTANT] 
> Core builds on the foundations of the web, so this documentation assumes basic familiarity with HTML, CSS, and JavaScript. If you're new to frontend development, we recommend spending some time learning these technologies first before adopting a framework.

--- 

# The Browser-First Framework

Core is built around a simple idea:

> The browser is capable of being the runtime—not merely the destination of a build process.

Modern frontend development often involves package managers, bundlers, transpilers, compilers, development servers, and build pipelines before an application ever reaches the browser.

These tools are valuable and solve real problems, but they are not always necessary.

Core takes a different approach.

By leveraging modern browser capabilities such as:

* ES Modules
* Import Maps
* HTML Templates
* Native DOM APIs

Core can provide modern framework features while remaining directly executable in the browser.

---

## Use Core For

Core can be used for a wide variety of applications:

* Interactive websites
* Dashboards and internal tools
* Single-Page Applications (SPA)
* Embedded widgets
* Reusable component libraries
* Progressive enhancement
* Server-rendered applications

It integrates naturally with existing stacks such as:

* Laravel
* Rails
* Django
* Express
* Bun
* PHP

and can also be used to build fully browser-native applications.

---

## A Different Tradeoff

Core is not trying to replace every frontend workflow.

Instead, it explores a different set of tradeoffs.

Core favors:

* Browser-native development
* Runtime flexibility
* Incremental adoption
* Fine-grained updates
* Minimal tooling requirements

while acknowledging that other ecosystems may provide:

* Larger component ecosystems
* TypeScript-first workflows
* More extensive tooling
* Additional build-time optimizations

If you're looking for a framework that embraces the web platform directly while still providing modern application architecture, Core may be a good fit for you.

--- 

## Single-File Components

Single-File Components (SFCs) are the primary way of authoring user interfaces in Core.

An SFC combines a component's template (HTML), logic (JavaScript), and optional styling (CSS) into a single `.html` file.

```html
<script>
    import { signal } from "core";

    export default function() {
        const [count, setCount] = signal(0);
    }
</script>

<style>
    button {
        padding: 0.5rem 1rem;
    }
</style>

<button on:click="() => setCount(count() + 1)">
    Count is: {{ count() }}
</button>
```

By keeping everything related to a component in one place, SFCs make components easier to develop, understand, and share.

Unlike many frameworks, Core Single-File Components does not require a build step.

---

# Quick Start

## Creating a Core Application

In this section we will introduce how to scaffold a Core Single Page Application on your local machine.

Throughout the rest of the documentation, we will be primarily using ES modules syntax.

```html
<!-- index.html -->
<html>
    <head>
        <title>Quick Start Core Application</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">    
        <script type="importmap">
          {
            "imports": {
                "core/handlebar": "https://cdn.jsdelivr.net/gh/icevelez/Core@master/core/parser/handlebar.js",
                "core": "https://cdn.jsdelivr.net/gh/icevelez/Core@master/core/runtime.js"
            }
          }
        </script>
    </head>
    <body>
        <div id="app"></div>
        <script type="module" defer>
            import { component } from "core/handlebar";
            import { mount } from "core";
            
            const App = await component("App.html");
            mount(App, "#app");
        </script>
    </body>
</html>
```

```html
<!-- App.html -->
<script>
    import { signal } from "core";
    
    export default function() {
        const [count, setCount] = signal(0);
        const [name, setName] = signal("New User");
    }
</script>

<h1>Greetings! {{ name() }}</h1>
<input type="text" :value="name()" on:input="(e) => setName(e.target.value)"/>
<button on:click="() => setCount(count()+1)">
    Count is: {{ count() }}
</button>
```

> [!NOTE]
> In our example we are using [**importmap**](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) to give Core's URL an alias to shorten our import statements
>
> The import map in this example is not restricted to the CDN version of Core. It can just as easily be configured to reference a local copy of Core or a self-hosted server build. This makes Core flexible across different environments, as switching between CDN and local development setups only requires updating the import map, not the application code itself.

> [!IMPORTANT]
> This example must be run through a local or remote web server.
>
> Modern browsers restrict ES modules and import maps when opening files directly via `file://`.
>
> You can use any web server of your choice, such as:
>
> - NGINX / Apache / IIS
> - Node.js (`npx serve`, `npx live-server`)
> - Bun (`bunx serve`, `bunx live-server`)
> - Python (`python -m http.server`)
> - Laravel / Django / Flask / Express / Go / Rust servers
> - VSCode live server extension
>
> Once served over `http://` or `https://`, the example will work normally in the browser.

--- 

## What's Next?

Check out the `/Essentials` folder for a step by step guide on each concept in Core
