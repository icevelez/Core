/** @type {(obj:any) => Boolean} */
export const is_object = (obj) => obj && typeof obj === "object";

/** @type {(length:number) => string} */
export const make_id = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (var i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
}
