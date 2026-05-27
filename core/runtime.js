/** @typedef {{ children : number[][], text_funcs : { child_index : number, expr : string }[], attr_funcs : { child_index : number, expr : string, property : string }[], bindings : { child_index : number, var : string, property : string, event_name : string }[], events : { child_index : number, event_name : string, expr : string }[], blocks : { child_index : number, type : string, id : string }[], core_component_blocks : { child_index : number, component_name : string, props_id : string }, component_blocks : { child_index : number, component_id : number, component_tag : string, props_id : string }, use_directives : { child_index : number, func_name : string, expr : string }[] slot_child_index : number  }} Processes */

/** @typedef {(anchor:Node, $:any, slot_fn:Function) => (() => void)} CoreBlock returns a function to dispose any event and reactive effect */
/** @typedef {(anchor:Node, props:Record<string, any>, slot_fn:Function) => (() => void)} CoreComponent returns a function to dispose any event and reactive effect */

/** @typedef {{ fns : Function[], exprs : string[] }} IfBlock */
/** @typedef {{ fn : Function, empty_fn : Function, expr : string, key : string, keys?: string[], index_key?:string }} EachBlock */
/** @typedef {{ pending_fn:Function, then_fn?: Function, then_key?:string, catch_fn?: Function, catch_key?:string, expr : string }} AwaitBlock */
/** @typedef {{ props : Record<string, string>, dynamic_props : { key:string, expr : string }[] }} PropsBlock */
/** @typedef {CoreBlock} SlotBlock */
/** @typedef {Record<string, CoreComponent>} ComponentBlock */

/** @typedef {IfBlock | EachBlock | AwaitBlock | PropsBlock | SlotBlock | CoreBlock} BlockCache */

