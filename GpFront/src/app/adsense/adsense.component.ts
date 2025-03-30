import {AfterViewInit, Component} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-adsense',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adsense.component.html',
  styleUrl: './adsense.component.css'
})
export class AdsenseComponent implements AfterViewInit {

  ngAfterViewInit() {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.error("Erreur de chargement de Google AdSense", e);
    }
  }
}
