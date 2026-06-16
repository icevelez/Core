# Component Scoped CSS

## Overview

Core does not currently provide built-in Component Scoped CSS.

Traditional component-scoped styling systems found in frameworks such as Vue and Svelte typically rely on a CSS transformation step that rewrites selectors during compilation.

For example:

```css
h1 {
    color: red;
}
```

is transformed into:

```css
h1[data-scope-abc123] {
    color: red;
}
```

while the component's rendered HTML becomes:

```html
<h1 data-scope-abc123>
    Hello World
</h1>
```

This approach ensures that styles are isolated to a specific component instance and do not affect other components.

Because Core is designed around direct browser execution and does not require a mandatory build pipeline, it does not currently perform CSS selector transformations.

---

## Using Native CSS Features

Although Core does not provide built-in Component Scoped CSS, modern CSS provides several techniques that can help organize component styles.

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

For this reason, Core does not automatically inject scope containers.

---

## Future Considerations

Component Scoped CSS remains an area of exploration.

For now, Core recommends using standard CSS, nested CSS, and `@scope` where appropriate while remaining aware of their differences from traditional Component Scoped CSS implementations.
