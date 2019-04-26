import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DashboardPage } from './dashboard.page';
import { PollsPage } from '../polls/polls.page';
import { ProfilePage } from '../profile/profile.page';
import { PollsPageModule } from '../polls/polls.module';
import { ProfilePageModule } from '../profile/profile.module';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
