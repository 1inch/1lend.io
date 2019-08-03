import { TestBed } from '@angular/core/testing';

import { UniswapService } from './uniswap.service';

describe('UniswapService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UniswapService = TestBed.get(UniswapService);
    expect(service).toBeTruthy();
  });
});