const CORE = {
    version: "0.4.0",
    show_anchor_blocks : true, // flag to use comment node instead of text node as anchor, good for debugging
    IDX_STATE: Symbol(),
    ARR_STATE: Symbol(),
    PRP_STATE: Symbol(),
    lifecycle: {
        is_mounted,
        defer_on_mount,
    },
    context: {
        create_new_context,
        set_new_context,
    },
    effect,
    is_signal,
    /** @type {DocumentFragment[]} */
    fragment_cache: [],
    /** @type {Map<string, BlockCache[]>} */
    block_cache: new Map(),
    /** @type {Map<string, WeakMap<Node, Set<Function>>>} */
    delegated_events: new Map(),
    eval: (expr = "", context) => new Function(context, `return ${expr};`),
    /**
     * @param {Node} node
     * @param {string} text
     */
    set_text: function (node, text) {
        if (node.__cacheText === text) return;
        node.__cacheText = node.nodeValue = text;
    },
    /**
     * @param {Node} node
     * @param {any} value
     * @param {string} property
     */
    set_attr: function (node, value, property) {
        if (!node.__cacheAttr) node.__cacheAttr = {};
        if (node.__cacheAttr[property] === value) return;
        node.__cacheAttr[property] = value;

        if (property === "value") {
            node.nodeValue = value;
        } else if (property === "checked") {
            node.checked = value === "true";
            node.setAttribute(property, value === "true" ? "" : value);
        } else if (value === "false" || !value) {
            node.removeAttribute(property);
        } else {
            node.setAttribute(property, value === "true" ? "" : value);
        }
    },
    /**
     * @param {string} event_name
     * @param {Node} node
     * @param {Function} func
     * @returns {() => void} remove event
     */
    delegate: function (event_name, node, func) {
        if (typeof func !== "function") throw new Error("func is not a function");
        let event_node_weakmap = CORE.delegated_events.get(event_name);

        if (!event_node_weakmap) {
            event_node_weakmap = new WeakMap();
            const funcs = new Set();
            funcs.add(func);

            event_node_weakmap.set(node, funcs);
            CORE.delegated_events.set(event_name, event_node_weakmap);

            window.addEventListener(event_name, (e) => match_delegated_node(event_node_weakmap, e, e.target));

            return () => funcs.delete(func);
        }

        let funcs = event_node_weakmap.get(node);
        if (!funcs) {
            funcs = new Set();
            event_node_weakmap.set(node, funcs);
        }

        funcs.add(func);
        return () => funcs.delete(func);
    },
    /**
     * @param {Node} startNode
     * @param {Node} endNode
     */
    remove_nodes: function (parentNode, startNode, endNode) {
        if (!parentNode) throw "parent node not found";

        if (startNode === endNode) {
            parentNode.removeChild(startNode);
            return;
        }

        let node = startNode;
        while (node && node !== endNode) {
            const next = node.nextSibling;
            parentNode.removeChild(node);
            node = next;
        }

        parentNode.removeChild(endNode);
    },
    /**
     * Returns a function to dispose DOM nodes and reactive bindings
     * @param {Node} anchor
     * @param {any} $
     * @param {string} id
     * @param {(($:any) => Boolean)[]} condition_fns
     */
    if: (anchor, $, id, condition_fns) => {
        const fragment = document.createDocumentFragment();
        const if_block = CORE.block_cache.get(id);
        const fns = if_block.fns;

        let prev_fn
        let dispose;

        const effect_dispose = CORE.effect(() => {
            let curr_fn;

            for (let i = 0; i < condition_fns.length; i++) {
                if (!condition_fns[i]($)) continue;
                curr_fn = fns[i];
                break;
            }

            if (prev_fn === curr_fn) return;
            prev_fn = curr_fn;

            if (dispose) dispose();
            if (!curr_fn) return;

            dispose = curr_fn(fragment, $);
            anchor.before(fragment);
        }, { track_inner_effect: false })

        return () => {
            dispose();
            effect_dispose();
        }
    },
    /**
     * Returns a function to dispose DOM nodes and reactive bindings
     * @param {Node} anchor
     * @param {any} $
     * @param {string} id
     * @param {() => any[]} arr_fn
     * @param {Object} descriptor
     */
    each: (anchor, $, id, arr_fn, descriptor) => {
        let else_block_dispose_fn = null;
        let existing_dispose_blocks = [];

        const fragment = document.createDocumentFragment();
        const each_block = CORE.block_cache.get(id);
        const $sub = Object.create($);
        Object.defineProperties($sub, descriptor);

        const start_node = CORE.show_anchor_blocks ? new Comment("each-block-start") : new Text("");
        anchor.before(start_node);

        const effect_dispose = CORE.effect(() => {
            const arr = arr_fn();

            $sub[CORE.ARR_STATE] = arr;

            if (!arr || arr?.length <= 0) {
                if (existing_dispose_blocks.length > 0) {
                    const parent_node = anchor.parentNode;
                    CORE.remove_nodes(parent_node, start_node.nextSibling, anchor.previousSibling);
                }

                for (const dispose of existing_dispose_blocks) dispose();
                existing_dispose_blocks.length = 0;

                if (!each_block.else_fn || else_block_dispose_fn) return;
                else_block_dispose_fn = each_block.else_fn(fragment, $);
                anchor.before(fragment);
                return;
            }

            if (else_block_dispose_fn) {
                else_block_dispose_fn()
                else_block_dispose_fn = null;
            }

            const new_each_dispose_blocks = [];

            let i = 0;
            for (const ar of arr) {
                if (existing_dispose_blocks[i]) {
                    new_each_dispose_blocks.push(existing_dispose_blocks[i]);
                    continue;
                }

                const $ = Object.create($sub);
                $[CORE.IDX_STATE] = i++;

                const dispose = each_block.fn(fragment, $);
                new_each_dispose_blocks.push(dispose);
            }

            // TEAR DOWN BLOCKS THAT ARE BEYOND THE NEW ARRAY LENGTH
            for (let i = new_each_dispose_blocks.length; i < existing_dispose_blocks.length; i++) {
                existing_dispose_blocks[i]();
            }

            if (new_each_dispose_blocks.length > 0) anchor.before(fragment);

            existing_dispose_blocks = new_each_dispose_blocks;
        }, { track_inner_effect: false })

        return () => {
            if (else_block_dispose_fn) else_block_dispose_fn();
            else_block_dispose_fn = null;
            for (const dispose of existing_dispose_blocks) dispose();
            existing_dispose_blocks.length = 0;
            effect_dispose();
        }
    },
    /**
     * Returns a function to dispose DOM nodes and reactive bindings
     * @param {Node} anchor
     * @param {any} $
     * @param {string} id
     * @param {() => Promise<any>} await_fn
     */
    await: function (anchor, $, id, await_fn) {
        let pending_dispose_fn;
        let dispose_fn;
        let last_id;

        const dispose = () => {
            if (pending_dispose_fn) {
                pending_dispose_fn();
                pending_dispose_fn = null;
            }

            if (dispose_fn) {
                dispose_fn();
                dispose_fn = null;
            }
        }

        const await_block = CORE.block_cache.get(id);
        const fragment = document.createDocumentFragment();
        const context = create_new_context(); // GET CURRENT CONTEXT TO RE-SET WHEN FULLFILLING A PROMISE / CATCHING AN ERROR

        const effect_dispose = CORE.effect(() => {
            const promise = new Promise(async (resolve) => { try { resolve([await await_fn(), null]) } catch (error) { resolve([null, error]); } });
            const curr_id = Math.random();
            last_id = curr_id;

            if (!(promise instanceof Promise)) {
                dispose_fn = await_block.then_fn(fragment, $);
                anchor.before(fragment);
                return dispose_fn;
            }

            pending_dispose_fn = await_block.pending_fn(fragment, $);
            anchor.before(fragment);

            promise.then(([value, error]) => {
                if (last_id !== curr_id) return;

                const $sub = Object.create($);
                if (!error && await_block.then_key) $sub[await_block.then_key] = value;
                if (error && await_block.catch_key) $sub[await_block.catch_key] = error;

                const old_context = CORE.context.set_new_context(context);
                dispose_fn = (error ? await_block.catch_fn : await_block.then_fn)(fragment, $sub);
                CORE.context.set_new_context(old_context);

                pending_dispose_fn();
                pending_dispose_fn = null;
                anchor.before(fragment);
            })

            return dispose;
        }, { track_inner_effect: false });

        return () => {
            dispose_fn();
            effect_dispose();
            CORE.context.set_new_context(context);
        }
    },
    /**
     * Returns a function to dispose DOM nodes and reactive bindings
     * @param {Node} anchor
     * @param {Function | { default : Function }} fn
     * @param {any} props
     * @param {Function} slot_fn
     */
    core_component: function (anchor, fn, props, slot_fn) {
        const fragment = document.createDocumentFragment();
        const dispose = (fn.default ? fn.default : fn)(fragment, props, slot_fn);
        anchor.before(fragment);
        return dispose;
    }
}

