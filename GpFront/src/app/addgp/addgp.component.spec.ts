import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddgpComponent } from './addgp.component';

describe('AddgpComponent', () => {
  let component: AddgpComponent;
  let fixture: ComponentFixture<AddgpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddgpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddgpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
