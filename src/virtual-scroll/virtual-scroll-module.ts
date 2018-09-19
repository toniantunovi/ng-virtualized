import { NgModule } from '@angular/core';

import { VirtualScrollComponent } from './virtual-scroll';
import { VirtualScrollItemMeasurer } from './virtual-scroll-item-measurer';
import { VirtualScrollViewport } from './virtual-scroll-viewport';

@NgModule({
    exports: [VirtualScrollComponent, VirtualScrollItemMeasurer],
    declarations: [VirtualScrollComponent, VirtualScrollItemMeasurer, VirtualScrollViewport]
})
export class VirtualScrollModule { }
