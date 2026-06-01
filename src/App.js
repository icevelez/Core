import { component } from "../core/parser/handlebar.js";
import { set_context, signal, load } from "../core/runtime.js";

import Comp from "./Comp.js";

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
    arr = signal('1'.repeat(1).split(""));

    constructor() {
        // setTimeout(() => {
        //     this.arr.set([])
        // }, 2000);
        set_context("example", "Hello world");
    }

})
