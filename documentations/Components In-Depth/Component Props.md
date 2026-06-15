# Component Props

Props are a mechanism for passing data from a parent component to a child component.

They allow components to be configured and reused while maintaining a predictable flow throughout your application.

---

## Declaring Props

Props are accessed by using the `props` object  

```js
export default function(props) {}
```

The returned object contains all props passed to the component.

### Parent Component

```html
<UserCard name="John"/>
```

### Child Component

```js
export default function(props) {
    console.log(props.name); // John
}
```

---

## Static Props

Static props pass literal values to a component.

```html
<UserCard name="John" age="25"/>
```

```js
export default function(props) {
    console.log(props.name);
    console.log(props.age);
}
```

Static props are evaluated once when the component is created.

---

## Reactive Props

Props can also be bound to reactive state using the `:` prefix

```js
const [name, setName] = signal("John");
```

```html
<UserCard :name="name()"/>
```

When the signal changes:

```js
setName("Jane");
```

the child component automatically receives the updated value.

```text
Parent State
      ↓
     Prop
      ↓
Child Component
```

---

## One-Way Data Flow

All props follow a one-way-down binding.

```text
Parent
    ↓
 Child
```

When the parent updates:

```js
setName("Jane");
```

the child receives the new value.

However, the child should not directly modify a prop.

```js
props.name = "Bob"; // Avoid; throws an error as props property are read-only values
```

Instead, the parent remains the source of truth.

If a child needs to communicate changes back to its parent, consider using:

- Events
- Signals
- Context
- Shared state

depending on the use case.

## Example

The child component is communicating changes back to its parent using Shared state.

### Parent

```js
const [count, setCount] = signal(0);
```

```html
<Counter :count="count" :setCount="setCount"/>
```

### Child

```js
export default function(props) {}
```

```html
<button
    on:click="() => props.setCount(props.count() + 1)"
>
    Count is: {{ props.count() }}
</button>
```

The child does not own the state.

Instead, it receives the state through props and updates it through values provided by the parent.

--- 

## Props Are Read-Only

All props are immutable inside the child component.

Core enforces this to ensure predictable data flow and avoid unintended side effects.

If mutation is needed, the parent must explicitly handle it.

---

## Passing Signals

Signals can be passed directly as props.

### Parent

```js
const [count, setCount] = signal(0);
```

```html
<Counter :count="count" :setCount="setCount"/>
```

### Child

```js
export default function(props) {
    const { count, setCount } = props; 
}
```

```html
<button on:click="() => setCount(count() + 1)">
    Count: {{ count() }}
</button>
```

> [!IMPORTANT]
> While it is not recommended to desconstruct a prop, because we passed down a signal's getter and setter. Descontruction does not break reactivity in this case

Passing signals directly allows multiple components to share the same reactive state.

---

## Passing Proxies

Reactive objects and arrays may also be passed as props.

### Parent

```js
const user = signal({
    name: "John",
    age: 25
});
```

```html
<UserCard :user="user()"/>
```

### Child

```html
<h1>{{ props.user.name }}</h1>
<p>{{ props.user.age }}</p>
```

Because the proxy itself is shared, updates remain reactive.

---

## Props Destruction (Important Caveat)

Destructuring props may break reactivity.

### ❌ Non-Reactive Access

```js
export default function(props) {
    const { name } = props;
    console.log(name); // not reactive
}
```

Once destructured, `name` becomes a static reference.

---

### ✅ Reactive Access

```js
export default function(props) {
    console.log(props.name); // reactive
}
```

Always access reactive props through the `props` object to preserve reactivity tracking.

---

## Default Values

Core currently do not provide a way to set a default value to a prop.
