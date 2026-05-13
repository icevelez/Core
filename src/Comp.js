import { component } from "../core/parser/handlebar.js";

export default component({
    template: `
        <div>
            <h1>Hello {{ $.name }}</h1>
            <Core:slot/>
        </div>
    `,
}, class {

    constructor(props) {
        this.name = props.name;
    }

})
