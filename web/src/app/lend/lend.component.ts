import {Component, OnInit} from '@angular/core';
import {faSyncAlt} from '@fortawesome/free-solid-svg-icons/faSyncAlt';

@Component({
    selector: 'app-lend',
    templateUrl: './lend.component.html',
    styleUrls: ['./lend.component.scss']
})
export class LendComponent implements OnInit {

    loading = true;
    refreshIcon = faSyncAlt;

    constructor() {
    }

    ngOnInit() {

        setTimeout(() => {

            this.loading = false;
        }, 3000);
    }

    async refresh() {

        this.loading = true;

        setTimeout(() => {

            this.loading = false;
        }, 3000);
    }
}
