// THIS WILL ONLY WORK FOR SFC's BECAUSE YOU DOWNLOAD AND PARSE THE SCRIPT TAG BEFORE IMPORTING
// COMPARED TO JSC WEHRE YOU IMPORT THE JS FILE DIRECTLY, NO INJECT IS POSSIBLE WHEN IMPORTING JS DIRECTLY

export default function () { const $CORE = window.__core__, getProps = $CORE.get_props(); /* INJECTED CODE BY THE RUNTIME COMPILER, KEEPING LINES THE SAME */

    const props = getProps({ name : String });
    const name = signal("");

    onMount(() => {

    })

    /* INJECTED CODE BY THE RUNTIME COMPILER */

    const $FRAGMENT = $CORE.fragment_cache[0].cloneNode(true);

    const $ANCHOR = $CORE.get_anchor();
    const $NODE_START = $FRAGMENT.firstChild;
    const $NODE_END = $FRAGMENT.lastChild;

    // NODES WITH DYNAMIC PROPERTY
    const $CHILD1 = $FRAGMENT.childNodes[1];
    const $CHILD2 = $FRAGMENT.childNodes[2];
    const $CHILD3 = $FRAGMENT.childNodes[3];
    const $CHILD4 = $FRAGMENT.childNodes[4];

    /** @type {Function[]} */
    const $DISPOSE_FNS = [];

    // TEXT & ATTRIBUTES
    $DISPOSE_FNS[0] = $CORE.effect(() => {
        $CORE.set_text($CHILD1, `Hello ${name}!`);
        $CORE.set_attr($CHILD2, name, "value");
    })

    // EVENT DELEGATION
    $DISPOSE_FNS[1] = $CORE.delegate("click", $CHILD4, (() => $.count++));

    // TWO WAY DATA BINDING
    $DISPOSE_FNS[2] = $CORE.delegate("value", $CHILD3, ((event) => $CORE.is_signal(name) ? name.set(event.target.value) : (name = event.target.value)))
    $DISPOSE_FNS[3] = $CORE.effect(() => ($CHILD3.value = $CORE.is_signal(name) ? name() : name));

    $ANCHOR.append($FRAGMENT);

    return () => {
        for (const fn of $DISPOSE_FNS) fn();
        $DISPOSE_FNS.length = 0;

        const parent_node = $NODE_START.parentNode;
        if (!parent_node) return;

        $CORE.remove_nodes($NODE_START, $NODE_END);
    }
}
