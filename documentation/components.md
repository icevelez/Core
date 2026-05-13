# 📘 Components

A self-contained, reusable building block that represents a piece of UI along with its associated logic, styles, and behavior.

> “A small, independent unit of an interface that manages its own data, rendering, and interaction.”

## 1 Creating Components

### ✅ Basic Usage

To create components you must use the `component` function from `core/handlebar.js`

```js
import { component } from "/core/handlebar.js";

export default component({
    // Directly embedding template inside a component
    template: `
        <h1>Hello World!</h1>
    `
});
```

### ✅  Adding in data and logic to your component
```js
import { component } from "/core/handlebar.js";
import { createSignal } from "/core/reactivity.js";

export default component({
    template: `
        <h1>Hello {{ $.name }}</h1>
        <button on:click="() => $.count.set(count() + 1)">Count: {{ $.count() }}</button>
    `
}, class {
    name = "Viewer"
    count = createSignal(0);

    constructor() {}
});
```

### ✅  Using the `load` function to load an html template
```js
import { load } from "/core/core.js";
import { component } from "/core/handlebar.js";

export default component({
    template: await load("src/App.html")
});
```

## 2 Importing Components

### ✅ Usage
```js
import { load } from "/core/core.js";
import { component } from "/core/handlebar.js";

import CustomComponent from "./components/CustomComponent.js";
import AnotherComponent from "./components/AnotherComponent.js";

export default component({
    template: await load("src/App.html"),
    component : {
        CustomComponent,
        AnotherComponent
    }
});
```

## 3 Using imported Component

### ✅ Self-closing components
```html
<CustomComponent />
```

### ✅ Component with children
```html
<AnotherComponent>
  <h1>This is a child element</h1>
</AnotherComponent>
```

## 4 Custom Component Attributes

### ✅ Supports passing any expression as an attribute:
```html
<MyButton on:click="() => $.submit($.form)" :text="$.buttonText" />
```

## 5 Component Content Insertion

`<Core:slot/>` is a special element that allows content from the parent component to displayed inside a section of the child component.

> A component with a `<Core:slot/>` will only use the first element found, any other slot element will be ignored and removed

> in v0.1.1 and below. the syntax was `<Slot>`

---

### ✅ Basic Usage

**Component Definition:**

```html
<!-- MyComponent.html -->
<div class="card">
  <Core:slot/>
</div>
```
```html
<MyComponent>
  <h1>Hello from outside</h1>
</MyComponent>
```

---
