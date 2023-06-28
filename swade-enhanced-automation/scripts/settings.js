// Code related to settings and configuration
/* global game */

const name_space = "swade-enhanced-automation";

export function register_settings() {
    game.settings.register(name_space, 'gangup-distance', {
        name: game.i18n.localize("SWADE-EA.settings.gangup-distance.name"),
        hint: game.i18n.localize("SWADE-EA.settings.gangup-distance.hint"),
        default: 1.2,
        type: Number,
        scope: "world",
        config: true
    });
}

export function get_setting(name) {
    return game.settings.get(name_space, name);
}