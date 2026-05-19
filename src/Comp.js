import { component } from "../core/parser/handlebar.js";

export default component({
    template: `
        <div>
            <h1>Hello {{ $.props.name }}</h1>
            <Core:slot/>
            <h1>Another {{ $.props.name }}</h1>
            <h1>Lots of Stuff</h1>
            <h1>More {{ $.props.name }}</h1>
        </div>
    `,
}, class {

    constructor(props) {
        this.props = props;
    }

})
