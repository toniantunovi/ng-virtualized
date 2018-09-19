import { Component, Input, ElementRef, AfterViewInit } from '@angular/core';

import { VirtualScrollCache } from './virtual-scroll-cache';

@Component({
    selector: 'virtual-scroll-item-measurer',
    template: `
    <ng-content></ng-content>
    `,
    styles: [`
        :host {
            float: left;
            height: auto;
        }
    `]
})
export class VirtualScrollItemMeasurer implements AfterViewInit {
    @Input() key: any;
    @Input() cache: VirtualScrollCache;

    constructor(private _el: ElementRef) { }

    ngAfterViewInit() {
        this._measureSize();
    }

    private _measureSize() {
        if (this.cache.has(this.key)) return;
        requestAnimationFrame(() => {
            const width = this._el.nativeElement.offsetWidth;
            const height = this._el.nativeElement.offsetHeight;
            this.cache.set(this.key, { width: width, height: height });
        });
    }
}
