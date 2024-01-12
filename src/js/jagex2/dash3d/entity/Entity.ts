import Linkable from '../../datastruct/Linkable';
import Model from '../../graphics/Model';

export default abstract class Entity extends Linkable {
    abstract draw(loopCycle: number): Model | null;
}
