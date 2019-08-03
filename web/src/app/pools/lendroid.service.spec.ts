import { TestBed } from '@angular/core/testing';

import { LendroidService } from './lendroid.service';

describe('LendroidService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LendroidService = TestBed.get(LendroidService);
    expect(service).toBeTruthy();
  });
});
