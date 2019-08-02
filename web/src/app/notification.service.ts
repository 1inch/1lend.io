import {Injectable, TemplateRef} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    notifications: any[] = [];

    constructor() {
    }

    show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
        this.notifications.push({textOrTpl, ...options});
    }

    remove(toast) {
        this.notifications = this.notifications.filter(t => t !== toast);
    }
}
