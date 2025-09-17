export const config = {
    player: { walkSpeed: 0.88, jumpSpeed: 0.075, gravityPerTick: 0.002, mouseSensitivity: { x: 0.15, y: 0.15 }, maxJumpHeightBlocks: 1.8 },
    camera: { thirdPersonDistance: 4, heightOffset: 0.35, maxFirstPitch: 90, maxThirdPitch: 85 },
    zombie: { baseSpeed: 0.036 * 0.825, walkSpeedFactor: 0.1 * 1.5, gravity: 0.045, jumpPower: 0.075, idleJumpImpulse: 0.084, jumpCooldownMs: 1e3 },
    pathfinding: { maxSteps: 24 },
    controls: { spawnKey: "KeyG", togglePathsKey: "Digit7" },
    blockPreview: { top: "-17px", bottom: "2px", right: "-16px", width: "92px", height: void 0, zIndex: 2e3, pointerEvents: "none" },
};
export default config;
