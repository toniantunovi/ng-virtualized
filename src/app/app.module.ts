import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DemoComponent } from '../demo/demo.component';
import { ItemComponent } from '../demo/item/item.component';
import { VirtualScrollModule } from '../virtual-scroll/virtual-scroll-module';

@NgModule({
  declarations: [
    AppComponent,
    DemoComponent,
    ItemComponent
  ],
  imports: [
    BrowserModule,
    VirtualScrollModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
