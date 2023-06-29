// Code to add new modifiers
/* global game, console, canvas, Ray */

import {get_setting} from "./settings.js";

export function add_modifiers(actor, skill, roll, modifiers, options) {
    const fighting_name = game.settings.get('swade', 'parryBaseSkill');
    if (skill.name === fighting_name) {
        const attacking_tokens = actor.getActiveTokens();
        const target_tokens = game.user.targets;
        if (attacking_tokens.length > 0 && target_tokens.size > 0) {
            push_modifier(modifiers, "Gang-up", calculate_gangUp(attacking_tokens[0], target_tokens.first()));
            push_modifier(modifiers, "Scale", calculate_scale(attacking_tokens[0], target_tokens.first()));
        }
    }
    push_modifier(modifiers, "Armor over strength", calculate_armor_min_str(actor, skill));
}

function push_modifier(modifiers, label, value) {
    if (value === 0) {
        return;
    }
    modifiers.push({label: label, value: value});
}

/**
 *  Calculates gangup modifier, by Bruno Calado
 * @param {Token }attacker
 * @param {Token }target
 * @return {number} modifier
 * pg 101 swade core
 * - Each additional adjacent foe (who isn’t Stunned)
 * - adds +1 to all the attackers’ Fighting rolls, up to a maximum of +4.
 * - Each ally adjacent to the defender cancels out one point of Gang Up bonus from an attacker adjacent to both.
 */
function calculate_gangUp(attacker, target) {
    if (!attacker || !target) {
        console.log("Trying to calculate gangup with no token", attacker, target);
        return 0;
    }
    if (attacker.document.disposition === target.document.disposition) {return 0;}
    let enemies = 0;
    let allies = 0;
    if(attacker.document.disposition === 1 || attacker.document.disposition === -1) {
        let item_range = get_setting('gangup-distance');
        let allies_within_range_of_target;
        let enemies_within_range_of_target;
        let enemies_within_range_both_attacker_target;
        // disposition -1 means NPC (hostile) is attacking PCs (friendly)
        // disposition 1 PCs (friendly) is attacking NPC (hostile)
        allies_within_range_of_target = canvas.tokens.placeables.filter(t =>
            t.id !== attacker.id &&
                t.document.disposition === attacker.document.disposition &&
                t?.actor?.system.status.isStunned === false &&
                t.visible &&
                withinRange(target, t, item_range) &&
                !t.combatant?.defeated
        );
        enemies_within_range_of_target = canvas.tokens.placeables.filter(t =>
            t.id !== target.id &&
                t.document.disposition === attacker.document.disposition * -1 &&
                t?.actor?.system.status.isStunned === false &&
                withinRange(target, t, item_range) &&
                !t.combatant?.defeated
        );
        //alliedWithinRangeOfTargetAndAttacker intersection with attacker and target
        enemies_within_range_both_attacker_target = enemies_within_range_of_target.filter(t =>
            t.document.disposition === attacker.document.disposition * -1 &&
                t?.actor?.system.status.isStunned === false &&
                withinRange(attacker, t, item_range) &&
            !t.combatant?.defeated
        );
        enemies = allies_within_range_of_target.length;
        allies = enemies_within_range_both_attacker_target.length;
    }
    const reduction = gang_up_reduction(target.actor);
    const addition = gang_up_addition(attacker.actor);
    let modifier = Math.max(0, (enemies - allies - reduction + addition));
    return Math.min(4, modifier);
}

// function from Kekilla
function withinRange(origin, target, range) {
    if (Math.abs(origin.document.elevation - target.document.elevation) >= 1) {
        return false;
    }
    const size_mod_origin = (origin.document.width + origin.document.height)/2;
    const size_mod_target = (target.document.width + target.document.height)/2;
    const calculated_range = range - 0.5 + Math.max(size_mod_origin, size_mod_target);
    const ray = new Ray(origin, target);
    const grid_unit = canvas.grid.grid.options.dimensions.distance;
    let distance = canvas.grid.measureDistances([{ ray }], {gridSpaces: false})[0];
    distance /= grid_unit;
    return calculated_range >= distance;
}

/**
 * Gets the gangup reduction from an actor (using a custom AE
 * @param {Actor} target
 */
function gang_up_reduction(target) {
    let reduction = 0;
    for (let effect of target.effects) {
        if (!effect.disabled) {
            for (let change of effect.changes) {
                if (change.key === 'brsw-ac.gangup-reduction') {
                    reduction += parseInt(change.value) ? change.value : 0;
                }
            }
        }
    }
    return reduction;
}

/**
 * Gets the gangup addition from an actor (using a custom AE)
 * @param {Actor} attacker
 */
 function gang_up_addition(attacker) {
    let addition = 0;
    for (let effect of attacker.effects) {
        if (!effect.disabled) {
            for (let change of effect.changes) {
                if (change.key === 'brsw-ac.gangup-addition') {
                    addition += parseInt(change.value) ? change.value : 0;
                }
            }
        }
    }
    return addition;
}

function calculate_scale(attacker, target) {
    const attacker_size = attacker.actor.system.stats.size || attacker.actor.system.size || 1;
    const target_size = target.actor.system.stats.size || target.actor.system.size || 1;
    if (attacker_size !== target_size) {
        return target.actor.calcScale(target_size) - attacker.actor.calcScale(attacker_size);
    }
    return 0;
}

function calculate_armor_min_str(actor, skill) {
    if (skill.system.attribute !== 'agility') {
        return 0;
    }
    const min_str_armors = actor.items.filter((item) =>
       {return item.type === 'armor' && item.system.minStr && item.system.equipStatus >= 2;});
    console.log(min_str_armors)
    for (let armor of min_str_armors) {
        let penalty = process_minimum_str_modifiers(armor, actor);
        if (penalty) {
            return penalty;
        }
    }
    return 0;
}

function process_minimum_str_modifiers(item, actor) {
    const split_min_str = item.system.minStr.split('d');
    const min_str_die_size = parseInt(split_min_str[split_min_str.length - 1]);
    let str_die_size = actor?.system?.attributes?.strength?.die?.sides;
    if (actor?.system?.attributes?.strength.encumbranceSteps) {
        str_die_size += Math.max(actor?.system?.attributes?.strength.encumbranceSteps * 2, 0);
    }
    if (min_str_die_size > str_die_size) {
        // Minimum strength is not meet
        return -Math.trunc((min_str_die_size - str_die_size) / 2);
    }
    return 0;
}