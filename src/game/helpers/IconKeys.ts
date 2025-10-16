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
    MOVE_SPEED_UP: 52,
    // 53-63
    // 64+
} as const;

export type IconKey = keyof typeof ICON_FRAMES;