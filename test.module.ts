import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestComponent } from './test.component';
import { VirtualScrollModule } from './virtual-scroll/virtual-scroll-module';
import { ItemComponent } from './item/item.component';

@NgModule({
    imports: [
        CommonModule,
        VirtualScrollModule
    ],
    declarations: [TestComponent, ItemComponent],
    exports: [],
    providers: []
})
export class TestModule { }
