import { Routes } from '@angular/router';
import { PublicComponent } from './public/public.component';
import { SecuredComponent } from './secured/secured.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'public' },
  { path: 'public', component: PublicComponent },
  { path: 'secured', component: SecuredComponent },
];
