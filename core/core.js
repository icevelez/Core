export async function load(template_url) {
    return fetch(template_url).then((response) => response.text());
}
