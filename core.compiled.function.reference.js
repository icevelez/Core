function anonymous(anchor, $, slot_fn) {
    const CORE = window.__core__;
    const frag = CORE.fragment_cache[0];
    const fragment = frag.cloneNode(true);

    const boundaryNodeStart = fragment.firstChild;
    const boundaryNodeEnd = fragment.lastChild;

    // NODES WITH DYNAMIC PROPERTY
    const child1 = fragment.childNodes[1];
    const child2 = fragment.childNodes[2];
    const child3 = fragment.childNodes[3];
    const child4 = fragment.childNodes[4];
    const child5 = fragment.childNodes[5];
    const child6 = fragment.childNodes[6];
    const child7 = fragment.childNodes[7];
    const child8 = fragment.childNodes[8];
    const child9 = fragment.childNodes[9];

    /** @type {Function[]} */
    const dispose_fns = [];

    // TEXT & ATTRIBUTES
    dispose_fns[0] = CORE.effect(() => {
        CORE.set_text(child1, `Hello ${$.name}!`);
        CORE.set_attr(child2, $.name, "value");
    })

    // EVENT DELEGATION
    dispose_fns[1] = CORE.delegate("click", child1, (() => $.count++));

    // TWO WAY DATA BINDING
    dispose_fns[2] = CORE.delegate("value", child1, ((event) => CORE.is_signal($.name) ? $.name.set(event.target.value) : ($.name = event.target.value)))
    dispose_fns[3] = CORE.effect(() => (child1.value = CORE.is_signal($.name) ? $.name() : $.name));

    // IF/EACH/AWAIT BLOCKS
    dispose_fns[4] = CORE.if(child3, $, "if_id", [
        (($) => $.count % 2 === 0)
    ]);

    dispose_fns[5] = CORE.each(child4, $, "each_id_1", (() => $.arr_1), {
        name: {
            get() { return this[CORE.ARR_STATE][this[CORE.IDX_STATE]].name; },
            set(v) { this[CORE.ARR_STATE][this[CORE.IDX_STATE]].name = v; }
        },
        birth_date: {
            get() { return this[CORE.ARR_STATE][this[CORE.IDX_STATE]].birth_date; },
            set(v) { this[CORE.ARR_STATE][this[CORE.IDX_STATE]].birth_date = v; }
        },
        i: {
            get() { return this[CORE.IDX_STATE]; },
        }
    }, { // SET & MAP
        value: {
            get() { return this[CORE.ARR_STATE].get(this[CORE.ARI_STATE]); },
        },
        key: {
            get() { return this[CORE.ARI_STATE]; },
        },
        i: {
            get() { return this[CORE.IDX_STATE]; },
        }
    });

    dispose_fns[6] = CORE.each(child5, $, "each_id_2", (() => $.arr_2), {
        ar: {
            get() { return this[CORE.ARR_STATE][this[CORE.IDX_STATE]]; },
            set(v) { this[CORE.ARR_STATE][this[CORE.IDX_STATE]] = v; }
        },
        i: {
            get() { return this[IDX_STATE]; },
        }
    }, { // SET
        ar: {
            get() { return this[CORE.ARR_STATE].get(this[CORE.ARI_STATE]); },
        },
    }, { // MAP
        ar: {
            get() { return [this[CORE.ARI_STATE], this[CORE.ARR_STATE].get(this[CORE.ARI_STATE])]; },
        },
    });

    dispose_fns[7] = CORE.await(child6, $, "await_id", (() => new Promise((resolve) => setTimeout(() => resolve($.sample), 3000))));

    // IMPORTED COMPONENTS like <Component/> or
    // CORE COMPONENTS like <Core:component default="component_function"/>
    const component0 = CORE.block_cache.get("component0_id");
    const component0_components = CORE.block_cache.get("component0_components_id");
    const component0_slot_fn = CORE.block_cache.get("component0_slot_id");
    const component0_dynamic_props = component0.dynamic_props.map((prop) => ({ key : prop.key, fn : (($) => /* props.expr */ null) }));
    const component0_anchor = new Text("");

    child6.parentNode.replaceChild(component0_anchor, child7);

    dispose_fns[8] = CORE.effect(() => {
        for (const prop of component0_dynamic_props) component0.props[prop.key] = prop.fn($);
        return CORE.core_component(component0_anchor, component0_components.Component || $.Component, component0.props, component0_slot_fn, $);
    })

    // USE DIRECTIVE
    dispose_fns[9] = $.user_defined_function(child8, (/** use_directive expr */ null))

    // COMPONENT SLOT like <Core:slot/>
    if (slot_fn) {
        const slot_anchor = new Text("");
        const fragment = document.createDocumentFragment();
        child8.parentNode.replaceChild(slot_anchor, child9);
        dispose_fns[10] = slot_fn(fragment);
        slot_anchor.before(fragment);
    }

    anchor.append(fragment);

    const dispose = () => {
        for (const fn of dispose_fns) fn();
        dispose_fns.length = 0;
        CORE.remove_nodes_between(boundaryNodeStart, boundaryNodeEnd, true);
    };

    dispose[CORE.BOUNDARY_NODE_START] = boundaryNodeStart;
    dispose[CORE.BOUNDARY_NODE_END] = boundaryNodeEnd;

    return dispose;
}
