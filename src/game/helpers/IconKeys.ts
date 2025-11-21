export const ICON_FRAMES = {
    CAMPFIRE: 0,
    POT: 1,
    // 2-15
    DEFENSE: 16,
    DEFENSE_EXTRA: 17,
    // 18-31
    TOWER: 32,
    FIRE_ARROWS: 33,
    CANONBALL: 34,
    // 35-47
    HP_UP: 48,
    DMG_UP: 49,
    RANGE_UP: 50,
    ACTION_SPEED_UP: 51,
    PROJECTILE_SPEED_UP: 51,
    SPEED_UP: 52,
    DMG_DOWN: 53,
    COST_DOWN: 54,
    COST_UP: 55,
    HP_DOWN: 56,
    SPAWN_DOWN: 57,
    SPAWN_UP: 58,
    ARMOR_DOWN: 59,
    ARMOR_UP: 60,
    SPECIAL_POWER: 61,
    // 53-63
    // 64+
} as const;

export type IconKey = keyof typeof ICON_FRAMES;