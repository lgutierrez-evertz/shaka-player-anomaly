import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShakaPlayerComponent } from './shaka-player/shaka-player';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShakaPlayerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'shakaPlayerAnomaly';
}
