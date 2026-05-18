import { effect, is_proxy, is_signal, trigger_dep } from "./reactivity.js";
import { make_id } from "./helper-functions.js";

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
    IDX_STATE: Symbol(),
    ARR_STATE: Symbol(),
    effect,
    is_signal,
    trigger_dep,
    version: "0.4.0",
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
        node.__cacheText = text;
        node.nodeValue = text;
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
    if: (anchor, $, id, condition_fns) => {
        const fragment = document.createDocumentFragment();
        const if_block = CORE.block_cache.get(id);
        const fns = if_block.fns;

        let prev_fn, dispose;

        return CORE.effect(() => {
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
        }, { track_inner_effect : false })
    },
    each: (anchor, $, id, arr_fn, descriptor) => {
        let else_block_dispose_fn = null;
        let existing_dispose_blocks = [];
        let curr_arr;

        const fragment = document.createDocumentFragment();
        const each_block = CORE.block_cache.get(id);
        const $sub = Object.create($);
        Object.defineProperties($sub, descriptor);

        return CORE.effect(() => {
            const arr = arr_fn();

            if (curr_arr === arr && !is_proxy(curr_arr)) return;

            curr_arr = arr;
            $sub[CORE.ARR_STATE] = arr;

            if (!arr || arr?.length <= 0) {
                if (existing_dispose_blocks.length > 0) {
                    const anchor_parent_node = anchor.parentNode;
                    anchor_parent_node.innerHTML = "";
                    anchor_parent_node.append(anchor);
                }

                for (const dispose of existing_dispose_blocks) dispose();
                existing_dispose_blocks.length = 0;

                if (!each_block.else_fn || else_block_dispose_fn) return;
                else_block_dispose_fn = each_block.else_fn(fragment, $);
                anchor.before(fragment);
                return;
            }

            if (else_block_dispose_fn) else_block_dispose_fn = else_block_dispose_fn() ? null : null;

            const new_each_dispose_blocks = [];

            for (let i = 0; i < arr.length; i++) {
                if (existing_dispose_blocks[i]) {
                    new_each_dispose_blocks.push(existing_dispose_blocks[i]);
                    CORE.trigger_dep(arr, i);
                    continue;
                }

                const $ = Object.create($sub);
                $[CORE.IDX_STATE] = i;
                const dispose = each_block.fn(fragment, $);
                new_each_dispose_blocks.push(dispose);
            }

            // TEAR DOWN BLOCKS THAT ARE BEYOND THE NEW ARRAY LENGTH
            for (let i = new_each_dispose_blocks.length; i < existing_dispose_blocks.length; i++) {
                existing_dispose_blocks[i]();
            }

            if (new_each_dispose_blocks.length > 0) anchor.before(fragment);

            existing_dispose_blocks = new_each_dispose_blocks;
        }, { track_inner_effect : false })
    },
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

        return CORE.effect(() => {
            const promise = await_fn();
            const curr_id = Math.random();
            last_id = curr_id;

            if (!(promise instanceof Promise)) {
                dispose_fn = await_block.then_fn(fragment, $);
                anchor.before(fragment);
                return dispose_fn;
            }

            pending_dispose_fn = await_block.pending_fn(fragment, $);
            anchor.before(fragment);

            promise.then((value) => {
                if (last_id !== curr_id || !await_block.then_fn) return;
                const $sub = Object.create($);
                $sub[await_block.then_key] = value;
                dispose_fn = await_block.then_fn(fragment, $sub);
            }).catch((error) => {
                if (last_id !== curr_id || !await_block.catch_fn) return;
                const $sub = Object.create($);
                $sub[await_block.catch_key] = error;
                dispose_fn = await_block.catch_fn(fragment, $sub);
            }).finally(() => {
                if (last_id !== curr_id) return;
                pending_dispose_fn();
                pending_dispose_fn = null;
                anchor.before(fragment);
            });

            return dispose;
        }, { track_inner_effect : false });
    },
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

/**
 * @param {Node} node
 * @param {number[]} node_index
 * @param {Processes} processes
 */
function processNode(node, node_index = [], processes = { children: [], events: [], bindings: [], attr_funcs: [], text_funcs: [], blocks: [], core_component_blocks: [], component_blocks: [], use_directives: [], slot_child_index: -1 }) {
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
        const anchor = new Comment("component-block");
        node.parentNode.replaceChild(anchor, node);
        processes.children.push(node_index);
        processes.component_blocks.push({ child_index: processes.children.length - 1, component, component_id, component_tag, props_id: node.dataset.blockPropsId, slot_id: node.dataset.slotId });
        return processes;
    }

    const isBlockNode = (node) => Boolean(node.dataset && node.dataset.block && node.dataset.blockId)
    if (isBlockNode(node)) {
        const anchor = new Comment(node.dataset.block + "-block");
        node.parentNode.replaceChild(anchor, node);
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
    for (let i = 0; i < childNodes.length; i++) processNode(childNodes[i], [...node_index, i], processes);

    return processes;
}

