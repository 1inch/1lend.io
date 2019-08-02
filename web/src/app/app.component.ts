import {ApplicationRef, Component, OnInit} from '@angular/core';
import {Web3Service} from './web3.service';
import {ConfigurationService} from './configuration.service';
import {ThemeService} from './theme.service';
import {SwUpdate} from '@angular/service-worker';
import {first} from 'rxjs/operators';
import {concat, interval} from 'rxjs';
import {environment} from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    constructor(
        web3Service: Web3Service,
        configurationService: ConfigurationService,
        themeService: ThemeService,
        swUpdate: SwUpdate,
        appRef: ApplicationRef
    ) {

        if ('serviceWorker' in navigator && environment.production) {

            swUpdate.available.subscribe(event => {

                console.log('current version is', event.current);
                console.log('available version is', event.available);

                swUpdate.activateUpdate().then(() => document.location.reload());
            });

            swUpdate.activated.subscribe(event => {
                console.log('old version was', event.previous);
                console.log('new version is', event.current);
            });

            const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
            const everySixHours$ = interval(6 * 60 * 60 * 1000);
            const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

            everySixHoursOnceAppIsStable$.subscribe(() => swUpdate.checkForUpdate());

            swUpdate.checkForUpdate();
        }
    }

    ngOnInit(): void {

    }
}
