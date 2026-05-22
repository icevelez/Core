import { component } from "../core/parser/handlebar.js";
import { signal } from "../core/reactivity.js";
import { load } from "../core/core.js";

import Comp from "./Comp.js";
import { set_context } from "../core/runtime.js";

export default component({
    template: await load("src/App.html"),
    components: {
        Comp,
    }
}, class {

    show_benchmark = signal(false);
    counter = signal(0);
    birth_date = new Date();
    name = signal("John");
    message = signal("This is a message");
    arr = signal('1'.repeat(10).split(""));

    constructor() {
        // setTimeout(() => {
        //     this.arr.set([])
        // }, 2000);
        set_context("example", "Hello world");
    }

})
