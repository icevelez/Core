import { create_controller_store } from "../lib/controller.js";

/** @type {{ todo:string, done:boolean }[]} */
const todo_arr = [];

export const todo = create_controller_store(todo_arr, {
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
