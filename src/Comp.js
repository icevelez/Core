import { get_context, set_context } from "../core/context.js";
import { component } from "../core/parser/handlebar.js";

const InnerComp = component({
    template: `
        <h1>Message: {{ $.message }}</h1>
    `
}, class {

    constructor() {
        this.message = get_context("example");
    }
})

export default component({
    template: `
        <div>
            <h1>Hello {{ $.props.name }}</h1>
            <Core:slot/>
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
        if (Math.random() * 10 >= 5) set_context("example", "randomly xxxxx");
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
