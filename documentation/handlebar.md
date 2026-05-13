# 📘 Handlebar

The handlebar template engine supports dynamic rendering using a Handlebars-inspired syntax. It outputs **actual DOM elements**, not just HTML strings, and allows for reactive or static use thanks to the Signal based reactivity system

---

## 1. Expression Interpolation

Important Note: You access component variables by adding a `$.` prefix before the variable name in your template. 

This is developer ergonomic trade-off as an experiment to build a better runtime compiler 

### ✅ Basic Usage
```html
<h1>{{ "Hello World" }}</h1>
```

### ✅ Attribute Support

Expressions can be embedded inside HTML attributes by using the `:` prefix

```html
<h1 :class="`text-lg ${ $.isBig ? 'font-bold' : 'font-light' }`">Hello</h1>
```

🚫 Not evauluated as an expression
```html
<h1 class="text-lg {{ $.isBig ? 'font-bold' : 'font-light' }}">Hello</h1>
```

---

## 2. Conditional Blocks

### ✅ Basic `if`
```html
{{#if $.isLoggedIn}}
  <p>Welcome back!</p>
{{/if}}
```

### ✅ `if` with `else`
```html
{{#if $.isAdmin}}
  <p>Admin Panel</p>
{{:else}}
  <p>Access Denied</p>
{{/if}}
```

### ✅ `if`, `else if` with `else`
```html
{{#if $.user.isAdmin}}
  <p>Admin Panel</p>
{{:else if $.user.isModerator}}
  <p>Moderator Tools</p>
{{:else}}
  <p>Access Denied</p>
{{/if}}
```

---

## 3. Loops

### ✅ `each` block
```html
<ul>
  {{#each $.items() as item}}
    <li>{{ $.item.name }}</li>
  {{/each}}
</ul>
```

### ✅ `each` with empty fallback
```html
<ul>
  {{#each $.users() as user}}
    <li>{{ $.user.name }}</li>
  {{:empty}}
    <li>No users found.</li>
  {{/each}}
</ul>
```

### ✅ With index
```html
{{#each $.items() as product, i}}
  <div>{{ $.i }}. {{ $.product.name }}</div>
{{/each}}
```

> The second alias (`i`) is optional and read-only. You can name it anything 

---

## 4. Awaiting Promises

### ✅ Basic await
```js
const userPromise = fetch("...")
````
```html
{{#await $.userPromise}}
  <p>Loading...</p>
{{:then user}}
  <p>Hello {{ $.user.name }}</p>
{{/await}}
```

### ✅ Await with error handling
```js
const dataPromise = fetch("...")
````
```html
{{#await $.dataPromise}}
  <p>Loading data...</p>
{{:then data}}
  <pre>{{ $.data }}</pre>
{{:catch error}}
  <p class="text-red-500">Error: {{ $.error.message }}</p>
{{/await}}
```

### ✅ Advance Await. Async Components
```html
{{#await import("./components/List.js")}}
  <p>Loading list..</p>
{{:then listComponent}}
  <Core:component default="$.listComponent"/>
{{:catch error}}
  <p class="text-red-500">Error loading list component</p>
{{/await}}
```

`<Core:component/>` is a special element that allows a **component** to be displayed

```html
<Core:component default="$.component">
```

---

## 6. Event Listeners

Event listeners are handled by adding a `on:` attribute

### ✅ Inline event handler
```html
<button on:click="() => alert('clicked!')">Click</button>
```

### ✅ Using a method
```html
<button on:click="$.handleClick">Click</button>
```

---

## 7. `bind:` Directive (Two-Way Binding)

> Requires using `signal` values

### ✅ Bind `value`
```js
export default component(..., class {
    user = signal("hello world");
})
```
```html
<input type="text" bind:value="$.user" /> // input value: hello world
```

### ✅ Bind `value` to an item of an array
```js
export default component(..., class {
    list = signal(["red", "green", "blue"]);
})
```
```html
<input type="text" bind:value="$.list()[2]" /> // input value: blue
```

### ✅ Bind `value` to a property of an object inside an array
```js
export default component(..., class {
    list = signal([
        { name : "john" },
        { name : "peter" },
        { name : "robert" },
    ]);
})
```
```html
<input type="text" bind:value="$.list()[0].name" /> // input value: john
```

### ✅ Bind `type="checkbox"` to boolean Signal
```js
export default component(..., class {
    is_admin = signal(false);
})
```
```html
<input type="checkbox" bind:checked="$.is_admin" />
```

---

## 8. `use:` Directive (Action Support)

### Caveat!

> due to HTML specification, HTML attributes are case insensitive so function names used in this directive cannot be in Pascal case

### ✅ Correct usage
```html
<input use:myaction />
```

### 🚫 Incorrect usage
```html
<input use:myAction />
```

### ✅ With parameters
```html
<input use:myaction="{ message : Enter your name }" />
<input use:myaction="[$.item[0], 1,2,3,4,5]" /> 
```

```html
// the attribute value is automatically evaluated as code on compiled time
<input use:myaction="'Enter your name'" /> // ✅ Wrapping text in quotation 
<input use:myaction="Enter your name" /> // 🚫 The compiler will incorrectly evaluate "Enter", "your", "name" as variables
```

### Function Signature
```js
/**
 * @param {Node} node
 * @param {any} parameter
 */
function myaction(node, parameter) {
  // Setup logic
  return () => {
      // clean up logic for when the node is destroyed (optional)
  }
}
```
