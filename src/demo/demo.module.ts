import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VirtualScrollModule } from '../virtual-scroll/virtual-scroll-module';
import { ItemComponent } from './item/item.component';
import { DemoComponent } from './demo.component';

@NgModule({
    imports: [
        CommonModule,
        VirtualScrollModule
    ],
    declarations: [DemoComponent, ItemComponent],
    exports: [],
    providers: []
})
export class DemoModule { }
