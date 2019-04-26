import { Component } from '@angular/core';
import { Events } from '@ionic/angular';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { Poll } from 'src/app/models/poll';
import { RedeemedPoints } from 'src/app/models/redeemedPoints';
import { AlertService } from 'src/app/services/alert.service';
import { Mission } from 'src/app/models/mission';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss']
})
export class ProfilePage {
  user: User;
  completedPolls: Poll[];
  pollsHistoryHidden = false;
  pointsHistoryHidden = false;
  redeemedHistory: RedeemedPoints[];
  cashPointsHidden = false;
  selectedPoints = 0;
  missions: Mission[];

  constructor(
    public events: Events,
    private alertService: AlertService,
    private authService: AuthService
    ) {
    this.events.subscribe('player:created',
      (player) => {
        this.user = player;
      },
      () => {
        console.log(this.user);
      }
    );

    this.events.subscribe('completedpolls:created',
      (polls) => {
        this.completedPolls = polls;
      },
      () => {
        console.log(this.completedPolls);
      });

      this.events.subscribe('redeemedpoints:created',
      (redeemedPoints) => {
        this.redeemedHistory = redeemedPoints;
      },
      () => {
        console.log(this.redeemedHistory);
      });

      this.events.subscribe('missions:created',
      (missions) => {
        this.missions = missions;
      },
      () => {
        console.log(this.missions);
      });
  }

  ionViewDidEnter() {
    this.pollsHistoryHidden = false;
    this.pointsHistoryHidden = false;
    this.cashPointsHidden = false;

    this.user = this.authService.user();
    console.log(this.user);
    this.authService.retrieveCompletedPolls();

    this.authService.retrieveRedeemHistory();

    this.authService.retrieveMissions();
  }

  showPollsHistory () {
    this.pollsHistoryHidden = true;
  }

  hidePollsHistory () {
    this.pollsHistoryHidden = false;
  }

  showPointsHistory () {
    this.pointsHistoryHidden = true;
  }

  hidePointsHistory () {
    this.pointsHistoryHidden = false;
  }

  showCashPoints () {
    this.cashPointsHidden = true;
  }

  hideCashPoints () {
    this.cashPointsHidden = false;
    this.hidePointsHistory();
  }

  cashOut() {
    console.log(this.selectedPoints);
    console.log(this.user.points);
    const pointsLeft = this.user.points - this.selectedPoints;
    if (this.selectedPoints > 0 && pointsLeft > 0) {
      this.authService.cashPoints(this.selectedPoints);
      this.alertService.presentToast('Your points are in the process of being cash out', 'success');

      this.user.points -= this.selectedPoints;
    } else {
      this.alertService.presentToast('You cannot change the selected amount of points', 'error');
    }
    this.hideCashPoints();
  }
}