/**
 * @param {WeakMap<Node, Set<Function>>} map
 * @param {Event} event
 * @param {Node} target
 */
function match_delegated_node(map, event, target) {
    const fns = map.get(target);
    if (!fns) return target.parentNode ? match_delegated_node(map, event, target.parentNode) : undefined;
    for (const fn of fns) fn(event);
}

function replace_node_with_anchor(node, text) {
    const anchor = CORE.show_anchor_blocks ? new Comment(text) : new Text("");
    node.parentNode.replaceChild(anchor, node);
}

/**
 * @param {Node} node
 * @param {number[]} node_index
 * @param {Processes} processes
 */
function process_node(node, node_index = [], processes = { children: [], events: [], bindings: [], attr_funcs: [], text_funcs: [], blocks: [], core_component_blocks: [], component_blocks: [], use_directives: [], slot_child_index: -1 }) {
    const isStyle = node instanceof HTMLStyleElement;
    if (isStyle) return processes;

    const handlebar_re = /({{(?:(?!}}).)*}})/g;
    const handlebar_capture_inner_expression_re = /{{\s*(.+?)\s*}}/g;

    const isText = node.nodeType === Node.TEXT_NODE;
    if (isText) {
        const expression = node.textContent;
        const parts = expression.split(handlebar_re);
        const has_handlebars = parts.map(p => p.startsWith("{{")).filter(p => p === true).length > 0;
        if (!has_handlebars) return processes;

        node.textContent = "";
        processes.children.push(node_index);
        processes.text_funcs.push({ child_index: processes.children.length - 1, expr: `\`${expression.replace(handlebar_capture_inner_expression_re, (_, e) => "${" + e + "}")}\`` });
        return processes;
    }

    if (node.nodeType === Node.COMMENT_NODE) return processes;

    const isCoreSlotNode = (node) => Boolean(node.dataset && node.dataset.block === "core-slot");
    if (isCoreSlotNode(node)) {
        replace_node_with_anchor(node, "component-slot");
        processes.children.push(node_index);
        processes.slot_child_index = processes.children.length - 1;
        return processes;
    }

    const isComponentNode = (node) => Boolean(node.dataset && node.dataset.block === "component");
    const isCoreComponentNode = (node) => Boolean(node.dataset && node.dataset.block === "core-component");

    const is_component_node = isComponentNode(node);
    const is_core_component_node = isCoreComponentNode(node);
    if (is_component_node || is_core_component_node) {
        const component = node.dataset.component || null;
        const component_id = node.dataset.componentId || null;
        const component_tag = node.dataset.componentTag || null;
        if (is_core_component_node && !component) throw "no default component found";
        if (is_component_node && (!component_id || !component_tag)) throw "component not found";
        replace_node_with_anchor(node, "component-block");
        processes.children.push(node_index);
        processes.component_blocks.push({ child_index: processes.children.length - 1, component, component_id, component_tag, props_id: node.dataset.blockPropsId, slot_id: node.dataset.slotId });
        return processes;
    }

    const isBlockNode = (node) => Boolean(node.dataset && node.dataset.block && node.dataset.blockId)
    if (isBlockNode(node)) {
        replace_node_with_anchor(node, node.dataset.block + "-block");
        processes.children.push(node_index);
        processes.blocks.push({ child_index: processes.children.length - 1, type: node.dataset.block, id: node.dataset.blockId });
        return processes;
    }

    if (node.attributes) {
        for (const attr of Array.from(node.attributes)) {
            const attrName = attr.name.toLowerCase();
            const attrVal = attr.value.trim();
            if (attrName.startsWith('use:')) {
                const expr = attrVal;
                const func_name = attrName.slice(4);
                if (!processes.children.includes(node_index)) processes.children.push(node_index);
                processes.use_directives.push({ child_index: processes.children.length - 1, func_name, expr });

                node.removeAttribute(attrName);
            } else if (attrName.startsWith('bind:')) {
                const property = attrName.slice(5);
                const event_name_dictionary = {
                    "checked": node.type === "date" ? "change" : "click",
                    "value": node.tagName === "select" ? "change" : "input",
                };
                const event_name = event_name_dictionary[property] ? event_name_dictionary[property] : property;

                if (!processes.children.includes(node_index)) processes.children.push(node_index);
                processes.bindings.push({ child_index: processes.children.length - 1, event_name, property, var : attrVal });

                node.removeAttribute(attrName);
            } else if (attrName.startsWith('on:')) {
                const expr = attrVal;
                const event_name = attrName.slice(3);

                if (!processes.children.includes(node_index)) processes.children.push(node_index);
                processes.events.push({ child_index: processes.children.length - 1, event_name, expr });

                node.removeAttribute(attrName);
            } else if (attrName.startsWith(":")) {
                const expr = attrVal;
                if (!processes.children.includes(node_index)) processes.children.push(node_index);
                processes.attr_funcs.push({ child_index: processes.children.length - 1, expr, property: attrName.slice(1, attrName.length) });

                node.removeAttribute(attrName);
            }
        };
    }

    const childNodes = Array.from(node.childNodes);
    for (let i = 0; i < childNodes.length; i++) process_node(childNodes[i], [...node_index, i], processes);

    return processes;
}

