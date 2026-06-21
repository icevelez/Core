# How Component Scoped CSS Works

## Overview

Component Scope CSS is a lightweight, **runtime CSS scoping strategy** that enables per-component style isolation in the browser without requiring a build pipeline (e.g. PostCSS, Vite transforms, or framework compilers).

It works by leveraging the browser’s native CSS parser (`CSSStyleSheet`) and applying a small selector transformation layer to inject a **scope attribute** into component styles.

---

## Core Idea

Instead of transforming CSS during build time like Vue or Svelte, we:

1. Extract `<style>` tags from a component fragment
2. Let the browser parse CSS into a `CSSRuleList`
3. Rewrite selectors using a small runtime parser
4. Inject a scope attribute into both:

   * DOM nodes
   * CSS selectors

---

## How Scoping Works

### 1. Scope Injection into DOM

Every element in the component gets a unique scope attribute:

```js
el.setAttribute(scope_id, "")
```

Result:

```html
<div scope-abc>
  <h1 scope-abc>Hello</h1>
</div>
```

This is the anchor point for CSS isolation.

---

### 2. CSS Parsing via Browser (Not Regex)

Instead of parsing CSS manually, we rely on:

```js
const sheet = new CSSStyleSheet();
sheet.replaceSync(cssText);
```

This produces a structured `CSSRuleList`, which removes the need to implement a full CSS parser.

---

### 3. Selector Group Splitting

Selectors like:

```css
h1, h2, div#app > p.title
```

are split using a **depth-aware comma splitter**:

```js
h1
h2
div#app > p.title
```

Key idea: commas inside `:is()`, `[]`, or `()` are ignored.

---

### 4. Compound Selector Scoping

Each selector is transformed by injecting a scope attribute:

```css
div#abc > p.def:hover
```

becomes:

```css
div#abc[scope] > p.def[scope]:hover
```

This is done by scanning each selector and inserting the scope before pseudo-classes:

```js
part + `[scope]` + ":hover"
```

---

### 5. Rule Processing Pipeline

CSS rules are processed recursively:

* `CSSStyleRule`
* nested `cssRules` (media queries, supports, etc.)

Example flow:

```txt
CSSRuleList
   ↓
selectorText rewrite
   ↓
cssText reconstruction
   ↓
final scoped stylesheet string
```

---

## Key Design Principle

> We do NOT parse CSS ourselves — we reuse the browser’s CSS parser.

This drastically reduces complexity compared to build tools while still enabling scoped styles.

---

## What This Achieves

This system provides:

* Component-level style isolation
* No build step required
* Runtime CSS injection
* Works directly in browser environments
* Compatible with dynamic component loading

It behaves similarly to:

* Vue Scoped CSS
* Svelte style scoping

…but implemented entirely at runtime.

---

## Limitations vs Build Tool CSS Scoping

While this approach is lightweight and browser-native, it does **not reach full parity with build-time CSS compilers** like Vue, Svelte, or PostCSS.

### 1. Selector Edge Cases Are Not Fully Covered

The selector logic is intentionally minimal:

* No full selector AST
* No full CSS grammar parsing
* @import is not allowed 
* Limited handling of:

  * `:not()` complex nesting
  * advanced pseudo combinations
  * selector specificity edge cases

Example edge case:

```css
:not(.a, .b)
```

may not be handled with full semantic accuracy in all nested scenarios.

---

### 2. No Special Framework Pseudo Selectors

Build tools support constructs like:

* `:deep()`
* `:global()`
* `:slotted()`

This system does not implement these semantics.

---

### 3. CSS Nesting Complexity

Nested CSS is handled through the browser’s `CSSRuleList`, but:

* Reconstruction relies on string rebuilding
* Full selector context merging is not modeled like AST compilers

Build tools flatten nesting more predictably.

---

### 4. CSSOM Serialization Is Not Perfect

We reconstruct CSS using:

```js
rule.cssText + selector rewriting
```

This means:

* formatting is not preserved
* original source structure is lost
* round-trip fidelity is not guaranteed

Build tools operate on ASTs and preserve structure more consistently.

---

### 5. No Build-Time Optimizations

Unlike Vue/Svelte pipelines:

* no dead CSS elimination
* no selector deduplication
* no static analysis of unused styles
* no hoisting or splitting

This is purely runtime transformation.

---

# Alternative Solutions

## Using Native CSS Features

Although Core provides a lightweight Component Scoped CSS transform, modern CSS provides several techniques that can help organize component styles.

### @scope

The CSS `@scope` rule allows styles to be constrained to a specific section of the DOM.

```css
@scope (#user-card) {
    h1 {
        color: red;
    }

    p {
        color: gray;
    }
}
```

```html
<div id="user-card">
    <h1>John Doe</h1>
    <p>Administrator</p>
</div>
```

Only elements within the scoped container are affected.

---

### Nested CSS

Nested CSS can also help organize component-related styles.

```css
.user-card {
    h1 {
        color: red;
    }

    p {
        color: gray;
    }
}
```

```html
<div class="user-card">
    <h1>John Doe</h1>
    <p>Administrator</p>
</div>
```

While this does not provide true style isolation, it helps reduce accidental selector collisions.

---

## Important Caveat

Neither `@scope` nor nested CSS are equivalent to traditional Component Scoped CSS.

Consider the following component hierarchy:

```html
<UserCard>
    <Avatar />
</UserCard>
```

With traditional scoped CSS, styles inside `UserCard` are transformed so they only affect elements belonging to `UserCard`.

However, with native CSS techniques:

```css
@scope (.user-card) {
    img {
        border-radius: 50%;
    }
}
```

or

```css
.user-card img {
    border-radius: 50%;
}
```

the selector may also affect elements rendered by child components.

This occurs because CSS operates on the final DOM tree rather than the component tree.

As a result:

```text
Component Scoped CSS
    ↓
Affects only the component

@scope / Nested CSS
    ↓
Affects the component and its descendants
```

---

## Experimental @scope Injection

During development, Core experimented with automatically wrapping component styles using `@scope`.

Conceptually, a component such as:

```html
<style>
h1 {
    color: red;
}
</style>
```

could be transformed into:

```css
@scope ([generated-scope-id]) {
    h1 {
        color: red;
    }
}
```

and rendered as:

```html
<div generated-scope-id>
    ...
</div>
```

At first glance, this appears similar to Component Scoped CSS.

However, the behavior differs in important ways.

Because `@scope` follows normal CSS rules, styles continue to affect descendant elements rendered by child components.

This means the resulting behavior is not equivalent to true component style isolation.

---

## Multiple Root Elements

Another challenge is that `@scope` requires a scope root.

For example:

```html
<div id="scope-root">
    <h1>Hello</h1>
    <p>World</p>
</div>
```

works naturally with `@scope`.

However, Core components may contain multiple root elements:

```html
<h1>Hello</h1>
<p>World</p>
```

In this scenario there is no single element that can act as the scope root.

Supporting automatic `@scope` injection would require Core to introduce an additional wrapper element:

```html
<div id="generated-scope-id">
    <h1>Hello</h1>
    <p>World</p>
</div>
```

Introducing wrapper elements would alter the rendered DOM structure and could affect layout, styling, and application behavior.

For this reason, Core does not inject scope containers.
