import { TestBed } from '@angular/core/testing';

import { CompoundService } from './compound.service';

describe('CompoundService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CompoundService = TestBed.get(CompoundService);
    expect(service).toBeTruthy();
  });
});
