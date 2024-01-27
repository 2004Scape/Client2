import Model from '../../graphics/Model';
import Entity from '../entity/Entity';

export default class Loc {
    // constructor
    level: number;
    y: number;
    x: number;
    z: number;
    model: Model;
    entity: Entity;
    yaw: number;
    minSceneTileX: number;
    maxSceneTileX: number;
    minSceneTileZ: number;
    maxSceneTileZ: number;
    distance: number;
    cycle: number;
    bitset: number;
    info: number; // byte

    constructor(
        level: number,
        y: number,
        x: number,
        z: number,
        model: Model,
        entity: Entity,
        yaw: number,
        minSceneTileX: number,
        maxSceneTileX: number,
        minSceneTileZ: number,
        maxSceneTileZ: number,
        distance: number,
        cycle: number,
        bitset: number,
        info: number
    ) {
        this.level = level;
        this.y = y;
        this.x = x;
        this.z = z;
        this.model = model;
        this.entity = entity;
        this.yaw = yaw;
        this.minSceneTileX = minSceneTileX;
        this.maxSceneTileX = maxSceneTileX;
        this.minSceneTileZ = minSceneTileZ;
        this.maxSceneTileZ = maxSceneTileZ;
        this.distance = distance;
        this.cycle = cycle;
        this.bitset = bitset;
        this.info = info;
    }
}