const resolve_child_node = (i, i_arr = []) => `.childNodes[${i}]` + ((i_arr.length <= 0) ? '' : resolve_child_node(i_arr.splice(0, 1), i_arr));

/**
 * @param {string} key
 * @param {BlockCache} block
 */
export const add_block_to_cache = (key, block) => CORE.block_cache.set(key, block);

/**
 * @param {Node} root
 */
function remove_whitespace_nodes(root) {
    let child = root.firstChild;

    while (child) {
        const next = child.nextSibling;

        if (child.nodeName !== "PRE" && child.nodeName !== "TEXTAREA" && (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.DOCUMENT_FRAGMENT_NODE))
            remove_whitespace_nodes(child);
        else if (child.nodeType === Node.TEXT_NODE)
            if (child.textContent.trim() === "") child.remove();
            else child.textContent = child.textContent.trim().replaceAll("\n", "").replaceAll("\t", "")

        child = next;
    }
}

/**
 * @param {DocumentFragment | string} fragment
 */
export function compile_template(fragment) {
    if (typeof fragment === "string") {
        const templateEl = document.createElement("template");
        templateEl.innerHTML = fragment;
        fragment = templateEl.content;
    }

    // Call "remove_whitespace_nodes" before processing any node because in production text nodes are used as anchor points for block rendering
    remove_whitespace_nodes(fragment)

    let dispose_fn_i = -1;

    const processes = process_node(fragment);
    const fragment_cache_index = CORE.fragment_cache.length;
    CORE.fragment_cache.push(fragment);

    /** @type {CoreBlock} */
    const func = new Function('anchor', '$', 'slot_fn',
    `\tconst CORE = window.__core__;
    const frag = CORE.fragment_cache[${fragment_cache_index}];
    const fragment = frag.cloneNode(true);

    const node_start = fragment.firstChild;
    const node_end = fragment.lastChild;

    /** @type {Function[]} */
    const dispose_fns = [];

    const on_mount_fn = $.onMount;
    const on_destroy_fn = $.onDestroy;
    delete $.onMount;
    delete $.onDestroy;

${
    (processes.children.length > 0 ? '\t// NODES WITH DYNAMIC PROPERTY\n\t' : '') +
    processes.children.map((child, i) => {
        return `const child${i} = fragment${resolve_child_node(child.splice(0, 1)[0] || 0, child)};`;
    }).join("\n\t")
}${
    (processes.text_funcs.length > 0 || processes.attr_funcs.length > 0) ? `\n
    // TEXT & ATTRIBUTES
    dispose_fns[${++dispose_fn_i}] = CORE.effect(() => {
        ${
        processes.text_funcs.map((func) => {
            return `CORE.set_text(child${func.child_index}, ${func.expr});`
        }).join("\n\t\t")}${
        (processes.attr_funcs.length > 0 ? "\n\t\t" : "") +
        processes.attr_funcs.map((func, i) => {
            return `CORE.set_attr(child${func.child_index}, ${func.expr}, "${func.property}");`
        }).join("\n\t")}
    })` : ''
}${
    (processes.events.length > 0 ? '\n\n\t// EVENT DELEGATION\n\t' : '') +
    processes.events.map((event) => {
        return `dispose_fns[${++dispose_fn_i}] = CORE.delegate("${event.event_name}", child${event.child_index}, (${event.expr}));`
    }).join("\n\t")
}${
    (processes.bindings.length > 0 ? '\n\n\t// TWO WAY DATA BINDING\n\t' : '') +
    processes.bindings.map((bind) => {
        return `dispose_fns[${++dispose_fn_i}] = CORE.delegate("${bind.event_name}", child${bind.child_index}, ((event) => CORE.is_signal(${bind.var}) ? ${bind.var}.set(event.target.${bind.property}) : (${bind.var} = event.target.${bind.property})))
    dispose_fns[${++dispose_fn_i}] = CORE.effect(() => (child${bind.child_index}.${bind.property} = CORE.is_signal(${bind.var}) ? ${bind.var}() : ${bind.var}));`
    }).join("\n\n\t")
}${
    (processes.blocks.length > 0 ? '\n\n\t// IF/EACH/AWAIT BLOCKS\n\t' : '') +
    processes.blocks.sort((a,b) => a.type.localeCompare(b.type)).map((block) => {
        const block_data = CORE.block_cache.get(block.id);
        if (block.type === "if") {
            return `dispose_fns[${++dispose_fn_i}] = CORE.if(child${block.child_index}, $, "${block.id}", [\n\t\t${block_data.exprs.map((expr) => `(($) => ${expr})`).join(",\n\t\t")}\n\t]);`
        } else if (block.type === "each") {
            return `dispose_fns[${++dispose_fn_i}] = CORE.each(child${block.child_index}, $, "${block.id}", (() => ${block_data.expr}), {
        ${
            block_data.keys && block_data.keys.length > 0 ?
                `${block_data.keys.map((key) => `${key} : { get() { return this[CORE.ARR_STATE][this[CORE.IDX_STATE]].${key} }, set(v) { this[CORE.ARR_STATE][this[CORE.IDX_STATE]].${key} = v; } }`).join(",\n\t\t")}` :
                `${block_data.key} : { get() { return this[CORE.ARR_STATE][this[CORE.IDX_STATE]] }, set(v) { this[CORE.ARR_STATE][this[CORE.IDX_STATE]] = v; } }`
        }${
            block_data.index_key ? `,\n\t\t${block_data.index_key} : { get() { return this[CORE.IDX_STATE]; } }` : ''
        }
    })`;
        } else if (block.type === "await") {
            const block_data = CORE.block_cache.get(block.id);
            return `dispose_fns[${++dispose_fn_i}] = CORE.await(child${block.child_index}, $, "${block.id}", (() => ${block_data.expr}));`
        }
    }).join("\n\n\t")
}${
    (processes.component_blocks.length > 0 ? '\n\n\t// IMPORTED COMPONENTS like <Component/> or\n\t// CORE COMPONENTS like <Core:component default="component_function"/>\n\t' : '') +
    processes.component_blocks.map((block, i) => {
        const component = CORE.block_cache.get(block.props_id);
        return `const component${i} = CORE.block_cache.get("${block.props_id}");
    const component${i}_components = CORE.block_cache.get("${block.component_id}");
    const component${i}_slot_fn = CORE.block_cache.get("${block.slot_id}");
    const component${i}_props = Object.create(component${i}.props);
${
    component.dynamic_props.length > 0 ? `\n\tcomponent${i}.props[CORE.PRP_STATE] = { ${component.dynamic_props.map((p) => `${p.key}: (() => ${p.expr})`).join(", ") } };\n` : ''
}
    dispose_fns[${++dispose_fn_i}] = CORE.core_component(child${block.child_index}, ${block.component ? `$.${block.component}` : `component${i}_components.${block.component_tag}` }, component${i}_props, (anchor) => component${i}_slot_fn(anchor, $));`}).join("\n\n\t")
}${
    (processes.use_directives.length > 0 ? '\n\n\t// USE DIRECTIVE\n\t' : '') +
    processes.use_directives.map((directive, i) => {
        return `dispose_fns[${++dispose_fn_i}] = $.${directive.func_name}(child${directive.child_index}, (${directive.expr}))`;
    }).join("\n\t")
}${
    processes.slot_child_index > -1 ? `\n\n\t// COMPONENT SLOT like <Core:slot/>
    if (slot_fn) {
        const fragment = document.createDocumentFragment();
        dispose_fns[${++dispose_fn_i}] = slot_fn(fragment);
        child${processes.slot_child_index}.before(fragment);
    }` : ''
}

    anchor.append(fragment);

    let on_mount_dispose_fn;

    if (typeof on_mount_fn === "function") {
        if (CORE.lifecycle.is_mounted()) {
            on_mount_dispose_fn = on_mount_fn();
        } else {
            CORE.lifecycle.defer_on_mount(on_mount_fn, (fn) => on_mount_dispose_fn = fn);
        }
    }

    // CLEAN UP
    return () => {
        if (typeof on_mount_dispose_fn === "function") on_mount_dispose_fn();
        if (typeof on_destroy_fn === "function") on_destroy_fn();

        for (const fn of dispose_fns) fn();
        dispose_fns.length = 0;

        const parent_node = node_start.parentNode;
        if (!parent_node) return;

        CORE.remove_nodes(parent_node, node_start, node_end);
    }`);

    console.log(func);

    return func;
}

