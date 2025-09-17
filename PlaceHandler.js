// new file
import { playBreakSoundForTile } from './Sound.js';

// Exposed control for block selector flash interval (milliseconds).
// Default 20000ms (~20s) — slowed down because the selector was flashing far too fast.
// Modules may call setBlockSelectorFlashInterval(ms) to override.
export let BLOCK_SELECTOR_FLASH_INTERVAL_MS = 20000;
export function setBlockSelectorFlashInterval(ms) { BLOCK_SELECTOR_FLASH_INTERVAL_MS = Math.max(50, Number(ms) || 800); }
export function getBlockSelectorFlashInterval() { return BLOCK_SELECTOR_FLASH_INTERVAL_MS; }

// Add: helper to compute a robust block target from a Raycaster hit (used by RubyDung for highlight/preview)
export function computeBlockTargetFromRay(world, raycaster, meshes) {
    try {
        if (!raycaster || !meshes || meshes.length === 0) return null;
        const intersects = raycaster.intersectObjects(meshes, true);
        if (!intersects || intersects.length === 0) return null;
        const hit = intersects[0];
        const localNormal = hit.face.normal.clone();
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
        const normal = localNormal.applyMatrix3(normalMatrix).normalize();
        const eps = 0.01;
        // nudge into the hit surface to pick the block whose face was hit
        const p = hit.point.clone().sub(normal.clone().multiplyScalar(eps));
        let bx = Math.floor(p.x);
        let by = Math.floor(p.y);
        let bz = Math.floor(p.z);
        // top-face special handling: prefer block below when normal points up
        if (normal.y > 0.5) by = Math.floor(hit.point.y - 0.5);
        // If the chosen block is air, search downward a few blocks for nearest solid block
        let found = false;
        for (let off = 0; off <= 6; off++) {
            const ty = by - off;
            if (ty < 0) break;
            if (world.getTile(bx, ty, bz) !== 0) { by = ty; found = true; break; }
        }
        if (!found) {
            // small neighborhood fallback search
            for (let dx = -1; dx <= 1 && !found; dx++) {
                for (let dz = -1; dz <= 1 && !found; dz++) {
                    for (let off = 0; off <= 6; off++) {
                        const ty = by - off;
                        const tx = bx + dx;
                        const tz = bz + dz;
                        if (tx < 0 || tz < 0 || ty < 0 || tx >= world.width || tz >= world.height || ty >= world.depth) continue;
                        if (world.getTile(tx, ty, tz) !== 0) { bx = tx; by = ty; bz = tz; found = true; break; }
                    }
                }
            }
        }
        if (!found) return null;
        return { x: bx, y: by, z: bz, normal, hitObject: hit.object };
    } catch (e) {
        return null;
    }
}

