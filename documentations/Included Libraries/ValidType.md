# ValidType Library (`validtype.js`)

## Introduction

`ValidType` is a runtime validation library for JavaScript.

It provides:

- primitive validators
- object schema validation
- array validation
- record validation
- union types
- optional fields
- proxied asserted objects
- composable validation pipelines

The library is inspired by schema validators such as:

- Zod
- Yup
- Joi

while remaining extremely lightweight.

---

# Installation

```js
import {
    number,
    string,
    boolean,
    date,
    func,
    array,
    record,
    object,
    union,
    assertedObject
} from './validtype.js';
```

or with importmaps

```html
<script type="importmap">
    {
        "imports": {
            "validtype": "./lib/validtype.js"
        }
    }
</script>
```
```js
import {
    number,
    string,
    boolean,
    date,
    func,
    array,
    record,
    object,
    union,
    assertedObject
} from 'validtype';
```

---

# Primitive Validators

## Number

```js
const age = number();

console.log(age.validate(15));
// undefined

console.log(age.validate('15'));
// TypeError: not a number
```

---

## String

```js
const username = string();
```

---

## Boolean

```js
const enabled = boolean();
```

---

## Function

```js
const callback = func();
```

---

## Date

```js
const birthday = date();

birthday.validate(new Date());
birthday.validate('2026-01-01');
```

---

# Optional Values

Use `.optional()` to allow `null` or `undefined`.

```js
const nickname = string().optional();
```

---

# Validation Pipelines

Use `.pipe()` to add custom validation.

```js
const password = string().pipe((value) => {
    if (value.length < 8) {
        throw new Error('password too short');
    }
});
```

---

# Arrays

## `array(type)`

```js
const stringArray = array(string());

stringArray.validate(['a', 'b', 'c']);
```

---

# Records

## `record(type)`

Validates object values.

```js
const scores = record(number());

scores.validate({
    math: 90,
    science: 85
});
```

---

# Objects

## `object(schema)`

Creates structured object validation.

```js
const UserSchema = object({
    name: string(),
    age: number(),
    email: string().optional()
});
```

---

## Object Validation Example

```js
const result = UserSchema.validate({
    name: 'John',
    age: 20
});

console.log(result);
```

---

# Union Types

## `union(types)`

Allows multiple valid types.

```js
const id = union([
    string(),
    number()
]);

id.validate(15);
id.validate('abc');
```

---

# Asserted Objects

## `assertedObject(object, schema)`

Creates a proxied object that enforces runtime validation.

```js
const schema = object({
    name: string(),
    age: number()
});

const user = assertedObject({
    name: 'John',
    age: 25
}, schema);
```

---

## Runtime Property Enforcement

```js
user.age = 30;

user.age = 'hello';
// throws error
```

---

## Unknown Property Protection

```js
user.address = 'Earth';
// throws error
```

---

# Validation Return Behavior

The validator methods follow this convention:

- `undefined` → validation passed
- `string` → validation error

Example:

```js
const error = number().validate('hello');

if (error) {
    console.error(error);
}
```

---

# Internal Architecture

Each `ValidType` instance stores validation callbacks.

```js
#callbacks = new Set();
```

Validation is performed sequentially.

---

# Advanced Example

```js
const TodoSchema = object({
    title: string(),
    completed: boolean(),
    tags: array(string()).optional()
});

const todo = assertedObject({
    title: 'Learn ValidType',
    completed: false,
    tags: ['validation', 'javascript']
}, TodoSchema);


todo.completed = true;
```
