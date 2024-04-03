export default class CollisionFlag {
    static readonly OPEN: number = 0x0;
    static readonly WALL_NORTH_WEST: number = 0x1;
    static readonly WALL_NORTH: number = 0x2;
    static readonly WALL_NORTH_EAST: number = 0x4;
    static readonly WALL_EAST: number = 0x8;
    static readonly WALL_SOUTH_EAST: number = CollisionFlag.WALL_NORTH_WEST << 4; // 16 0x10
    static readonly WALL_SOUTH: number = CollisionFlag.WALL_NORTH << 4; // 32 0x20
    static readonly WALL_SOUTH_WEST: number = CollisionFlag.WALL_NORTH_EAST << 4; // 64 0x40
    static readonly WALL_WEST: number = CollisionFlag.WALL_EAST << 4; // 128 0x80

    static readonly LOC: number = 0x100; // 256
    static readonly WALL_NORTH_WEST_PROJ_BLOCKER: number = 0x200; // 512
    static readonly WALL_NORTH_PROJ_BLOCKER: number = 0x400; // 1024
    static readonly WALL_NORTH_EAST_PROJ_BLOCKER: number = 0x800; // 2048
    static readonly WALL_EAST_PROJ_BLOCKER: number = 0x1000; // 4096
    static readonly WALL_SOUTH_EAST_PROJ_BLOCKER: number = CollisionFlag.WALL_NORTH_WEST_PROJ_BLOCKER << 4; // 8192 0x2000
    static readonly WALL_SOUTH_PROJ_BLOCKER: number = CollisionFlag.WALL_NORTH_PROJ_BLOCKER << 4; // 16384 0x4000
    static readonly WALL_SOUTH_WEST_PROJ_BLOCKER: number = CollisionFlag.WALL_NORTH_EAST_PROJ_BLOCKER << 4; // 32768 0x8000
    static readonly WALL_WEST_PROJ_BLOCKER: number = CollisionFlag.WALL_EAST_PROJ_BLOCKER << 4; // 65536 0x10000
    static readonly LOC_PROJ_BLOCKER: number = CollisionFlag.LOC << 9; // 131072 0x20000

    static readonly ANTIMACRO: number = 0x80000; // 524288
    static readonly FLOOR: number = 0x200000; // 2097152

    static readonly FLOOR_BLOCKED: number = CollisionFlag.FLOOR | CollisionFlag.ANTIMACRO; // 2621440 0x280000
    static readonly WALK_BLOCKED: number = CollisionFlag.LOC | CollisionFlag.FLOOR_BLOCKED; // 2621696 0x280100

    static readonly BLOCK_SOUTH: number = CollisionFlag.WALL_NORTH | CollisionFlag.WALK_BLOCKED; // 2621698 0x280102

    static readonly BLOCK_WEST: number = CollisionFlag.WALL_EAST | CollisionFlag.WALK_BLOCKED; // 2621704 0x280108
    static readonly BLOCK_SOUTH_WEST: number = CollisionFlag.WALL_NORTH | CollisionFlag.WALL_NORTH_EAST | CollisionFlag.BLOCK_WEST; // 2621710 0x28010E

    static readonly BLOCK_NORTH: number = CollisionFlag.WALL_SOUTH | CollisionFlag.WALK_BLOCKED; // 2621728 0x280120
    static readonly BLOCK_NORTH_WEST: number = CollisionFlag.WALL_EAST | CollisionFlag.WALL_SOUTH_EAST | CollisionFlag.BLOCK_NORTH; // 2621752 0x280138

    static readonly BLOCK_EAST: number = CollisionFlag.WALL_WEST | CollisionFlag.WALK_BLOCKED; // 2621824 0x280180
    static readonly BLOCK_SOUTH_EAST: number = CollisionFlag.WALL_NORTH_WEST | CollisionFlag.WALL_NORTH | CollisionFlag.BLOCK_EAST; // 2621827 0x280183

    static readonly BLOCK_NORTH_EAST: number = CollisionFlag.WALL_SOUTH | CollisionFlag.WALL_SOUTH_WEST | CollisionFlag.BLOCK_EAST; // 2621920 0x2801E0

    static readonly BOUNDS: number = 0xffffff; // 16777215
}
