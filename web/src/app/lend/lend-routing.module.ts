import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LendComponent} from './lend.component';

const routes: Routes = [
    {
        path: '',
        component: LendComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        FormsModule,
    ],
    exports: [RouterModule]
})
export class LendRoutingModule {
}
