# Importing Components

Components can be composed together to build larger user interfaces. Before a component can be used inside a template, it must first be made visible to the current component.

In Core, this is done by exporting the component from the component script.

```js
import { component } from "core/handlebar";

export const MyComponent = component("./MyComponent.html");
```

Once exported, the component becomes available within the template:

```html
<MyComponent />
```

---

## Why Use `export`?

At first glance, using `export` to make a component available may seem unusual.

After all, most developers associate `export` with making values available to other JavaScript modules. In Core, however, exported values serve an additional purpose.

During component compilation, Core needs a reliable way to discover which components should be available to the template.

Rather than introducing a separate registration API, Core treats all export declarations as template components.

```js
import { component } from "core/handlebar";

export const Header = component("./Header.html");
export const Sidebar = component("./Sidebar.html");
export const UserCard = component("./UserCard.html");
```

Core automatically discovers these exports and registers them for template usage.

```html
<Header />
<Sidebar />
<UserCard />
```

This keeps component registration explicit while avoiding additional configuration.

---

## Component Loading

The `component()` function loads and compiles another Core component.

```js
const MyComponent = component("./MyComponent.html");
```

Unlike traditional component systems, `component()` returns a Promise.

```js
const MyComponent = component("./MyComponent.html");

// Promise<Component>
```

This is because the component file must first be:

```text
Load Component File
    ↓
Parse Template
    ↓
Extract Script
    ↓
Process Template
    ↓
Discover Template Bindings
    ↓
Generate Render Code
    ↓
Inject Render Code to Extracted Script 
    ↓
Generate JS Module using the Modified Script 
    ↓
Import Generated JS Module
    ↓
Process Component Promises
    ↓
Store Components 
    ↓
Return Render Function from the Imported JS Module
```

before it becomes usable.

---

## Concurrent Component Resolution

Since every imported component is asynchronous, Core collects all exported component promises and resolves them concurrently.

Given:

```js
export const Header = component("./Header.html");
export const Sidebar = component("./Sidebar.html");
export const UserCard = component("./UserCard.html");
```

Core internally performs an operation similar to:

```js
await Promise.all([
    Header,
    Sidebar,
    UserCard
]);
```

rather than waiting for each component individually.

This allows component dependencies to be loaded and compiled in parallel, reducing startup time and avoiding unnecessary waterfalls.

---

## Component Caching

Once a component has been loaded and compiled, Core stores the resulting render function in an internal cache.

```js
component("./Header.html");
```

The first call:

```text
Fetch
    ↓
Parse
    ↓
Compile
    ↓
Cache
```

Subsequent calls:

```text
Lookup Cache
    ↓
Return Existing Render Function
```

No additional network request or compilation step is performed.

```js
const HeaderA = component("./Header.html");
const HeaderB = component("./Header.html");
```

Both references will resolve to the same compiled component instance.

```js
HeaderA === HeaderB // true
```
    
This ensures that components can be reused throughout an application without repeatedly paying the cost of fetching and compilation.

---

## Nested Components

Components may themselves export additional components.

```js
import { component } from "core/handlebar";

export const UserAvatar = component("./UserAvatar.html");
export const UserProfile = component("./UserProfile.html");
```

```html
<UserAvatar />
<UserProfile />
```

Core recursively resolves component dependencies before rendering.

---

## Best Practices

### Export Components Near the Top

```js
import { component } from "core/handlebar";

export const Header = component("./Header.html");
export const Footer = component("./Footer.html");

export default function() {
}
```

Keeping component exports near the top of the file makes dependencies easier to discover.

---

### Use Descriptive Names

Component names should describe their purpose.

```js
export const UserCard = component("./UserCard.html");
export const ProductList = component("./ProductList.html");
```

Avoid generic names when possible:

```js
export const Item = component("./Item.html");
export const Component = component("./Component.html");
```

---

## Circular Dependencies

Core intentionally allows circular component dependencies.

For example:

### Parent.html

```js
export const Child = component("./Child.html");
```

```html
<Child />
```

### Child.html

```js
export const Parent = component("./Parent.html");
```

```html
<Parent />
```

While circular dependencies are often accidental, there are legitimate situations where a developer may intentionally create recursive or mutually-referential component structures.

Because of this, Core does not attempt to prevent circular component relationships.

It is the developer's responsibility to ensure that circular rendering structures terminate appropriately.

For example, recursive tree views are a common valid use case:

```html
<TreeNode node="{{ child }}" />
```