export function placeOnTop(world, tx, tz, tileId, opts = {}) {
    // opts: { maxAbove: number, forbidBedrock: boolean, particles, refreshCallback }
    const forbidBedrock = opts.forbidBedrock !== false;
    const bedrockId = (world && world.blockMaterials) ? ((world.Tiles && world.Tiles.bedrock && world.Tiles.bedrock.id) || 8) : 8;

    if (tx < 0 || tz < 0 || tx >= world.width || tz >= world.height) return false;

    // Find highest solid block Y in column
    let top = -1;
    for (let y = world.depth - 1; y >= 0; y--) {
        const id = world.getTile(tx, y, tz);
        if (id !== 0) { top = y; break; }
    }

    // If column is empty, place at ground level 0
    let placeY = (top === -1) ? 0 : top + 1;
    // Strict rule: only ever place exactly one block above the highest solid block
    if (placeY < 0 || placeY >= world.depth) return false;

    // If top is bedrock and we forbid placing above bedrock, fail
    if (forbidBedrock && top >= 0) {
        const topId = world.getTile(tx, top, tz);
        if (topId === bedrockId) return false;
    }

    // Enforce single-block rule: if the exact spot is occupied, refuse to place
    if (world.getTile(tx, placeY, tz) !== 0) return false;

    // Prevent placing inside player: if a player bounding box intersects the target block AABB, refuse
    try {
        const p = window.player;
        if (p && p.boundingBox) {
            // check a small vertical neighborhood (one below..one above) to avoid placing inside the player's ~2-block tall area
            for (let yy = placeY - 1; yy <= placeY + 1; yy++) {
                if (yy < 0 || yy >= world.depth) continue;
                const blockAABB = {
                    minX: tx,
                    minY: yy,
                    minZ: tz,
                    maxX: tx + 1,
                    maxY: yy + 1,
                    maxZ: tz + 1
                };
                if (p.boundingBox.intersects(blockAABB)) return false;
            }
        }
    } catch (e) { /* ignore safety check errors */ }

    // Place the tile and update world state
    world.setTile(tx, placeY, tz, tileId);
    // If placing a bush (id 6), detect the texture key of the block below and set
    // the bush tile's bottomTextureKey so the bush will visually inherit that png.
    try {
        if (tileId === 6) {
            const belowId = world.getTile(tx, placeY - 1, tz);
            const belowTile = (typeof Tiles !== 'undefined' && Tiles.byId) ? Tiles.byId[belowId] : null;
            const belowTextureKey = belowTile ? belowTile.getTextureKey(1) : null;
            // Apply only if we found a valid key
            if (belowTextureKey) {
                if (typeof Tiles !== 'undefined' && Tiles.bush) {
                    Tiles.bush.bottomTextureKey = belowTextureKey;
                }
            }
        }
    } catch (e) { /* ignore */ }

    // NEW: protect grass beneath newly-placed bush from reverting to dirt
    try {
        if (tileId === 6) {
            // the grass block is at (tx, placeY-1, tz)
            world._bushProtected = world._bushProtected || new Set();
            const protectKey = `${tx}_${placeY - 1}_${tz}`;
            world._bushProtected.add(protectKey);
        }
    } catch (e) { /* ignore protection errors */ }

    // Attempt to trigger a chunk refresh via provided callback or world mechanics
    if (typeof opts.refreshCallback === 'function') opts.refreshCallback(tx, placeY, tz);
    // spawn particles if provided
    try {
        if (opts.particles && typeof opts.particles.burst === 'function') {
            opts.particles.burst(tx + 0.5, placeY + 0.5, tz + 0.5, 6, 0.12, opts.particleTexture || null);
        }
    } catch (e) { /* ignore */ }

    return true;
}

// NEW: place a block beneath the lowest solid block in the column (i.e., attach to bottom)
// This is used when a user wants to attach something to the underside of an overhang or to place "downwards off of" a block.
export function placeBelowBlock(world, tx, tz, tileId, opts = {}) {
    const forbidBedrock = opts.forbidBedrock !== false;
    const bedrockId = (world && world.blockMaterials) ? ((world.Tiles && world.Tiles.bedrock && world.Tiles.bedrock.id) || 8) : 8;
    if (tx < 0 || tz < 0 || tx >= world.width || tz >= world.height) return false;

    // Find highest solid block Y in column
    let top = -1;
    for (let y = world.depth - 1; y >= 0; y--) {
        const id = world.getTile(tx, y, tz);
        if (id !== 0) { top = y; break; }
    }

    // If column is empty, there is nothing to attach under; place at y=0 instead (bottom of world)
    if (top === -1) {
        const placeY = 0;
        if (world.getTile(tx, placeY, tz) !== 0) return false;
        // Prevent placing into player
        try {
            const p = window.player;
            if (p && p.boundingBox) {
                for (let yy = placeY - 1; yy <= placeY + 1; yy++) {
                    if (yy < 0 || yy >= world.depth) continue;
                    const blockAABB = { minX: tx, minY: yy, minZ: tz, maxX: tx+1, maxY: yy+1, maxZ: tz+1 };
                    if (p.boundingBox.intersects(blockAABB)) return false;
                }
            }
        } catch (e) {}
        world.setTile(tx, placeY, tz, tileId);
        if (typeof opts.refreshCallback === 'function') opts.refreshCallback(tx, placeY, tz);
        try { if (opts.particles && typeof opts.particles.burst === 'function') opts.particles.burst(tx+0.5, placeY+0.5, tz+0.5, 6, 0.12, opts.particleTexture || null); } catch(e){}
        return true;
    }

    // We're attaching to the underside of the top block -> target y is top - 1
    const targetY = top - 1;
    if (targetY < 0 || targetY >= world.depth) return false;

    // If the target slot is occupied, refuse to overwrite
    if (world.getTile(tx, targetY, tz) !== 0) return false;

    // If the top block is bedrock and we forbid bedrock attachments, fail
    if (forbidBedrock) {
        const topId = world.getTile(tx, top, tz);
        if (topId === bedrockId) return false;
    }

    // Prevent placing inside player
    try {
        const p = window.player;
        if (p && p.boundingBox) {
            for (let yy = targetY - 1; yy <= targetY + 1; yy++) {
                if (yy < 0 || yy >= world.depth) continue;
                const blockAABB = { minX: tx, minY: yy, minZ: tz, maxX: tx+1, maxY: yy+1, maxZ: tz+1 };
                if (p.boundingBox.intersects(blockAABB)) return false;
            }
        }
    } catch (e) { /* ignore */ }

    world.setTile(tx, targetY, tz, tileId);
    if (typeof opts.refreshCallback === 'function') opts.refreshCallback(tx, targetY, tz);
    try { if (opts.particles && typeof opts.particles.burst === 'function') opts.particles.burst(tx+0.5, targetY+0.5, tz+0.5, 6, 0.12, opts.particleTexture || null); } catch(e){}
    return true;
}

