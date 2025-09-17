export class AABB {
    constructor(minX, minY, minZ, maxX, maxY, maxZ) {
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    expand(x, y, z) {
        let newMinX = this.minX;
        let newMinY = this.minY;
        let newMinZ = this.minZ;
        let newMaxX = this.maxX;
        let newMaxY = this.maxY;
        let newMaxZ = this.maxZ;

        if (x < 0) newMinX += x; else newMaxX += x;
        if (y < 0) newMinY += y; else newMaxY += y;
        if (z < 0) newMinZ += z; else newMaxZ += z;

        return new AABB(newMinX, newMinY, newMinZ, newMaxX, newMaxY, newMaxZ);
    }

    move(x, y, z) {
        this.minX += x;
        this.minY += y;
        this.minZ += z;
        this.maxX += x;
        this.maxY += y;
        this.maxZ += z;
    }

    clipXCollide(other, x) {
        if (other.maxY <= this.minY || other.minY >= this.maxY || other.maxZ <= this.minZ || other.minZ >= this.maxZ) {
            return x;
        }
        if (x > 0 && other.maxX <= this.minX) {
            const max = this.minX - other.maxX;
            if (max < x) x = max;
        }
        if (x < 0 && other.minX >= this.maxX) {
            const max = this.maxX - other.minX;
            if (max > x) x = max;
        }
        return x;
    }

    clipYCollide(other, y) {
        if (other.maxX <= this.minX || other.minX >= this.maxX || other.maxZ <= this.minZ || other.minZ >= this.maxZ) {
            return y;
        }
        if (y > 0 && other.maxY <= this.minY) {
            const max = this.minY - other.maxY;
            if (max < y) y = max;
        }
        if (y < 0 && other.minY >= this.maxY) {
            const max = this.maxY - other.minY;
            if (max > y) y = max;
        }
        return y;
    }

    clipZCollide(other, z) {
        if (other.maxX <= this.minX || other.minX >= this.maxX || other.maxY <= this.minY || other.minY >= this.maxY) {
            return z;
        }
        if (z > 0 && other.maxZ <= this.minZ) {
            const max = this.minZ - other.maxZ;
            if (max < z) z = max;
        }
        if (z < 0 && other.minZ >= this.maxZ) {
            const max = this.maxZ - other.minZ;
            if (max > z) z = max;
        }
        return z;
    }

    intersects(other) {
        return other.maxX > this.minX && other.minX < this.maxX &&
               other.maxY > this.minY && other.minY < this.maxY &&
               other.maxZ > this.minZ && other.minZ < this.maxZ;
    }
}
