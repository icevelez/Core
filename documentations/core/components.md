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

### ✅  Adding in scoped data to your component

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

});
```

> Important Note: You are requires to add a `$.` prefix before the variable name in your template to access said variable. 
> 
> It is a developer ergonomic trade-off as the `$` represent the `Class` object of your component. 
>
> *"But Other frameworks don't require me to do any prefix, it knows the variable names automatically. How come Core v0.4.0 requires a prefix?"*
>
> Yes, other frameworks doesn't require a prefix because most frameworks like Svelte, Solid, Vue uses an **Abstract Syntax Tree** to parse through framework specific filetype like `.vue`, `.svelte`, and `.tsx` to collect each variable name at compile time and unfortunately, Core v0.4.0 doesn't have the luxury of adding an AST parser because it would increase the bundle size so I decided to use a prefix as a means of access the Class instance properties of your component 
> 
> *"But Vue 2 doesn't require any prefix and it has a no-build-step / CDN option"*
>
> Vue 2 uses the `with` statement to extend the scope of its render functions and while it is an attractive option to remove the need for a prefix, it is not recommended as its a deprecated feature and makes optimization impossible.

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

# Passing Props

Props use the `:` prefix syntax for evaluating JS expression. Core.js would treat one without a prefix as a static value

Example:

```html
<MyComponent :name="`${$.name()} ${$.count()}`"/>
```

```html
<MyComponent name="Static John"/>
```

Props may contain:

* signals
* expressions
* template literals
* computed values

```js
import { load } from "/core/core.js";
import { component } from "/core/handlebar.js";

export default component({
    template: await load("src/MyComponent.html"),
} class {

    constructor(props) {
        this.props = props; // ✅ this preserves reactivity
        this.name = props.name; // 🚫 this loses reactiity
    }
});
```
---

# Scope Object instead of Class 

It is also possible to use a function that receives a mutable scope object (`$`) 

```js
import { component } from "./core/parser/handlebar.js";
import { signal } from "./core/runtime.js";

export default component({
    template : "..."
}, function ($) {

    $.counter = signal(0);
    $.name = signal("John");
    $.onMount = () => console.log("Hello I have been mounted");
    
})
```
