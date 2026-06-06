import { get_context, set_context } from "../core/runtime.js";
import { component } from "../core/parser/handlebar.js";

const InnerComp = component({
    template: `
        <h1>Message: {{ $.message }} {{ $.number }}</h1>
    `
}, class {

    constructor() {
        this.message = get_context("example");
        this.number = get_context("rand");
    }
})

export default component({
    template: `
        <div>
            <h1>Hello {{ $.props.name }}</h1>
            <CoreSlot/>
            <h1>Another {{ $.props.name }}</h1>
            <h1>Lots of Stuff</h1>
            <h1>More {{ $.props.name }}</h1>
            <h1>LOLOLOL: {{ $.x }}</h1>
            <InnerComp/>
        </div>
    `,
    components: {
        InnerComp,
    }
}, class {

    constructor(props) {
        this.x = get_context("example");
        const rand = Math.random() * 10 >= 5;
        if (rand) set_context("example", "randomly xxxxx");
        set_context("rand", rand);
        this.props = props;
    }

    onMount = () => {
        console.log("Comp onmount");
        return () => {
            console.log("Comp onmount dispose")
        }
    }

    onDestroy = () => {
        console.log("Comp ondestroy");
    }

})
