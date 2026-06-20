# Core Reactivity Utilities

Core Reactivity Utilities are a collection of reactive wrappers around common JavaScript and browser APIs. They integrate with Core's signal system so updates automatically propagate through effects, derived values, and the UI. These utilities are designed to feel familiar to developers while remaining fully reactive.

---

## Installation

Add the reactivity module to your import map:

```html
<script type="importmap">
{
    "imports": {
        "core/reactivity": "https://cdn.jsdelivr.net/gh/icevelez/Core@master/core/reactivity.js"
    }
}
</script>
```

Then import the utilities you need:

```js
import {
    CoreMap,
    CoreSet,
    CoreMediaQuery,
    CoreDate,
    CoreURL
} from "core/reactivity";
```

---

# CoreMap

A reactive alternative to `Map`.

Internally, `CoreMap` stores entries in a plain object and uses signals to notify subscribers whenever entries are added, updated, or removed. 

## Creating a Map

```js
const users = new CoreMap([
    ["john", { id: 1 }],
    ["jane", { id: 2 }]
]);
```

## Reading Values

```js
users.get("john");
users.has("jane");
```

## Updating Values

```js
users.set("john", {
    id: 1,
    active: true
});
```

## Removing Values

```js
users.delete("jane");
users.clear();
```

## Iteration

```js
for (const [key, value] of users) {
    console.log(key, value);
}
```

```js
users.keys();
users.values();
users.entries();
```

## Size

```js
console.log(users.size);
```

---

# CoreSet

A reactive alternative to `Set`.

Internally, values are stored in a plain object and updates are tracked through signals. 

## Creating a Set

```js
const tags = new CoreSet([
    "frontend",
    "javascript"
]);
```

## Adding Values

```js
tags.add("core");
```

## Checking Values

```js
tags.has("javascript");
```

## Removing Values

```js
tags.delete("frontend");
tags.clear();
```

## Iteration

```js
for (const tag of tags) {
    console.log(tag);
}
```

```js
tags.values();
tags.keys();
tags.entries();
```

## Size

```js
console.log(tags.size);
```

---

# CoreMediaQuery

A reactive wrapper around `window.matchMedia()`.

`CoreMediaQuery` automatically tracks whether a media query currently matches and updates reactively whenever the browser state changes. 

## Creating a Media Query

```js
const mq = new CoreMediaQuery(
    "(max-width: 768px)"
);
```

## Reading the Current State

```js
console.log(mq.current);
```

```js
effect(() => {
    console.log(
        "Mobile:",
        mq.current
    );
});
```

## Disposal

When the media query is no longer needed:

```js
mq.dispose();
```

This removes the underlying `matchMedia` listener. 

---

# CoreDate

A reactive wrapper around JavaScript's `Date`.

Instead of mutating a `Date` object directly, `CoreDate` stores a reactive timestamp. Any modifications automatically update dependent computations. 

## Creating a Date

```js
const date = new CoreDate();
```

```js
const date = new CoreDate(
    "2026-01-01"
);
```

## Reading Values

```js
date.timestamp;
date.value;
```

```js
console.log(
    date.toISOString()
);
```

## Updating the Date

```js
date.setFullYear(2027);
```

```js
date.setMonth(11);
```

```js
date.setDate(25);
```

```js
date.setHours(10, 30);
```

```js
date.setMinutes(45);
```

```js
date.setSeconds(15);
```

```js
date.setMilliseconds(500);
```

All mutating methods update the reactive timestamp and notify subscribers automatically. 

## Example

```js
const date = new CoreDate();

effect(() => {
    console.log(
        date.toISOString()
    );
});

date.setFullYear(2030);
```

---

# CoreURL

A reactive wrapper around the browser's `URL` API.

Rather than storing a mutable URL instance, `CoreURL` stores a reactive `href` string. Every property access is derived from the latest URL value. 

## Creating a URL

```js
const url = new CoreURL(
    "https://example.com/path?x=1"
);
```

## Reading Properties

```js
url.href;
url.protocol;
url.hostname;
url.pathname;
url.search;
url.hash;
```

Example:

```js
console.log(url.hostname);
// example.com
```

## Updating Properties

```js
url.hash = "#profile";
```

```js
url.pathname = "/dashboard";
```

```js
url.search = "?page=2";
```

```js
url.hostname = "api.example.com";
```

Every change updates the reactive `href` value and notifies dependents.  

## Example

```js
const url = new CoreURL(
    location.href
);

effect(() => {
    console.log(
        url.pathname
    );
});

url.pathname = "/settings";
```

---

# Why These Utilities Exist

Many built-in browser and JavaScript APIs are mutable but not reactive. Updating a `Map`, `Set`, `Date`, or `URL` normally does not notify your application that something changed.

Core Reactivity Utilities bridge that gap by wrapping familiar APIs with signals, allowing them to participate naturally in Core's reactive system.

```js
const users = new CoreMap();

effect(() => {
    console.log(users.size);
});

users.set("john", {});
// effect automatically re-runs
```

This allows common data structures and browser APIs to behave like first-class reactive state while preserving APIs that feel familiar to JavaScript developers.
