import { createItemMacro, rollItemMacro } from '../macros/rollItem.js';


Hooks.once("ready", async function() {
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});
