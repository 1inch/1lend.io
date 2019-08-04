import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LendComponent} from './lend.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CollapseModule, TooltipModule} from 'ngx-bootstrap';
import {LendRoutingModule} from './lend-routing.module';
import {LoadingSpinnerModule} from '../loading-spinner/loading-spinner.module';

@NgModule({
    declarations: [LendComponent],
    imports: [
        CommonModule,
        FontAwesomeModule,
        FormsModule,
        LendRoutingModule,
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        TooltipModule.forRoot(),
        CollapseModule.forRoot(),
        LoadingSpinnerModule,
    ]
})
export class LendModule {
}