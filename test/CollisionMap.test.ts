import CollisionMap from '../src/js/jagex2/dash3d/CollisionMap';
import CollisionFlag from '../src/js/jagex2/dash3d/CollisionFlag';
import LocShape from '../src/js/jagex2/dash3d/LocShape';
import LocAngle from '../src/js/jagex2/dash3d/LocAngle';

describe('CollisionMap', (): void => {
    describe('reset', (): void => {
        it('on constructing', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            expect(collisionMap.flags[CollisionMap.index(0, 0)]).toBe(CollisionFlag.BOUNDS);
            expect(collisionMap.flags[CollisionMap.index(102, 102)]).toBe(CollisionFlag.OPEN);
            expect(collisionMap.flags[CollisionMap.index(103, 103)]).toBe(CollisionFlag.BOUNDS);
        });
    });

    describe('floor', (): void => {
        it('blocked', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            collisionMap.addFloor(22, 22);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.FLOOR);
        });

        it('not blocked', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            collisionMap.addFloor(22, 22);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.FLOOR);
            collisionMap.removeFloor(22, 22);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.OPEN);
        });
    });

    describe('wall', (): void => {
        it('blocked no range', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            collisionMap.addWall(22, 22, LocShape.WALL_STRAIGHT.id, LocAngle.EAST, false);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.WALL_EAST);
        });

        it('blocked no range', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            collisionMap.addWall(22, 22, LocShape.WALL_STRAIGHT.id, LocAngle.EAST, true);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.WALL_EAST | CollisionFlag.WALL_EAST_PROJ_BLOCKER);
        });

        it('not blocked', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            collisionMap.addWall(22, 22, LocShape.WALL_STRAIGHT.id, LocAngle.EAST, true);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.WALL_EAST | CollisionFlag.WALL_EAST_PROJ_BLOCKER);
            collisionMap.removeWall(22, 22, 0, 2, false);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.WALL_EAST_PROJ_BLOCKER);
            collisionMap.removeWall(22, 22, 0, 2, true);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.OPEN);
        });

        it('not blocked 2', (): void => {
            const collisionMap: CollisionMap = new CollisionMap();
            collisionMap.addWall(22, 22, LocShape.WALL_STRAIGHT.id, LocAngle.EAST, true);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.WALL_EAST | CollisionFlag.WALL_EAST_PROJ_BLOCKER);
            collisionMap.removeWall(22, 22, 0, 2, true);
            expect(collisionMap.flags[CollisionMap.index(22, 22)]).toBe(CollisionFlag.OPEN);
        });
    });
});
