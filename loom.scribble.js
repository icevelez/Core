// THIS WILL ONLY WORK FOR SFC's BECAUSE WE ARE ABLE TO DOWNLOAD AND PARSE THE SCRIPT BEFORE IMPORTING
// COMPARED TO JSC WEHRE WE IMPORT THE JS FILE DIRECTLY THEREFORE NO PARSING CAN BE DONE BEFOREHAND

/* INJECTED CODE BY THE RUNTIME COMPILER */

export default function () {
    const $CORE = window.__core__;

    // MACROS
    const defineProps = $CORE.get_props;
    const onMount = $CORE.onMount;
    const onDestroy = $CORE.onDestroy;
    const signal = $CORE.signal;
    const effect = $CORE.effect;

    /* INJECTED CODE BY THE RUNTIME COMPILER - START OF USER CODE */

    const props = defineProps({ name: String });

    const [name, setName] = signal("John");
    const [count, setCount] = signal(0);

    const my_action = (node, param) => {

    }

    onMount(() => {
        console.log("Hello from App")
    })

    /* END OF USER CODE - INJECTED CODE BY THE RUNTIME COMPILER */

    const $ANCHOR = $CORE.get_anchor();
    const $FRAGMENT = $CORE.fragment_cache[0].cloneNode(true);

    const $NODE_START = $FRAGMENT.firstChild;
    const $NODE_END = $FRAGMENT.lastChild;

    // NODES WITH DYNAMIC PROPERTY
    const $CHILD1 = $FRAGMENT.childNodes[0];
    const $CHILD2 = $FRAGMENT.childNodes[1];
    const $CHILD3 = $FRAGMENT.childNodes[2];
    const $CHILD4 = $FRAGMENT.childNodes[3];
    const $CHILD5 = $FRAGMENT.childNodes[4];
    const $CHILD6 = $FRAGMENT.childNodes[5];
    const $CHILD7 = $FRAGMENT.childNodes[6];

    /** @type {Function[]} */
    const $DISPOSE_FNS = [];

    // TEXT & ATTRIBUTES
    $DISPOSE_FNS[0] = $CORE.effect(() => {
        $CORE.set_text($CHILD1, `From props "${ props.message }"`);
        $CORE.set_text($CHILD2, `Hello ${ name() }!`);
        $CORE.set_attr($CHILD3, `${ name() }`, "value");
        $CORE.set_text($CHILD4, `Count: ${ count() }`);
    })

    // EVENT DELEGATION
    $DISPOSE_FNS[1] = $CORE.delegate("click", $CHILD5, (() => setCount(count()+1)));
    $DISPOSE_FNS[1] = $CORE.delegate("input", $CHILD3, ((e) => setName(e.target.value)));

    // IMPORTED COMPONENTS like <Component/> or
    // CORE COMPONENTS like <Core:component default="component_function"/>
    const component0 = $CORE.block_cache.get("component0_id");
    const component0_components = $CORE.block_cache.get("component0_components_id");
    const component0_slot_fn = $CORE.block_cache.get("component0_slot_id");
    const component0_props = Object.create(component0.props);
    component0_props[$CORE.PRP_STATE] = { name : () => name() };
    $DISPOSE_FNS[8] = $CORE.core_component($CHILD6, component0_components.Component || $.Component, component0_props, component0_slot_fn, $);

    // USE DIRECTIVE
    $DISPOSE_FNS[9] = my_action($CHILD7, (/** use_directive expr */ null))

    // IF BLOCK

    // EACH BLOCK

    // AWAIT BLOCK

    $ANCHOR.append($FRAGMENT);

    return () => {
        for (const fn of $DISPOSE_FNS) fn();
        $DISPOSE_FNS.length = 0;

        const parent_node = $NODE_START.parentNode;
        if (parent_node) $CORE.remove_nodes(parent_node, $NODE_START, $NODE_END);
    }
}