/**
* Replaces all custom HTML Tags with a placeholder element to be processed as components
* @param {string} template
* @param {number} imported_component_id
*/
export function process_components(template, imported_component_id) {
    return template.replace(/<([A-Z][A-Za-z0-9]*)\s*((?:[^>"']|"[^"]*"|'[^']*')*?)\s*(\/?)>(?:([\s\S]*?)<\/\1>)?/g, (match, tag, attrStr, _, inner_content) => {
        const props = {}, dynamic_props = [], props_id = `props-${make_id(8)}`, slot_id = `slot-${make_id(8)}`;

        attrStr.replace(/([\w:@-]+)(?:\s*=\s*"([^"]*)")?/g, (_, key, value) => {
            if (key.startsWith(":")) {
                if (value) dynamic_props.push({ key: key.slice(1, key.length), expr: value });
            } else if (value) {
                props[key] = value;
            }
        })

        if (inner_content) add_block_to_cache(slot_id, compile_template(inner_content));

        // USED TO ATTACH DYNAMIC PROPS WITHOUT TRIGGER A GETTER BY USING A HIDDEN PROPERTY "CORE.PRP_STATE" SYMBOL CONTAINING FUNCTION TO REFERENCE THE PROP VALUE
        // THE DYNAMIC PROP VALUE IS A FUNCTION CALL MADE BY THE TEMPLATE COMPILER
        // DOING THIS HERE TO DEFINE PROPERTY ONCE TO SAVE ON PERFORMANCE
        if (dynamic_props.length > 0) {
            const bind_dynamic_props = new Function('props', `
                const CORE = window.__core__;
                Object.defineProperties(props, { ${dynamic_props.map((p) => `${p.key} : { get() { return this[CORE.PRP_STATE].${p.key}(); } }`).join(",\n")} })
                return props;
            `)
            bind_dynamic_props(props);
        }

        add_block_to_cache(props_id, { props, dynamic_props });

        if (match.startsWith("<Core:slot")) return `<template data-block="core-slot"></template>`;
        if (match.startsWith("<Core:component")) {
            const _default = props.default;
            delete props.default;
            return `<template data-block="core-component" data-block-props-id="${props_id}" data-component="${_default}" ${slot_id ? `data-slot-id="${slot_id}"` : ''}></template>`;
        }

        return `<template data-block="component" data-component-tag="${tag}" data-component-id="${imported_component_id}" data-block-props-id="${props_id}" ${slot_id ? `data-slot-id="${slot_id}"` : ''}></template>`;
    })
}

