import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';

import { VirtualScrollCache } from './virtual-scroll-cache';
import { VirtualScrollViewport, ScrollDirection } from './virtual-scroll-viewport';

export interface VirtualScrollItem {
  id: any;
}

export interface VirtualScrollGroup {
  items: VirtualScrollItem[];
}

@Component({
  selector: 'ab-virtual-scroll,[abVirtualScroll]',
  exportAs: 'abVirtualScroll',
  template: `
    <virtual-scroll-viewport [itemIdKey]="itemIdKey">
      <ng-content></ng-content>
    </virtual-scroll-viewport>
    `
})
export class VirtualScrollComponent implements OnInit, OnDestroy {
  @ViewChild(VirtualScrollViewport) _viewport: VirtualScrollViewport;

  @Input()
  items: VirtualScrollGroup[] = [];

  @Input()
  bufferSize: number = 0;

  @Input()
  groupHeaderHeight: number = 0;

  @Input()
  childHeight: number;

  @Input()
  cache: VirtualScrollCache;

  @Input()
  itemIdKey: string = 'id';

  @Input()
  loadMoreThreshold = 0.2;

  @Input()
  loadMoreThrottleTime = 1000;

  @Output()
  loadMore = new EventEmitter<void>();

  @Output()
  update = new EventEmitter<any[]>();

  private _lastGroupStartIndex: number = 0;
  private _lastItemStartIndex: number = 0;
  private _lastGroupEndIndex: number = 0;
  private _lastItemEndIndex: number = 0;
  private _currentChildHeight: number = this.childHeight;
  private _loadMoreThrottle = new Subject();

  private _componentDestroyed$ = new Subject<void>();

  constructor(private readonly _zone: NgZone) { }

  ngOnInit() {
    this._addViewportEventHandlers();
    this.refresh(true, true);
    this._loadMoreThrottle.pipe(takeUntil(this._componentDestroyed$), throttleTime(this.loadMoreThrottleTime)).subscribe(() => this.loadMore.emit());
  }

  ngOnDestroy() {
    this._componentDestroyed$.next();
    this._componentDestroyed$.complete();
  }

