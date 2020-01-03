export abstract class Poolable {
    public static NO_OWNER = -1;
    currentOwnerId = Poolable.NO_OWNER;

    public abstract instantiate(): Poolable;
}

/**
 * An object pool for recycling of object instances extending Poolable.
 *
 *
 * Cost/Benefit :
 *   Cost - The pool can only contain objects extending Poolable.
 *   Benefit - The pool can very quickly determine if an object is elligable for storage without iteration.
 *   Benefit - The pool can also know if an instance of Poolable is already stored in a different pool instance.
 *   Benefit - The pool can grow as needed, if it is empty
 *   Cost - However, refilling the pool when it is empty might incur a time cost with sufficiently large capacity.  Set the replenishPercentage to a lower number if this is a concern.
 *
 * Created by Tony Patino on 6/20/16.
 */
export class ObjectPool<T extends Poolable> {
    private static ids = 0;

    private poolId;
    private desiredCapacity;
    private objects: any[];
    private objectsPointer;
    private modelObject: T;
    private replenishPercentage;

    /**
     * Returns the id of the given pool instance.
     *
     * @return an integer ID belonging to this pool instance.
     */
    public getPoolId() {
        return this.poolId;
    }

    /**
     * Returns an ObjectPool instance, of a given starting capacity, that recycles instances of a given Poolable object.
     *
     * @param withCapacity A positive integer value.
     * @param object An instance of the object that the pool should recycle.
     * @return
     */
    public static create<T extends Poolable>(withCapacity, object: T) {
        const result = new ObjectPool<T>(withCapacity, object);
        result.poolId = ObjectPool.ids++;
        // ObjectPool.ids++;

        return result;
    }

    constructor(withCapacity, object: T) {
        if (withCapacity <= 0) {
            throw new Error('Object Pool must be instantiated with a capacity greater than 0!');
        }
        this.desiredCapacity = withCapacity;
        this.objects = new Array(this.desiredCapacity);
        this.objectsPointer = 0;
        this.modelObject = object;
        this.replenishPercentage = 1.0;
        this.refillPool();
    }

    /**
     * Set the percentage of the pool to replenish on empty.  Valid values are between
     * 0.00 and 1.00
     *
     * @param percentage a value between 0 and 1, representing the percentage of the pool to replenish.
     */
    public setReplenishPercentage(percentage) {
        let p = percentage;
        if (p > 1) {
            p = 1;
        } else if (p < 0) {
            p = 0;
        }
        this.replenishPercentage = p;
        return this;
    }

    public getReplenishPercentage() {
        return this.replenishPercentage;
    }

    private refillPool(percentage?) {
        if (percentage === undefined) {
            this.refillPool(this.replenishPercentage);
        } else {
            let portionOfCapacity = this.desiredCapacity * percentage;

            if (portionOfCapacity < 1) {
                portionOfCapacity = 1;
            } else if (portionOfCapacity > this.desiredCapacity) {
                portionOfCapacity = this.desiredCapacity;
            }

            for (let i = 0; i < portionOfCapacity; i++) {
                this.objects[i] = this.modelObject.instantiate();
            }
            this.objectsPointer = portionOfCapacity - 1;
        }
    }

    /**
     * Returns an instance of Poolable.  If get() is called with an empty pool, the pool will be
     * replenished.  If the pool capacity is sufficiently large, this could come at a performance
     * cost.
     *
     * @return An instance of Poolable object T
     */
    public get(): T {
        if (this.objectsPointer == -1 && this.replenishPercentage > 0.0) {
            this.refillPool();
        }

        const result = this.objects[this.objectsPointer] as T;
        result.currentOwnerId = Poolable.NO_OWNER;
        this.objectsPointer--;

        return result;
    }

    /**
     * Recycle an instance of Poolable that this pool is capable of generating.
     * The T instance passed must not already exist inside this or any other ObjectPool instance.
     *
     * @param object An object of type T to recycle
     */
    public recycle(object: T | T[]) {
        if (Array.isArray(object)) {
            while (this.objects.length + this.objectsPointer + 1 > this.desiredCapacity) {
                this.resizePool();
            }
            const objectsListSize = this.objects.length;

            // Not relying on recycle(T object) because this is more performant.
            for (let i = 0; i < objectsListSize; i++) {
                const object = this.objects[i];
                if (object.currentOwnerId != Poolable.NO_OWNER) {
                    if (object.currentOwnerId == this.poolId) {
                        throw new Error('The object passed is already stored in this pool!');
                    } else {
                        throw new Error('The object to recycle already belongs to poolId ' + object.currentOwnerId + '.  Object cannot belong to two different pool instances simultaneously!');
                    }
                }
                object.currentOwnerId = this.poolId;
                this.objects[this.objectsPointer + 1 + i] = object;
            }
            this.objectsPointer += objectsListSize;
        } else {
            if (object.currentOwnerId != Poolable.NO_OWNER) {
                if (object.currentOwnerId == this.poolId) {
                    throw new Error('The object passed is already stored in this pool!');
                } else {
                    throw new Error('The object to recycle already belongs to poolId ' + object.currentOwnerId + '.  Object cannot belong to two different pool instances simultaneously!');
                }
            }

            this.objectsPointer++;
            if (this.objectsPointer >= this.objects.length) {
                this.resizePool();
            }

            object.currentOwnerId = this.poolId;
            this.objects[this.objectsPointer] = object;
        }
    }

    private resizePool() {
        const oldCapacity = this.desiredCapacity;
        this.desiredCapacity *= 2;
        const temp = new Array(this.desiredCapacity);
        for (let i = 0; i < oldCapacity; i++) {
            temp[i] = this.objects[i];
        }
        this.objects = temp;
    }

    /**
     * Returns the capacity of this object pool.  Note : The pool will automatically resize
     * to contain additional objects if the user tries to add more objects than the pool's
     * capacity allows, but this comes at a performance cost.
     *
     * @return The capacity of the pool.
     */
    public getPoolCapacity() {
        return this.objects.length;
    }

    /**
     * Returns the number of objects remaining in the pool, for diagnostic purposes.
     *
     * @return The number of objects remaining in the pool.
     */
    public getPoolCount() {
        return this.objectsPointer + 1;
    }
}
