import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccueilAgentGpComponent } from './accueil-agent-gp.component';

describe('AccueilAgentGpComponent', () => {
  let component: AccueilAgentGpComponent;
  let fixture: ComponentFixture<AccueilAgentGpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccueilAgentGpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccueilAgentGpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
