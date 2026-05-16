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

    show_benchmark = signal(false);
    counter = signal(0);
    birth_date = new Date();
    name = "John";
    message = signal("This is a message");

    constructor() {}

})
