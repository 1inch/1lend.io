import { TestBed } from '@angular/core/testing';

import { EthlendService } from './ethlend.service';

describe('EthlendService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EthlendService = TestBed.get(EthlendService);
    expect(service).toBeTruthy();
  });
});
