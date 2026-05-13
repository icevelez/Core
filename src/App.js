import { component } from "../core/parser/handlebar.js";
import { effect, signal } from "../core/reactivity.js";
import { load } from "../core/core.js";

import Comp from "./Comp.js";
import Benchmark from "./Benchmark.js";

export default component({
    template: await load("src/App.html"),
    components: {
        Comp,
        Benchmark,
    }
}, class {

    counter = signal(0);
    birth_date = new Date();
    name = "John";
    message = signal("This is a message");

    // double = () => this.counter() % 2 === 0;

    // show_me = signal(true);
    // items = signal([
    //     { name : "John", age : 25 },
    //     { name : "Robert", age : 36 },
    //     { name : "Sean", age : 26 },
    //     { name : "Riley", age : 32 },
    //     { name : "Marie", age : 40 },
    //     { name : "Joseph", age : 44 },
    // ]);

    constructor() {}

})
