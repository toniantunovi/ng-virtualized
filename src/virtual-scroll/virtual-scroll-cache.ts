import { ItemWidthAverager } from './item-width-averager';

export interface VirtualScrollCacheEntry {
    width: number;
    height: number;
}

export class VirtualScrollCache {
    private _cache = new Map<string, VirtualScrollCacheEntry>();
    private _averager: ItemWidthAverager;
    private _zoomLevel = 1.0;

    constructor(minItemWidth?: number) {
        this._averager = new ItemWidthAverager(minItemWidth);
    }

    get(key: any) {
        let value = this._cache.get(key);
        return {
            width: value.width * this._zoomLevel,
            height: value.height * this._zoomLevel
        };
    }

    set(key: any, value: VirtualScrollCacheEntry) {
        value.height = value.height / this._zoomLevel;
        value.width = value.width / this._zoomLevel;
        this._cache.set(key, value);
        this._averager.addItem(value);
    }

    has(key: any) {
        return this._cache.has(key);
    }

    isEmpty() {
        return this._cache.size === 0;
    }

    clear() {
        this._cache.clear();
        this._averager.reset();
    }

    getAverageItemWidth() {
        return this._averager.getAverageItemWidth() * this._zoomLevel;
    }

    getHeight() {
        return this._cache.entries().next().value[1].height * this._zoomLevel;
    }

    setZoomLevel(zoomLevel) {
        if (zoomLevel === 0) throw new Error('Zoom level can not be set to zero.');
        this._zoomLevel = zoomLevel;
    }
}
