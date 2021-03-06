import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-test-item',
    templateUrl: 'item.component.html',
    styleUrls: ['./item.component.scss']
})
export class ItemComponent {
    @Input() width: number;
    @Input() color: string;
    @Input() index: number;
}
