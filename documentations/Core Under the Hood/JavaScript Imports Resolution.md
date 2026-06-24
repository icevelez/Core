# JavaScript Imports Resolution

## Overview

Core components are authored as HTML files that contain JavaScript inside a `<script>` block.

```html
<script>
    import { signal } from "core";

    export default function() {
        const [count, setCount] = signal(0);
    }
</script>
```

Unlike a traditional JavaScript module loaded directly from a URL, Core must first load, process, and compile the component before it can execute the component's script.

As part of this process, Core generates a modified JavaScript module and loads it using a browser `URL.createObjectURL()`.

Because of this behavior, import paths inside components require special handling.

---

## Why Import Paths Need Special Handling

Consider the following component:

```html
<script>
    import { format } from "./util.js";
</script>
```

Normally, the browser resolves:

```js
"./util.js"
```

relative to the current module file.

However, Core does not execute the original component file directly.

Instead, Core:

1. Loads the component source.
2. Extracts the `<script>` content.
3. Injects generated render code.
4. Creates a new JavaScript module.
5. Generates a `URL.createObjectURL()`.
6. Imports the generated module.

Conceptually:

```text
App.html
    ↓
Core Compiler
    ↓
Generated JavaScript
    ↓
blob:...
    ↓
import()
```

At this point, the browser no longer knows that the script originally came from `App.html`.

If left unchanged:

```js
import { format } from "./util.js";
```

The browser cannot resolve relative imports against the original component file. Core therefore converts local imports into absolute URLs during compilation.

---

## Import Rewriting

To preserve normal module behavior, Core rewrites relative imports during compilation.

Given:

```html
<script>
    import { format } from "./util.js";
</script>
```

and a component located at:

```text
/components/App.html
```

Core rewrites the import to an absolute URL before generating the module.

Conceptually:

```js
import { format } from "https://example.com/components/./util.js";
```

This ensures imports continue to work exactly as if they were executed from the original component file.

---

## Supported Imports

Core only rewrites imports that appear to be local module paths.

Examples:

```js
import "./util.js";
import "../utils/format.js";
import "/shared/helper.js";
import "parser.js";
```

These imports are converted into absolute URLs relative to the component being compiled.

---

## Imports That Are Not Modified

Imports that already specify their own location are left unchanged.

Examples:

```js
import { signal } from "core";  // skip imports that does not end with ".js"
```

```js
import React from "https://example.com/react.js";
```

```js
import data from "data:text/javascript,...";
```

Core intentionally skips imports whose specifier:

- Starts with `http`
- Starts with `https`
- Starts with `data:`

because these imports already contain enough information for the browser to resolve them correctly.

---

## Import Maps

Import map aliases are also preserved.

```js
import { signal } from "core";
```

Core does not attempt to rewrite this import.

Resolution is delegated to the browser's import map system.

```html
<script type="importmap">
{
    "imports": {
        "core": "/core/runtime.js"
    }
}
</script>
```

This allows component scripts to use import maps normally.

---

## Current Implementation

The current import rewriting mechanism is intentionally simple.

Core searches for module specifiers used in import statements and rewrites local paths before generating the final JavaScript module.

This approach works well for standard imports:

```js
import { foo } from "./foo.js";
```

but should be viewed as a compilation convenience rather than a complete JavaScript parser.

As Core evolves, the implementation may become more sophisticated.

---

## Things To Keep In Mind

When writing component scripts:

✔ Relative imports work.

```js
import "./util.js";
```

✔ Parent directory imports work.

```js
import "../shared/util.js";
```

✔ Absolute site paths work.

```js
import "/shared/util.js";
```

✔ Import map aliases work.

```js
import { signal } from "core";
```

✔ External URLs work.

```js
import { something } from "https://example.com/module.js";
```
