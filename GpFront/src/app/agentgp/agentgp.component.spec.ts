import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentgpComponent } from './agentgp.component';

describe('AgentgpComponent', () => {
  let component: AgentgpComponent;
  let fixture: ComponentFixture<AgentgpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentgpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentgpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
