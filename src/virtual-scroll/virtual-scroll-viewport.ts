import { Component, ContentChild, ElementRef, ViewChild, OnInit, Renderer2, OnDestroy, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { VirtualScrollGroup } from './virtual-scroll';
import { VirtualScrollCache } from './virtual-scroll-cache';

export interface ViewportDimensions {
  viewHeight: number;
  viewWidth: number;
  scrollbarWidth: number;
  scrollbarHeight: number;
}

export enum ScrollDirection {
  Up,
  Down
}

@Component({
  selector: 'virtual-scroll-viewport',
  template: `
      <div class="total-padding" #shim></div>
      <div class="scrollable-content" #content>
        <ng-content></ng-content>
      </div>
    `,
  styles: [`
        :host {
            overflow-y: auto;
            position: relative;
            display: block;
            height: inherit;
            background-color: inherit;
            -webkit-overflow-scrolling: touch;
        }
        .scrollable-content {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            position: absolute;
        }
        .total-padding {
            width: 1px;
            opacity: 0;
        }
    `]
})
export class VirtualScrollViewport implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('content', { read: ElementRef })
  contentElementRef: ElementRef;

  @ViewChild('shim', { read: ElementRef })
  shimElementRef: ElementRef;

  @ContentChild('container')
  containerElementRef: ElementRef;

  @Input()
  itemIdKey: string = 'id';

  private _dimensions: ViewportDimensions;

  private _lastTopPadding: number = 0;

  private _lastScrollHeight: number = 0;

  private _lastScrollTop: number = 0;

  private _componentDestroyed$ = new Subject<void>();

  private _scrollEvent = new EventEmitter<any>();

  private _scrollDirection = ScrollDirection.Down;

  constructor(private readonly _element: ElementRef, private readonly _renderer: Renderer2) { }

  get ScrollTop() {
    return Math.max(0, this._element.nativeElement.scrollTop - this._getElementsOffset());
  }

  get Dimensions() {
    return this._dimensions;
  }

  get ScrollDirection() {
    return this._scrollDirection;
  }

  ngOnInit() {
    this.refresh();
  }

  ngAfterViewInit() {
    fromEvent(this._element.nativeElement, 'scroll').pipe(takeUntil(this._componentDestroyed$)).subscribe(this._handleScroll.bind(this));
  }

  ngOnDestroy() {
    this._componentDestroyed$.next();
    this._componentDestroyed$.complete();
  }

  onScroll() {
    return this._scrollEvent;
  }

  onResize() {
    return fromEvent(window, 'resize');
  }

  refresh(scrollToTop?: boolean) {
    if (scrollToTop) this._element.nativeElement.scrollTop = 0;
    this._calculateDimensions();
  }

  shouldLoadMore(threshold) {
    return this._element.nativeElement.scrollTop / this._lastScrollHeight > threshold;
  }

  updateScrollHeight(items: VirtualScrollGroup[], childHeight: number, childWidth: number, groupHeaderHeight: number, cache: VirtualScrollCache) {
    const scrollHeight = this._calculateScrollHeight(items, childHeight, this.Dimensions.viewWidth, childWidth, groupHeaderHeight, cache);

    if (scrollHeight !== this._lastScrollHeight) {
      this._renderer.setStyle(this.shimElementRef.nativeElement, 'height', `${scrollHeight}px`);
      this._lastScrollHeight = scrollHeight;
    }
  }

  setTopPadding(items: VirtualScrollGroup[], groupHeaderHeight: number, numGroups: number, childHeight: number, numRows) {
    const topPadding = (items == null || items.length === 0) ? 0 : (groupHeaderHeight * numGroups + childHeight * numRows);
    if (topPadding !== this._lastTopPadding) {
      this._renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `translateY(${topPadding}px)`);
      this._renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `translateY(${topPadding}px)`);
      this._lastTopPadding = topPadding;
    }
  }

  private _handleScroll(event: any) {
    this._scrollDirection = (this._element.nativeElement.scrollTop - this._lastScrollTop > 0) ? ScrollDirection.Down : ScrollDirection.Up;
    this._lastScrollTop = this._element.nativeElement.scrollTop;
    this._scrollEvent.emit(event);
  }

  private _calculateDimensions() {
    const scrollbarWidth = this._element.nativeElement.offsetWidth - this._element.nativeElement.clientWidth
    const scrollbarHeight = this._element.nativeElement.offsetHeight - this._element.nativeElement.clientHeight;

    this._dimensions = {
      viewHeight: this._element.nativeElement.clientHeight - scrollbarHeight,
      viewWidth: this._element.nativeElement.clientWidth - scrollbarWidth,
      scrollbarHeight: scrollbarHeight,
      scrollbarWidth: scrollbarWidth
    }
  }

  private _calculateScrollHeight(items: VirtualScrollGroup[], childHeight: number, viewWidth: number, childWidth: number, groupHeaderHeight: number, cache: VirtualScrollCache) {
    let scrollHeight = 0;
    let rowWidth = 0;
    for (let i = 0; i < items.length; i++) {
      scrollHeight += groupHeaderHeight;

      for (let j = 0; j < items[i].items.length; j++) {
        const itemWidth = cache.has(items[i].items[j][this.itemIdKey]) ? cache.get(items[i].items[j][this.itemIdKey]).width : childWidth;
        if (j !== 0 && rowWidth + itemWidth <= viewWidth) {
          rowWidth += itemWidth;
        } else {
          scrollHeight += childHeight;
          rowWidth = itemWidth;
        }
      }
      rowWidth = 0;
    }

    if (rowWidth !== 0) {
      scrollHeight += childHeight;
    }

    return scrollHeight;
  }

  private _getElementsOffset(): number {
    let offsetTop = 0;
    if (this.containerElementRef && this.containerElementRef.nativeElement) {
      offsetTop += this.containerElementRef.nativeElement.offsetTop;
    }
    return offsetTop;
  }
}