/**
* @param {{ template : string, components : Record<string, Function> }} options
* @param {Object} data object that encapsulate data and logic
* @param {(template:string) => DocumentFragment} template_processor
* @returns {(anchor:Node, props:Record<string, any>, slot_fn?:(anchor:Node) => void) => () => void}
*/
export function create_component(options, data, template_processor) {
    if (data && !data.toString().startsWith("class")) throw new Error("data is not a class");

    const components_id = `component-${make_id(6)}`;
    const template = process_components(options.template, components_id);
    const template_fn = compile_template(template_processor(template));

    if (options.components && Object.keys(options.components).length > 0) CORE.block_cache.set(components_id, options.components);

    return (anchor, props, slot_fn) => {
        const context = create_new_context();
        const old_context = CORE.context.set_new_context(context);
        const dispose = template_fn(anchor, !data ? {} : new data(props), slot_fn);
        CORE.context.set_new_context(old_context);
        return () => {
            dispose();
            CORE.context.set_new_context(old_context);
        };
    };
}

window.__core__ = CORE;

// CONTEXT API

const root_context = Object.create(null);
let current_context = root_context;

function create_new_context() {
    return Object.create(current_context);
}

function set_new_context(context) {
    const old_context = current_context;
    current_context = context;
    return old_context;
}

