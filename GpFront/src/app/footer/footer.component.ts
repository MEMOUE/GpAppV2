import { Component } from '@angular/core';
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-footer',
  standalone: true,
    imports: [
        TranslatePipe
    ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']  // Corrected property name
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();  // Pour afficher l'année en cours
}
