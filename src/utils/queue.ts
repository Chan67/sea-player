class Queue<T> {
    private _count: number;
    private _item: Array<T>;

    constructor(count: number) {
        this._count = count;
        this._item = [];
    }
    get Count() {
        return this._item.length;
    }
    /**
     * 入列
     * @param element T
     */
    enqueue(element: T) {
        if (this._item.length > this._count) {
            this._item.shift();
        }
        this._item.push(element);
    }
    enqueueFront(element: T) {
        this._item.unshift(element);
    }

    /**
     * 出列
     * @returns T
     */
    dequeue() {
        return this._item.shift();
    }
    dequeueBack() {
        return this._item.pop();
    }

    peek() {
        return this._item[0];
    }

    clear() {
        this._item = [];
    }
}
export default Queue;