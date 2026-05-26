import { add_block_to_cache, compile_template, create_component, make_id } from "../runtime.js";

/**
 * @param {string} url
 */
export async function sfc(url) {
    const { script, template, error } = await fetch(url).then(async response => {
        const text = await response.text();
        if (!response.ok) return { error: text };

        const base = document.createElement("template");
        base.innerHTML = text;

        const scriptEl = base.content.querySelector("script");
        const script = scriptEl?.innerHTML || "";
        const template = text.replace(scriptEl?.outerHTML, "");

        return { script, template, error : null };
    });
    if (error) throw error;

    if (!script) return component({ template });

    const href = window.location.href;
    const script_content = `//# sourceURL=${url.split("/").at(-1)}${script}`.replaceAll(`from "#`, `from "${href.substring(0, href.length - 1)}`);
    const script_blob = new Blob([script_content], { type: 'text/javascript' });
    const script_url = URL.createObjectURL(script_blob);
    const { default: ctx, ...component_promises } = await import(script_url);

    const components_keys = Object.keys(component_promises);
    const components_arr = await Promise.all(components_keys.map((k) => component_promises[k]));
    const components = {};

    for (let i = 0; i < components_keys.length; i++) components[components_keys[i]] = components_arr[i];

    return component({ template, components }, ctx);
}

/**
* @param {{ template : string, components : Record<string, Function> }} options
* @param {Object} Ctx anonymous class that encapsulate data and logic
*/
export function component(options, Ctx = class { }) {
    return create_component(options, Ctx, function (source) {
        const blockPattern = /{{#(await|if|each)(.*?)}}|{{\/(await|if|each)}}/gs, stack = [], blocks = [];
        let match;

        while ((match = blockPattern.exec(source))) {
            const [full, openName, , closeName] = match;
            if (openName) {
                stack.push({ name: openName, start: match.index, end: null, outer: '', placeholder: '' });
            } else if (closeName) {
                const last = stack.pop();
                if (!last || last.name !== closeName) throw new Error(`Unbalanced block: expected {{/${last?.name}}} but found {{/${closeName}}}`);
                last.end = match.index + full.length;
                last.outer = source.slice(last.start, last.end);
                blocks.push(last);
            }
        }

        blocks.sort((a, b) => b.start - a.start);

        let html = source;
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i], block_id = `${block.name}-${make_id(6)}`;
            for (let j = 0; j < i; j++) {
                if (!block.outer.includes(blocks[j].outer)) continue;
                block.outer = block.outer.replace(blocks[j].outer, blocks[j].placeholder);
                block.end -= blocks[j].outer.length - blocks[j].placeholder.length; // modify block.end when replacing
            }
            block.placeholder = `<template data-block="${block.name}" data-block-id="${block_id}"></template>`;
            html = html.slice(0, block.start) + block.placeholder + html.slice(block.end);
            add_block_to_cache(block_id, parse[block.name](block.outer));
        }

        return html;
    });
}

const RE = {
    each: /{{#each\s+(.+?)\s+as\s+((?:\w+|\{[\s\S]*?\}|\([\s\S]*?\)))\s*(?:,\s*(\w+))?}}([\s\S]*?){{\/each}}/g,
    if: /{{#if\s+(.+?)}}([\s\S]*?){{\/if}}/g,
    else: /{{:else\s+if\s+(.+?)}}|{{:else}}/g,
    await: /{{#await\s+(.+?)}}([\s\S]*?){{\/await}}/g,
    then: /\{\{:then(?:\s+(\w+))?\}\}([\s\S]*?)(?={{:|$)/,
    catch: /\{\{:catch(?:\s+(\w+))?\}\}([\s\S]*?)(?={{:|$)/,
    blockSplit: /{{:then[\s\S]*?}}|{{:catch[\s\S]*?}}/,
};

const parse = {
    if: function (block) {
        RE.if.lastIndex = RE.else.lastIndex = 0;
        const match = RE.if.exec(block);
        if (!match) throw new Error("parsing error on \"if\" block");

        const [, firstCond, firstBody] = match, exprs = [], fns = [];
        let lastCond = firstCond, lastIndex = 0, m;

        while ((m = RE.else.exec(firstBody))) {
            if (m.index > lastIndex) {
                exprs.push(lastCond);
                fns.push(compile_template(firstBody.slice(lastIndex, m.index)))
            }
            if (m[0].startsWith("{{:else if")) {
                lastCond = m[1];
                lastIndex = m.index + m[0].length;
            } else {
                exprs.push("true");
                fns.push(compile_template(firstBody.slice(m.index + m[0].length)))
                lastIndex = firstBody.length;
                break;
            }
        }

        if (lastIndex < firstBody.length) {
            exprs.push(lastCond);
            fns.push(compile_template(firstBody.slice(lastIndex)))
        }

        return { fns, exprs : exprs.map((expr) => expr.trim()) };
    },
    each: function (block) {
        RE.each.lastIndex = 0;
        const match = RE.each.exec(block);
        if (!match) throw new Error("parsing error on \"each\" block")

        const [, expr, blockVar, indexVar, content] = match,
            parts = content.split(/{{:empty}}/),
            trimmedVar = blockVar.trim();

        return {
            expr: expr.trim(),
            fn: parts[0] ? compile_template(parts[0]) : undefined,
            else_fn: parts[1] ? compile_template(parts[1]) : undefined,
            key: trimmedVar,
            keys: trimmedVar.startsWith("{") || trimmedVar.startsWith("[") ? trimmedVar.slice(1, -1).split(",").map(v => v.trim()) : [],
            index_key: indexVar?.trim() || "",
        };
    },
    await: function (block) {
        RE.await.lastIndex = RE.then.lastIndex = RE.catch.lastIndex = RE.blockSplit.lastIndex = 0;
        const match = RE.await.exec(block);
        if (!match) throw new Error("parsing error on \"await\" block");

        const [, promiseExpr, content] = match,
            thenMatch = RE.then.exec(content),
            catchMatch = RE.catch.exec(content),
            pending = content.split(RE.blockSplit)[0] || "";

        return {
            expr: promiseExpr.trim(),
            pending_fn: pending ? compile_template(pending) : undefined,
            then_fn: thenMatch && thenMatch[2] ? compile_template(thenMatch[2]) : undefined,
            then_key: thenMatch && thenMatch[1] || undefined,
            catch_fn: catchMatch && catchMatch[2] ? compile_template(catchMatch[2]) : undefined,
            catch_key: catchMatch && catchMatch[1] || undefined,
        };
    },
}
