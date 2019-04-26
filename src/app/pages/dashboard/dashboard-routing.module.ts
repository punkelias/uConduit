import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './dashboard.page';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardPage,
    children:
      [
        {
          path: 'polls',
          children:
            [
              {
                path: '',
                loadChildren: '../polls/polls.module#PollsPageModule'
              },
              {
                path: 'details/:pollId',
                loadChildren: '../details/details.module#DetailsPageModule'
              }
            ]
        },
        {
          path: 'profile',
          children:
            [
              {
                path: '',
                loadChildren: '../profile/profile.module#ProfilePageModule'
              }
            ]
        },
        {
          path: '',
          redirectTo: '/dashboard/polls',
          pathMatch: 'full'
        }
      ]
  },
  {
    path: '',
    redirectTo: 'dashboard/polls',
    pathMatch: 'full'
  }
];

@NgModule({
  imports:
    [
      RouterModule.forChild(routes)
    ],
  exports:
    [
      RouterModule
    ]
})
export class DashboardPageRoutingModule {}
