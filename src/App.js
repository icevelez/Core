import { component } from "../core/parser/handlebar.js";
import { signal } from "../core/reactivity.js";
import { load } from "../core/core.js";

import Comp from "./Comp.js";

export default component({
    template: await load("src/App.html"),
    components: {
        Comp,
    }
}, class {

    object = signal({
        name: "John"
    });

    show_benchmark = signal(false);
    counter = signal(0);
    birth_date = new Date();
    name = "John";
    message = signal("This is a message");

    constructor() {}

})
