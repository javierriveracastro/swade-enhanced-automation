import {add_modifiers} from "./skill_modifiers.js"

console.log("SWADE automation enhancement loaded")
Hooks.on("swadePreRollSkill", add_modifiers)