import { TestBed } from '@angular/core/testing';

import { KyberService } from './kyber.service';

describe('KyberService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KyberService = TestBed.get(KyberService);
    expect(service).toBeTruthy();
  });
});
