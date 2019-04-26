import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PollsPage } from './polls.page';

describe('PollsPage', () => {
  let component: PollsPage;
  let fixture: ComponentFixture<PollsPage>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [PollsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PollsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
