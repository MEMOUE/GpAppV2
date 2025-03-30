import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddbesoinComponent } from './addbesoin.component';

describe('AddbesoinComponent', () => {
  let component: AddbesoinComponent;
  let fixture: ComponentFixture<AddbesoinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddbesoinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddbesoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
