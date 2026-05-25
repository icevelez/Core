import { component as handlebar_component } from "./parser/handlebar.js";

/**
 * @param {string} url
 */
export async function component(url) {

    let { script, template, error } = await fetch(url).then(async response => {
        if (response.ok) {
            const base = document.createElement("template");
            base.innerHTML = await response.text();

            const script = base.content.querySelector("script")?.innerHTML || "";
            const template = base.content.querySelector("template")?.innerHTML || "";

            return { script, template, error : null };
        }
        return { error: await response.text() };
    });
    if (error) throw error;

    template = template.replaceAll(`<core:`, `<Core:`);

    if (!script) return handlebar_component({ template });

    const href = window.location.href;
    const script_context = script.replaceAll(`from "#`, `from "${href.substring(0, href.length - 1)}`);
    const script_blob = new Blob([script_context], { type: 'text/javascript' });
    const script_url = URL.createObjectURL(script_blob);

    const { default: ctx, ...components } = await import(script_url);

    Object.keys(components).forEach(component => {
        template = template.replaceAll(`<${component.toLowerCase()}`, `<${component}`);
        template = template.replaceAll(`</${component.toLowerCase()}>`, `</${component}>`);
    })

    return handlebar_component({ template, components }, ctx);
}
