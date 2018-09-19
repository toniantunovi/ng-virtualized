import { Component } from '@angular/core';
import { VirtualScrollGroup, VirtualScrollItem } from './virtual-scroll/virtual-scroll';
import { VirtualScrollCache } from './virtual-scroll/virtual-scroll-cache';

class TestItem implements VirtualScrollItem {
    width: number;
    id: string;
    color: string;
}

class TestGroup implements VirtualScrollGroup {
    items: TestItem[];
    id: number;
}

@Component({
    moduleId: module.id,
    selector: 'app-test',
    templateUrl: 'test.component.html',
    styleUrls: ['./test.component.scss']
})
export class TestComponent {
    readonly NUM_ITEMS = 100;
    readonly NUM_GROUPS = 100;
    private readonly MIN_WIDTH = 150;
    private readonly MAX_WIDTH = 600;
    groups: TestGroup[] = [];
    viewPortGroups: TestGroup[] = [];
    virtualScrollCache = new VirtualScrollCache(this.MIN_WIDTH);

    constructor() {
        this.groups = [];
        for (let i = 0; i < this.NUM_GROUPS; i++) {
            this.groups.push({ items: [], id: i });
            for (let j = 0; j < this.NUM_ITEMS; j++) {
                this.groups[i].items.push({ id: i + '-' + j, width: this.randomIntFromInterval(this.MIN_WIDTH, this.MAX_WIDTH), color: this.getRandomColor() });
            }
        }
    }

    groupTrackByFn(index: number, item: TestGroup) {
        return item.id;
    }

    itemTrackByFn(index: number, item: TestItem) {
        return item.id;
    }

    private randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}
