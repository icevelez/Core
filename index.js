// import { mount } from "./core/runtime.js";
// import App from "./src/App.js";

// mount(App, document.getElementById("app"));

import { sfc } from "./core/parser/handlebar.js";
import { mount } from "./core/runtime.js";

const App = await sfc("sfc/App.html");
mount(App, document.getElementById("app"));

// import { signal, effect } from "./core/runtime.js";

// const users_sginal = signal([
//     { name: "John", age: 26 },
//     { name: "Sean", age: 27 },
//     { name: "Alice", age: 28 },
//     { name: "Bob", age: 29 },
//     { name: "Mark", age : 30 },
// ])

// const users = users_sginal();
// const user = users[0];

// console.log(users);

// effect(() => {
//     console.log("user0", users[0]);
// })

// effect(() => {
//     console.log("user0age", users[0].age);
// })
// effect(() => {
//     console.log("user0name", users[0].name);
// })


// setTimeout(() => {
//     users_sginal.set([
//         [ 1, 2, 3],
//     ])
//     console.log("update ===");
//     setTimeout(() => {
//         users[0] = { name: "Marie", age: 32 };
//         console.log("update === M");
//         setTimeout(() => {
//             users_sginal.set([
//                 { name: "Robert", age : 45 },
//             ])
//             console.log("update ===");
//             setTimeout(() => {
//                 users_sginal.set([])
//                 console.log("update ===");
//                 setTimeout(() => {
//                     users_sginal.set([])
//                     console.log("update ===");
//                     setTimeout(() => {
//                         users_sginal.set([
//                             { name: "Robert", age : 45 },
//                         ])
//                         console.log("update ===");
//                     }, 1000)
//                 }, 1000)
//             }, 1000)
//         }, 1000)
//     }, 1000)
// }, 1000)
