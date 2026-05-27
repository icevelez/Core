const CONTROLLER_VALUE = Symbol();

/**
 * @template T
 * @template {Record<string, (value:T, ...args:any[]) => (T | Promise<T>)>} A
 *
 * @param {T} value
 * @param {A} actions
 *
 * @returns {{ state : T } & { [K in keyof A]: (...args: Parameters<A[K]> extends [any, ...infer R] ? R : never) => ReturnType<A[K]> }}
 */
export function create_controller(value, actions) {
    const action_keys = Object.keys(actions).filter(k => k !== "state");
    const defined_actions = {
        [CONTROLLER_VALUE]: value,
        get state() {
            return this[CONTROLLER_VALUE];
        },
    };

    for (const key of action_keys) defined_actions[key] = function (...args) {
        const value = actions[key](this[CONTROLLER_VALUE], ...args);
        if (value instanceof Promise) return value.then((value) => this[CONTROLLER_VALUE] = value);
        this[CONTROLLER_VALUE] = value;
        return value;
    }

    return defined_actions;
}

async function example() {

    const todo_controller = create_controller([], {
        /**
         * @param {string} url
         */
        fetch_from_url: async (value, url) => {
            value = fetch(url).then(r => !r.ok ? [] : r.json()).catch(e => { console.error(e); return []; });
            return value;
        },
        /**
         * @param {string} todo
         */
        add_todo: (value, todo) => {
            value.push({ todo, completed : false });
            return value;
        },
        /**
         * @param {number} index
         */
        delete_todo: (value, index) => {
            value.splice(index, 1);
            return value;
        },
        /**
         * @param {number} index
         */
        mark_todo_as_complete: (value, index) => {
            value[index].completed = true;
            return value;
        }
    })

    await todo_controller.fetch_from_url("/api/v1/todos")           // Promise<[]> (error: 404 /api/v1/todos not found)

    todo_controller.state                                           // []

    todo_controller.add_todo("Recreate redux/flux/controller");     // [{ todo : "Recreate redux/flux/controller", complete : false }]
    todo_controller.add_todo("Example")                             // [{ todo : "Recreate redux/flux/controller", complete : false }, { todo : "Example", complete : false }]
    todo_controller.add_todo("Hello World")                         // [{ todo : "Recreate redux/flux/controller", complete : false }, { todo : "Example", complete : false }, { todo : "Hello World", complete : false }]
    todo_controller.mark_todo_as_complete(0);                       // [{ todo : "Recreate redux/flux/controller", complete : true }, { todo : "Example", complete : false }, { todo : "Hello World", complete : false }]
    todo_controller.delete_todo(1);                                 // [{ todo : "Recreate redux/flux/controller", complete : true }, { todo : "Hello World", complete : false }]

    todo_controller.state                                           // [{ todo : "Recreate redux/flux/controller", complete : true }, { todo : "Hello World", complete : false }]
}