export function set_context(key, value) {
    current_context[key] = value;
}

export function get_context(key) {
    return current_context[key];
}

// LIFECYCLE API

const mount_fns = [];

let mounted = false;

function is_mounted() {
    return mounted;
}

function defer_on_mount(...args) {
    mount_fns.push(args);
}

export function mount(app, target) {
    const dispose = app(target);
    for (const [fn, cb] of mount_fns) cb(fn());
    mounted = true;
    return dispose;
}

// REACTIVITY

let is_debugger_on = false;

/** @type {Function[]} */
let effect_stack = [];
/** @type {Function | null} */
let current_effect = null;

/**
 * @type {Set<Function>}
 */
const effect_queue = new Set();
let is_flushing = false;

function track(dep) {
    if (!current_effect || dep.has(current_effect)) return;
    dep.add(current_effect);
    current_effect.deps.push(dep);
}

function trigger(dep) {
    for (const effect_fn of dep) effect_queue.add(effect_fn);

    if (is_flushing) return;
    is_flushing = true;

    queueMicrotask(() => {
        try {
            for (const fn of effect_queue) fn();
        } catch (error) {
            console.error("effect microtask execution error\n", effect_queue, error)
        } finally {
            effect_queue.clear();
            is_flushing = false;
        }
    });
}

function trigger_container(container) {
    // trigger own deps
    for (const key in container.deps) trigger(container.deps[key]);

    // recursively trigger children
    for (const key in container.children) {
        const child_container = container.children[key];
        if (child_container) trigger_container(child_container);
    }
}

/**
 * @param {{ deps : Set<Function>, children : Set<Function> }[]} effect_fn
 */
function dispose_deps(effect_fn) {
    for (const dep of effect_fn.deps) dep.delete(effect_fn);
    effect_fn.deps.length = 0;

    for (const fn of effect_fn.children) fn();
    effect_fn.children.length = 0;
}

/**
 * Returns a dispose function for manually disposal of effect
 * @param {Function} fn
 * @param {{ track_inner_effect : boolean }} options
 */
export function effect(fn, options = { track_inner_effect : true }) {
    if (typeof fn !== "function") throw "Effect callback is not a function";

    let dispose_fn = null;
    let active = true;      // flag to prevent effect re-run if already dispose

    const dispose = () => {
        if (typeof dispose_fn !== "function") return
        try {
            dispose_fn();
            dispose_fn = null;
        } catch (error) {
            console.trace("effect cleanup error\n", fn, error);
        }
    }

    const wrapped = () => {
        if (!active) return;

        dispose();
        dispose_deps(wrapped);

        effect_stack.push(wrapped);
        current_effect = wrapped;

        try {
            dispose_fn = fn();
        } catch (error) {
            // ignored
            if (is_debugger_on) console.error(error);
        } finally {
            effect_stack.pop();
            current_effect = effect_stack[effect_stack.length - 1] || null;
            if (current_effect?.track_inner_effect) current_effect.children.push(wrapped.dispose);
        }
    };

    wrapped.track_inner_effect = options.track_inner_effect;

    /** @type {Set<Function>[]} */
    wrapped.deps = [];
    /** @type {Function[]} */
    wrapped.children = [];

    wrapped.dispose = () => {
        if (!active) return;
        active = false;
        dispose();
        dispose_deps(wrapped);
    };

    wrapped();

    return wrapped.dispose;
}

const SIGNAL = Symbol();

export function is_signal(signal) {
    return Boolean(typeof signal === "function" && signal[SIGNAL]);
}

/**
 * @template {any} T
 * @param {T} initial_value
 */
