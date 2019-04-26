import { DateAgoPipe } from './../../pipes/date-ago.pipe';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollsPage } from './polls.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: PollsPage }])
  ],
  declarations: [PollsPage, DateAgoPipe]
})
export class PollsPageModule {}
