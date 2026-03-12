import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
})
export class HomeComponent {
  private readonly router = inject(Router);

  startTraining(): void {
    void this.router.navigate(['teach']);
  }
}