export function signal(initial_value) {
    let value = initial_value;
    let container = null;

    if (is_wrappable(initial_value)) {
        container = create_container(initial_value);
        container.proxy = create_proxy(container);
    }

    const dep = new Set();

    const read = () => {
        track(dep);
        if (!container) return value;
        return container.proxy;
    }

    /**
     * @param {T} new_value
     */
    read.set = (new_value) => {
        if (is_wrappable(new_value)) {
            const is_proxy = new_value[IS_PROXY];
            const real_value = is_proxy ? proxy_to_container.get(new_value).value : new_value;

            if (!container) container = create_container(real_value);
            value = container.value = real_value;
            container.proxy = create_proxy(container);

            trigger(dep);
            trigger_container(container);
            return;
        }

        if (value === new_value) return;
        value = new_value;
        container = null;
        trigger(dep);
    }

    /**
     * @param {() => T} fn
     */
    read.update = (fn) => {
        if (typeof fn !== "function") throw "signal update fn is not a function";
        try {
            read.set(fn(value));
        } catch (error) {
            console.error("signal update error\n", fn, error);
        }
    }

    read[SIGNAL] = true;

    return read;
}

const proxy_to_container = new WeakMap();
const array_mutation_keys = new Set(["push","pop","shift","unshift","splice","sort","reverse","fill","copyWithin"]);
const map_mutation_keys = new Set(["set", "delete", "clear"]);
const map_access_keys = new Set(["get", "has", "size"]);

const IS_PROXY = Symbol("is_proxy");
const CONTAINER = Symbol("container");

export const is_proxy = (object) => typeof object === "object" && object[IS_PROXY];
const is_wrappable = (v) => v && typeof v === "object" && !(v instanceof Promise);

function create_container(object) {
    const container = {
        value: object,
        deps: Object.create(null),
        children: Object.create(null),
        proxy : null,
    };

    return container;
}

function create_proxy(container) {
    container.value[CONTAINER] = container;
    return new Proxy(container.value, {
        get(target, key) {
            if (key === IS_PROXY) return true;
            if (key === CONTAINER) return target[key];

            const container = target[CONTAINER];

            if (target instanceof Map || target instanceof Set) {
                if (map_access_keys.has(key)) return (...args) => {
                    const get_key = args[0];
                    let dep = target.deps[get_key];
                    if (!dep) dep = target.deps[get_key] = new Set();
                    track(dep)
                    return target[key](...args);
                }
                if (map_mutation_keys.has(key)) return (...args) => {
                    const result = target[key](...args.map((v) => (v && typeof v === "object" && v[IS_PROXY]) ? v[CONTAINER].proxy : v));
                    if (key !== "clear" && !(target instanceof Set && key === "set")) {
                        const get_key = args[0];
                        const dep = container.deps[get_key];
                        if (dep) trigger(dep)
                    } else {
                        trigger_container(container)
                    }
                    return result;
                }
                return target[key];
            }

            let dep = container.deps[key];
            if (!dep) dep = container.deps[key] = new Set();

            const value = target[key];

            if (!is_wrappable(value)) {
                if (typeof value === "function")
                    // Hack to trigger update when mutating an array
                    return (Array.isArray(target)) ? ((...args) => {
                        const result = target[key](...args.map((v) => (v && typeof v === "object" && v[IS_PROXY]) ? v[CONTAINER].proxy : v));
                        if (array_mutation_keys.has(key)) trigger_all_nested(container);
                        return result;
                    }) : value;
                track(dep);
                return value;
            }

            track(dep);

            let child = container.children[key];
            if (!child) {
                child = container.children[key] = create_container(value);
            } else {
                child.value = value;
            }
            child.proxy = create_proxy(child);

            return child.proxy || child.value;
        },
        set(target, key, value) {
            const container = target[CONTAINER];
            const current = target[key];
            const dep = container.deps[key];

            if (current === value) return true;

            if (is_wrappable(value) && value[CONTAINER]) {
                target[key] = value[CONTAINER].proxy;
                trigger(dep);
                return true;
            }

            target[key] = value;

            trigger(dep);

            // update nested child container
            const child = container.children[key];

            if (child && is_wrappable(value)) {
                child[CONTAINER].value = value;
            }

            return true;
        },
        deleteProperty(target, key) {
            const container = target[CONTAINER];
            delete target[key];

            const dep = container.deps[key];
            if (dep) trigger(dep);

            return true;
        }
    })
}

// HELPER FUNCTIONS

/** @type {(template_url:string) => Promise<string>} */
export const load = (template_url) => fetch(template_url).then((response) => response.text());

/** @type {(obj:any) => Boolean} */
 export const is_object = (obj) => obj && typeof obj === "object";

 /** @type {(length:number) => string} */
 export const make_id = (length) => {
     let result = '';
     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
     for (var i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
     return result;
 }
