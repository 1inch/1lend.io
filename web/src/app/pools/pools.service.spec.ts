import { TestBed } from '@angular/core/testing';

import { PoolsService } from './pools.service';

describe('PoolsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PoolsService = TestBed.get(PoolsService);
    expect(service).toBeTruthy();
  });
});
