import { Routes } from '@angular/router';
import {AccueilComponent} from './accueil/accueil.component';
import {AccueilAgentGpComponent} from './accueil-agent-gp/accueil-agent-gp.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {UserComponent} from './user/user.component';
import { MenuComponent } from './menu/menu.component';
import { AddgpComponent } from './addgp/addgp.component';
import { ListgpComponent } from './listgp/listgp.component';
import { AddbesoinComponent } from './addbesoin/addbesoin.component';
import { FactureComponent } from './facture/facture.component';
import { PubliciteComponent } from './publicite/publicite.component';
import { HistoriqueComponent } from './historique/historique.component';
import { PartenariatComponent } from './partenariat/partenariat.component';
import { Footer } from 'primeng/api';
import { FooterComponent } from './footer/footer.component';
import {AgentgpComponent} from './agentgp/agentgp.component';
import {AdminGuard} from './guards/admin.guard';
import {ResetPasswordComponent} from './reset-password/reset-password.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';
import {VerifyComponent} from './verify/verify.component';
import {NotificationComponent} from './notification/notification.component';

export const routes: Routes = [

  {path: '', component: AccueilComponent},
  {path: 'accueilgp', component: AccueilAgentGpComponent, canActivate: [AdminGuard]},
  {path: 'login', component: LoginComponent},
  {path:'register', component: RegisterComponent},
  {path: 'user', component: UserComponent},
  {path:'menu', component: MenuComponent},
  {path: 'addgp', component: AddgpComponent},
  {path: 'listgp', component: ListgpComponent},
  {path: 'besoingp', component: AddbesoinComponent},
  {path:'facture', component: FactureComponent},
  {path:'publicite', component: PubliciteComponent},
  {path: 'historique',component: HistoriqueComponent},
  {path: 'partenariat',component: PartenariatComponent},
  {path: 'footer',component: FooterComponent},
  {path: 'agencegp', component: AgentgpComponent},
  { path: 'edit/:id', component: AddgpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify', component: VerifyComponent },
  {path: 'notification', component: NotificationComponent}
];
