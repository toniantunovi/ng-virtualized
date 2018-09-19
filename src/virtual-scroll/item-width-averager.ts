import { VirtualScrollCacheEntry } from "./virtual-scroll-cache";

export class ItemWidthAverager {
    private _totalWeight = 0;
    private _averageItemWidth: number;
    private _defaultItemWidth: number;

    constructor(defaultItemWidth = 50) {
        this._defaultItemWidth = defaultItemWidth;
        this._averageItemWidth = defaultItemWidth;
    }

    getAverageItemWidth(): number {
        return this._averageItemWidth;
    }

    addItem(item: VirtualScrollCacheEntry) {
        const newTotalWeight = this._totalWeight + 1;
        if (newTotalWeight) {
            const newAverageItemWidth =
                (item.width + this._defaultItemWidth * this._totalWeight) / newTotalWeight;
            if (newAverageItemWidth) {
                this._averageItemWidth = newAverageItemWidth;
                this._totalWeight = newTotalWeight;
            }
        }
    }

    reset() {
        this._averageItemWidth = this._defaultItemWidth;
        this._totalWeight = 0;
    }
}
