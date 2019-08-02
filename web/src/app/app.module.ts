import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {FormsModule} from '@angular/forms';
import {NoContentComponent} from './no-content/no-content.component';
import {BaseComponent} from './base/base.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {HttpClientModule} from '@angular/common/http';
import {LoadingSpinnerModule} from './loading-spinner/loading-spinner.module';
import {ModalModule} from 'ngx-bootstrap/modal';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {NotificationsComponent} from './notifications/notifications.component';

@NgModule({
    declarations: [
        AppComponent,
        NoContentComponent,
        BaseComponent,
        NotificationsComponent
    ],
    imports: [
        BrowserAnimationsModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        FontAwesomeModule,
        LoadingSpinnerModule,
        ModalModule.forRoot(),
        NgbToastModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
