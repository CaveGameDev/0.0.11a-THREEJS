export class Tile {
    constructor(e, i, t, s) {
        (this.id = e), (this.sideTextureKey = i), (this.topTextureKey = t), (this.bottomTextureKey = s), (this.fullCube = !0), (this.breakableSides = !0);
    }
    getTextureKey(e) {
        let i;
        switch (e) {
            case 0:
                i = this.topTextureKey;
                break;
            case 1:
                i = this.bottomTextureKey;
                break;
            default:
                i = this.sideTextureKey;
        }
        return i;
    }
    isSolid() {
        return 0 !== this.id && this.id !== (Tiles.water && Tiles.water.id) && this.id !== (Tiles.bush && Tiles.bush.id);
    }
    isFullCube() {
        return !!this.fullCube;
    }
    hasBreakableSides() {
        return (!Tiles.bedrock || this.id !== Tiles.bedrock.id) && !!this.breakableSides;
    }
}
export const Tiles = {
    stone: new Tile(1, "stone", "stone", "stone"),
    dirt: new Tile(2, "dirt", "dirt", "dirt"),
    cobble: new Tile(3, "2", "2", "2"),
    wood: new Tile(4, "wood", "wood", "wood"),
    grass: new Tile(9, "grass_side", "1", "dirt"),
    bush: new Tile(6, "bush", null, null),
    water: new Tile(5, "water", "water", "water"),
    bedrock: new Tile(8, "bedrock", "bedrock", "bedrock"),
    stoneBrick: new Tile(7, "2", "2", "2"),
    byId: {},
    init: function () {
        for (const e of Object.values(this)) e instanceof Tile && (this.byId[e.id] = e);
    },
};
Tiles.init();