// Add alias so modules can import placeOnBottom (calls same implementation)
export const placeOnBottom = placeBelowBlock;

// NEW: break the lowest solid block in a column (useful for "breaking off of" downward-facing attachments)
// Returns true if a block was broken.
export function breakLowest(world, tx, tz, opts = {}) {
    const forbidBedrock = opts.forbidBedrock !== false;
    const bedrockId = (world && world.blockMaterials) ? ((world.Tiles && world.Tiles.bedrock && world.Tiles.bedrock.id) || 8) : 8;
    if (tx < 0 || tz < 0 || tx >= world.width || tz >= world.height) return false;

    // Find lowest solid block (closest to bottom)
    let bottom = -1;
    for (let y = 0; y < world.depth; y++) {
        const id = world.getTile(tx, y, tz);
        if (id !== 0) { bottom = y; break; }
    }
    if (bottom === -1) return false;

    const targetId = world.getTile(tx, bottom, tz);
    if (forbidBedrock && targetId === bedrockId) return false;

    // Play sound and spawn particles before clearing
    try { playBreakSoundForTile(targetId, `breakLowest_${tx}_${bottom}_${tz}`); } catch (e) { /* ignore */ }
    world.setTile(tx, bottom, tz, 0);
    if (typeof opts.refreshCallback === 'function') opts.refreshCallback(tx, bottom, tz);
    try { if (opts.particles && typeof opts.particles.burst === 'function') opts.particles.burst(tx+0.5, bottom+0.5, tz+0.5, 8, 0.2, opts.particleTexture || null); } catch(e){}
    return true;
}

// NEW helper export so other modules (World.js) can call it by name expected there
export function _playBreakSoundForTile(tileId) {
    try { playBreakSoundForTile(tileId); } catch (e) { /* ignore */ }
}

// inside breakBottom, play sound before clearing the block
export function breakBottom(world, tx, tz, opts = {}) {
    const forbidBedrock = opts.forbidBedrock !== false;
    const bedrockId = (world && world.blockMaterials) ? ((world.Tiles && world.Tiles.bedrock && world.Tiles.bedrock.id) || 8) : 8;
    if (tx < 0 || tz < 0 || tx >= world.width || tz >= world.height) return false;

    // If caller provided a specific Y (targetY) use it — this makes breaking from a bottom face behave like side breaks.
    let targetY = (typeof opts.targetY === 'number') ? opts.targetY : null;

    // If no explicit targetY, fall back to the previous "lowest solid block" behavior
    if (targetY === null) {
        let bottom = -1;
        for (let y = 0; y < world.depth; y++) {
            const id = world.getTile(tx, y, tz);
            if (id !== 0) { bottom = y; break; }
        }
        if (bottom === -1) return false;
        targetY = bottom;
    }

    if (targetY < 0 || targetY >= world.depth) return false;

    const targetId = world.getTile(tx, targetY, tz);
    if (targetId === 0) return false; // nothing to break at specified coord
    if (forbidBedrock && targetId === bedrockId) return false;

    // Play appropriate sound for the block being broken
    try { _playBreakSoundForTile(targetId); } catch (e) { /* ignore */ }

    world.setTile(tx, targetY, tz, 0);
    if (typeof opts.refreshCallback === 'function') opts.refreshCallback(tx, targetY, tz);
    try {
        if (opts.particles && typeof opts.particles.burst === 'function') {
            opts.particles.burst(tx + 0.5, targetY + 0.5, tz + 0.5, 8, 0.2, opts.particleTexture || null);
        }
    } catch (e) { /* ignore */ }

    return true;
}