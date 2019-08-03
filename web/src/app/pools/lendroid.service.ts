import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';

@Injectable({
    providedIn: 'root'
})
export class LendroidService implements PoolInterface {

    constructor() {
    }
}
