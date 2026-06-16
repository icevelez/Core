import { signal } from "core";

class RouterInstance {

    #path = signal("");
    #searchParamsSignal = signal({});

    #searchParams = {
        get: (key) => this.#searchParamsSignal[0]()[key],
        set: (key, value) => this.#searchParamsSignal[0]()[key] = value,
        delete: (key) => delete this.#searchParamsSignal[0]()[key],
        toString: () => Object.entries(this.#searchParamsSignal[0]()).map(([key, value]) => `${key}=${value}`).join("&"),
    }
    #pathParam = new Map();

    /**
     * Used to cache RegEx and ParamNames of a Route to skip doing ".replace" and ".push" inside `matchRoute()`
     * @type {Map<string, { regex : RegExp, paramNames : string[] }>}
     */
    #cachePatterns = new Map();

    #updateHashFragment = () => {
        let route = window.location.hash.replace("#", ""), searchParamString = "";
        if (route.substring(0, 1) !== "/") route = `/${route}`;

        [route, searchParamString] = route.split("?");

        this.#path[1](route);
        const searchparam = new URLSearchParams(searchParamString);
        searchparam.forEach((value, key) => {
            if (key === '[object Object]') return;
            this.#searchParams.set(key, value)
        });
    }

    get searchParams() {
        return this.#searchParams;
    };

    get pathParams() {
        return this.#pathParam;
    };

    get pathname() {
        return this.#path[0]();
    }

    /**
     * @param {string} key
     * @param {string} value
     */
    setSearchParam = (key, value) => {
        this.searchParams.set(key, value);
        window.location.hash = `${this.pathname}?${this.searchParams.toString()}`;
    }

    /**
     * @param {string} key
     */
    removeSearchParam = (key) => {
        this.searchParams.delete(key);
        window.location.hash = `${this.pathname}${this.searchParams.size > 0 ? `?${this.searchParams.toString()}` : ''}`;
    }

    /**
     * @param {string} path
     * @param {URLSearchParams} queryParam
     */
    goto = (path, queryParams = this.searchParams) => {
        window.location.hash = `${path}${queryParams.size > 0 ? `?${queryParams.toString()}` : ''}`;
    }

    constructor() {
        this.#updateHashFragment();
        window.addEventListener('hashchange', this.#updateHashFragment);
    }

    /**
     * @param {string} route_pattern
     */
    match = (route_pattern) => {
        let route = { regex: new RegExp(""), paramNames: [] };

        if (this.#cachePatterns.has(route_pattern)) {
            route = this.#cachePatterns.get(route_pattern);
        } else {
            route.regex = new RegExp("^" + route_pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                .replace(/:([^\/]+)/g, (_, key) => {
                    route.paramNames.push(key);
                    return "([^/]+)";
                })
                .replace(/\/\*$/, () => {
                    route.paramNames.push("wildcard");
                    return "(?:/(.*))?";
                }) + "$");

            this.#cachePatterns.set(route_pattern, route);
        }

        const match = this.pathname.match(route.regex);
        const result = { is_match: false, params: {} };
        if (!match) return result;

        this.#pathParam.clear();

        for (let i = 0; i < route.paramNames.length; i++) {
            result.params[route.paramNames[i]] = match[i + 1];
            this.#pathParam.set(route.paramNames[i], match[i + 1])
        }

        result.is_match = true;
        return result;
    }
}

export const Router = new RouterInstance();