  refresh(forceViewportUpdate, clearCache, scrollTop = false) {
    if (clearCache && this.cache) this.cache.clear();
    this._viewport.refresh(scrollTop);

    this._zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this._updateRenderedContent(forceViewportUpdate));
    });
  }

  updateZoomLevel(zoomLevel) {
    this.cache.setZoomLevel(zoomLevel);
    this.refresh(true, false, false);
  }

  private _addViewportEventHandlers() {
    this._zone.runOutsideAngular(() => {
      this._viewport.onScroll().pipe(takeUntil(this._componentDestroyed$)).subscribe(this.refresh.bind(this));
      this._viewport.onResize().pipe(takeUntil(this._componentDestroyed$)).subscribe(() => {
        this._viewport.refresh();
        this.refresh(true, false);
      });
    });
  }

  private _calculateStartData(childWidth: number) {
    const startHeight = this._viewport.ScrollTop;
    const viewWidth = this._viewport.Dimensions.viewWidth;
    const bufferSize = this._viewport.ScrollDirection === ScrollDirection.Up ? this.bufferSize : 0;

    let rowWidth = 0;
    let numberOfRows = 0;
    let contentHeight = 0;

    for (let i = 0; i < this.items.length; i++) {
      contentHeight += this.groupHeaderHeight;
      for (let j = 0; j < this.items[i].items.length; j++) {
        const itemWidth = this.cache.has(this.items[i].items[j][this.itemIdKey]) ? this.cache.get(this.items[i].items[j][this.itemIdKey]).width : childWidth;
        if (j !== 0 && rowWidth + itemWidth <= viewWidth) {
          rowWidth += itemWidth;
        } else {
          rowWidth = itemWidth;
          contentHeight += this._currentChildHeight;
          numberOfRows += 1;
        }

        if (contentHeight > startHeight - bufferSize) {
          return {
            rowsBeforeStartIndex: numberOfRows - 1,
            groupStartIndex: i,
            itemStartIndex: j
          };
        }
      }
      rowWidth = 0;
    }

    return {
      rowsBeforeStartIndex: 0,
      itemStartIndex: 0,
      groupStartIndex: 0
    };
  }

  private _calculateEndIndex(groupStart: number, itemStart: number, childWidth: number) {
    const viewWidth = this._viewport.Dimensions.viewWidth;
    const viewHeight = this._viewport.Dimensions.viewHeight;

    let rowWidth = 0;
    let contentHeight = 0;

    for (let i = groupStart; i < this.items.length; i++) {
      contentHeight += this.groupHeaderHeight;
      for (let j = (i == groupStart ? itemStart : 0); j < this.items[i].items.length; j++) {
        const itemWidth = this.cache.has(this.items[i].items[j][this.itemIdKey]) ? this.cache.get(this.items[i].items[j][this.itemIdKey]).width : childWidth;
        if (j !== 0 && rowWidth + itemWidth <= viewWidth) {
          rowWidth += itemWidth;
        } else {
          if (contentHeight > viewHeight + this._currentChildHeight + this.bufferSize) {
            return {
              groupEndIndex: i,
              itemEndIndex: j - 1
            };
          }

          rowWidth = itemWidth;
          contentHeight += this._currentChildHeight;
        }
      }
      rowWidth = 0;
    }

    return {
      groupEndIndex: this.items.length - 1,
      itemEndIndex: this.items[this.items.length - 1].items.length - 1
    };
  }

  private _updateRenderedContent(forceViewportUpdate: boolean = false) {
    if (!this.items || !this.items.length) {
      this._zone.run(() => this.update.emit([]));
      return;
    }
    if (!this.cache.isEmpty()) this._currentChildHeight = this.cache.getHeight();

    const childWidth = this.cache.getAverageItemWidth();
    const startData = this._calculateStartData(childWidth);
    const endData = this._calculateEndIndex(startData.groupStartIndex, startData.itemStartIndex, childWidth);

    this._viewport.setTopPadding(this.items, this.groupHeaderHeight, startData.groupStartIndex, this._currentChildHeight, startData.rowsBeforeStartIndex);
    this._viewport.updateScrollHeight(this.items, this._currentChildHeight, childWidth, this.groupHeaderHeight, this.cache);
    if (this._viewport.shouldLoadMore(1 - this.loadMoreThreshold) && this._viewport.ScrollDirection === ScrollDirection.Down) this._loadMoreThrottle.next();

    if (startData.groupStartIndex !== this._lastGroupStartIndex || startData.itemStartIndex !== this._lastItemStartIndex
      || endData.groupEndIndex !== this._lastGroupEndIndex || endData.itemEndIndex !== this._lastItemEndIndex
      || forceViewportUpdate === true) {
      this._zone.run(() => {
        let viewPortItems = this.items.slice(startData.groupStartIndex, endData.groupEndIndex + 1).map(a => Object.assign({}, a));
        viewPortItems[0].items = viewPortItems[0].items.slice(startData.itemStartIndex);
        if (viewPortItems.length === 1) viewPortItems[0].items = viewPortItems[0].items.slice(0, endData.itemEndIndex - startData.itemStartIndex + 1)
        else viewPortItems[viewPortItems.length - 1].items = viewPortItems[viewPortItems.length - 1].items.slice(0, endData.itemEndIndex + 1);
        this.update.emit(viewPortItems);

        this._lastGroupStartIndex = startData.groupStartIndex;
        this._lastItemStartIndex = startData.itemStartIndex;
        this._lastGroupEndIndex = endData.groupEndIndex;
        this._lastItemEndIndex = endData.itemEndIndex;
      });
    }
  }
}
