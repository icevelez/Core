import { managed_signal } from "core";

/** @type {{ todo:string, done:boolean }[]} */
const todo_arr = [
    {
        todo: "Create a store that cannot directly be mutated (except for objects)",
        done : false,
    },
    {
        todo: "Add more todos",
        done : false,
    }
];

export const TodoStore = managed_signal(todo_arr, {
    add_todo: (value, todo) => {
        value.push({ todo, done: false });
        return value;
    },
    remove_todo: (value, todo_index) => {
        value.splice(todo_index, 1);
        return value;
    },
    toggle_todo: (value, todo_index) => {
        value[todo_index].done = !value[todo_index].done;
        return value;
    }
})
