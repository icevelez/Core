# Introduction

## What is Core?

Core is a browser-first JavaScript frontend framework for building modern web applications without requiring a mandatory build pipeline. It combines fine-grained reactivity, runtime compiler optimizations, and a component-based architecture to help you build user interfaces while maintaining excellent performance and a streamlined development experience.

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

That example demonstrates several of core design principles

- HTML Components: Build applications using self-contained HTML-based components.

- Fine-Grained Reactivity: Core automatically update only the DOM nodes affected by state changes.

The example above introduces the core ideas behind Core. Don't worry if every detail isn't immediately clear—the rest of the documentation will build on these concepts step by step. For now, focus on understanding the overall approach and what Core brings to modern web development.

> [!IMPORTANT] 
> Core builds on the foundations of the web, so this documentation assumes basic familiarity with HTML, CSS, and JavaScript. If you're new to frontend development, we recommend spending some time learning these technologies first before adopting a framework.

--- 

## The Browser-First Framework

Core is a browser-first framework designed around a simple idea:

> The browser is powerful enough to be the runtime, not merely the destination of a build process.

Modern frontend development often begins with package managers, bundlers, transpilers, compilers, and build pipelines before an application ever reaches the browser. While these tools provide powerful capabilities, they also introduce complexity that may not be necessary for every project.

Core takes a different approach. It embraces the web platform directly and provides modern framework features without requiring a mandatory build step.

Depending on your needs, Core can be used in different ways:

- Creating interactive dashboards and web applications
- Developing Single-Page Applications (SPA)
- Building reusable HTML components
- Embedding self-contained widgets into existing websites
- Integrating with traditional server-rendered stacks such as Laravel, Rails, Django, Express, Bun, or PHP
- Building applications entirely in the browser using native ES Modules

If some of these concepts are unfamiliar, don't worry. The documentation focuses on the fundamentals first, and you can learn Core without needing prior experience with other frameworks.

If you're an experienced developer, you'll find that Core fits naturally alongside existing technologies. It does not require replacing your backend, build tools, or deployment workflow. Instead, it aims to provide a lightweight and modern frontend layer that can be adopted incrementally.

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
    }
</script>

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
>
> Once served over `http://` or `https://`, the example will work normally in the browser.

--- 

## What's Next?

Check out the `/Essentials` folder for a step by step guide on each concept in Core
