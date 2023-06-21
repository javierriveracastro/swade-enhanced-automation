import {add_modifiers} from "./skill_modifiers.js"
import {register_settings} from "./settings.js";

console.log("SWADE automation enhancement loaded")

Hooks.on("swadePreRollSkill", add_modifiers)
Hooks.on("init", register_settings)