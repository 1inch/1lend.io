import {Component, OnInit, TemplateRef} from '@angular/core';
import {NotificationService} from '../notification.service';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss'],
    host: {'[class.ngb-toasts]': 'true'}
})
export class NotificationsComponent implements OnInit {

    constructor(public notificationService: NotificationService) {}

    ngOnInit() {
    }

    isTemplate(nnotification) { return nnotification.textOrTpl instanceof TemplateRef; }
}
