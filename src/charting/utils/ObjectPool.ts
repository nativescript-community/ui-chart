export abstract class Poolable {
    public static mNO_OWNER = -1;
    mCurrentOwnerId = Poolable.mNO_OWNER;

    public abstract instantiate(): Poolable;
}

const WRONG_POOL = 'object_wrong_poolid';
const ALREADY_STORED = 'object_already_stored';
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
    private static mIds = 0;

    private mPoolId;
    private mDesiredCapacity;
    private mObjects: any[];
    private mObjectsPointer;
    private mModelObject: T;
    private mReplenishPercentage;

    /**
     * Returns the id of the given pool instance.
     *
     * @return an integer ID belonging to this pool instance.
     */
    public getPoolId() {
        return this.mPoolId;
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
        result.mPoolId = ObjectPool.mIds++;
        // ObjectPool.ids++;

        return result;
    }

    constructor(withCapacity, object: T) {
        if (withCapacity <= 0) {
            throw new Error('Object Pool must be instantiated with a capacity greater than 0!');
        }
        this.mDesiredCapacity = withCapacity;
        this.mObjects = new Array(this.mDesiredCapacity);
        this.mObjectsPointer = 0;
        this.mModelObject = object;
        this.mReplenishPercentage = 1.0;
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
        this.mReplenishPercentage = p;
        return this;
    }

    public getReplenishPercentage() {
        return this.mReplenishPercentage;
    }

    private refillPool(percentage?) {
        if (percentage === undefined) {
            this.refillPool(this.mReplenishPercentage);
        } else {
            let portionOfCapacity = this.mDesiredCapacity * percentage;

            if (portionOfCapacity < 1) {
                portionOfCapacity = 1;
            } else if (portionOfCapacity > this.mDesiredCapacity) {
                portionOfCapacity = this.mDesiredCapacity;
            }

            for (let i = 0; i < portionOfCapacity; i++) {
                this.mObjects[i] = this.mModelObject.instantiate();
            }
            this.mObjectsPointer = portionOfCapacity - 1;
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
        if (this.mObjectsPointer === -1 && this.mReplenishPercentage > 0.0) {
            this.refillPool();
        }

        const result = this.mObjects[this.mObjectsPointer] as T;
        result.mCurrentOwnerId = Poolable.mNO_OWNER;
        this.mObjectsPointer--;

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
            while (this.mObjects.length + this.mObjectsPointer + 1 > this.mDesiredCapacity) {
                this.resizePool();
            }
            const objectsListSize = this.mObjects.length;

            // Not relying on recycle(T object) because this is more performant.
            for (let i = 0; i < objectsListSize; i++) {
                const object = this.mObjects[i];
                if (object.currentOwnerId !== Poolable.mNO_OWNER) {
                    if (object.currentOwnerId === this.mPoolId) {
                        throw new Error(ALREADY_STORED);
                    } else {
                        throw new Error(WRONG_POOL);
                    }
                }
                object.currentOwnerId = this.mPoolId;
                this.mObjects[this.mObjectsPointer + 1 + i] = object;
            }
            this.mObjectsPointer += objectsListSize;
        } else {
            if (object.mCurrentOwnerId !== Poolable.mNO_OWNER) {
                if (object.mCurrentOwnerId === this.mPoolId) {
                    throw new Error(ALREADY_STORED);
                } else {
                    throw new Error(WRONG_POOL);
                }
            }

            this.mObjectsPointer++;
            if (this.mObjectsPointer >= this.mObjects.length) {
                this.resizePool();
            }

            object.mCurrentOwnerId = this.mPoolId;
            this.mObjects[this.mObjectsPointer] = object;
        }
    }

    private resizePool() {
        const oldCapacity = this.mDesiredCapacity;
        this.mDesiredCapacity *= 2;
        const temp = new Array(this.mDesiredCapacity);
        for (let i = 0; i < oldCapacity; i++) {
            temp[i] = this.mObjects[i];
        }
        this.mObjects = temp;
    }

    /**
     * Returns the capacity of this object pool.  Note : The pool will automatically resize
     * to contain additional objects if the user tries to add more objects than the pool's
     * capacity allows, but this comes at a performance cost.
     *
     * @return The capacity of the pool.
     */
    public getPoolCapacity() {
        return this.mObjects.length;
    }

    /**
     * Returns the number of objects remaining in the pool, for diagnostic purposes.
     *
     * @return The number of objects remaining in the pool.
     */
    public getPoolCount() {
        return this.mObjectsPointer + 1;
    }
}