function resolveChildNode(i, i_arr = []) {
    return `.childNodes[${i}]` + ((i_arr.length <= 0) ? '' : resolveChildNode(i_arr.splice(0, 1), i_arr));
}

/**
 * @param {string} key
 * @param {BlockCache} block
 */
export const addBlockToCache = (key, block) => CORE.block_cache.set(key, block);

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
export function compileTemplate(fragment) {
    if (typeof fragment === "string") {
        const templateEl = document.createElement("template");
        templateEl.innerHTML = fragment;
        fragment = templateEl.content;
    }

    remove_whitespace_nodes(fragment)

    let dispose_fn_i = -1;

    const processes = processNode(fragment);
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

${
    (processes.children.length > 0 ? '\t// NODES WITH DYNAMIC PROPERTY\n\t' : '') +
    processes.children.map((child, i) => {
        return `const child${i} = fragment${resolveChildNode(child.splice(0, 1), child)};`;
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
    }).join("\n\t")
}${
    (processes.blocks.length > 0 ? '\n\n\t// IF/EACH/AWAIT BLOCKS\n\t' : '') +
    processes.blocks.map((block) => {
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
    const component${i}_dynamic_props = [${component.dynamic_props.map((prop) => `{ key : "${prop.key}", fn : (($) => ${prop.expr || 'null'}) }`).join("\n\t\t")}];

    dispose_fns[${++dispose_fn_i}] = CORE.effect(() => {
        for (const prop of component${i}_dynamic_props) component0.props[prop.key] = prop.fn($);
        return CORE.core_component(child${block.child_index}, ${block.component ? `$.${block.component}` : `component${i}_components.${block.component_tag}` }, component${i}.props, (anchor) => component${i}_slot_fn(anchor, $));
    })`}).join("\n\t")
}${
    (processes.use_directives.length > 0 ? '\n\n\t// USE DIRECTIVE\n\t' : '') +
    processes.use_directives.map((directive, i) => {
        return `dispose_fns[${++dispose_fn_i}] = $.${directive.func_name}(child${directive.child_index}, (${directive.expr}))`;
    })
}${
    processes.slot_child_index > -1 ? `\n\n\t// COMPONENT SLOT like <Core:slot/>
    if (slot_fn) {
        const fragment = document.createDocumentFragment();
        dispose_fns[${++dispose_fn_i}] = slot_fn(fragment);
        child${processes.slot_child_index}.before(fragment);
    }` : ''
}

    anchor.append(fragment);

    // CLEAN UP
    return () => {
        for (const fn of dispose_fns) fn();
        dispose_fns.length = 0;
        const parent_node = node_start.parentNode;
        if (!parent_node) return;
        CORE.remove_nodes(parent_node, node_start, node_end);
    }`);

    return func;
}

/**
* Replaces all custom HTML Tags with a placeholder element to be processed as components
* @param {string} template
* @param {number} imported_component_id
*/
export function processComponents(template, imported_component_id) {
    return template.replace(/<([A-Z][A-Za-z0-9]*)\s*((?:[^>"']|"[^"]*"|'[^']*')*?)\s*(\/?)>(?:([\s\S]*?)<\/\1>)?/g, (match, tag, attrStr, _, inner_content) => {
        const props = {}, dynamic_props = [], props_id = `props-${make_id(8)}`, slot_id = `slot-${make_id(8)}`;

        attrStr.replace(/([\w:@-]+)(?:\s*=\s*"([^"]*)")?/g, (_, key, value) => {
            if (key.startsWith(":")) {
                dynamic_props.push({ key : key.slice(1, key.length), expr: value });
            } else if (value) {
                props[key] = value;
            }
        })

        if (inner_content) addBlockToCache(slot_id, compileTemplate(inner_content));
        addBlockToCache(props_id, { props, dynamic_props });

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
* @param {Object} context object that encapsulate data and logic
* @param {(template:string) => DocumentFragment} template_processor
* @returns {(anchor:Node, props:Record<string, any>, slot_fn?:Function) => () => void}
*/
export function createComponent(options, context, template_processor) {
    if (context && !context.toString().startsWith("class")) throw new Error("context is not a class");

    const components_id = `component-${make_id(6)}`;
    const template = processComponents(options.template, components_id);
    const template_fn = compileTemplate(template_processor(template));

    if (options.components && Object.keys(options.components).length > 0) CORE.block_cache.set(components_id, options.components);

    return (anchor, props, slot_fn) => template_fn(anchor, !context ? {} : new context(props), slot_fn);
}

window.__core__ = CORE;
