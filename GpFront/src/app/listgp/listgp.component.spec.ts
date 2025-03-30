import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListgpComponent } from './listgp.component';

describe('ListgpComponent', () => {
  let component: ListgpComponent;
  let fixture: ComponentFixture<ListgpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListgpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListgpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
