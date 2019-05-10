import { Component } from '@angular/core';
import { Events, NavController } from '@ionic/angular';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { Poll } from 'src/app/models/poll';
import { RedeemedPoints } from 'src/app/models/redeemedPoints';
import { AlertService } from 'src/app/services/alert.service';
import { Mission } from 'src/app/models/mission';
import { PlayerMission } from 'src/app/models/playerMission';

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
    private navCtrl: NavController,
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

        // TODO: Check and add mission progress
    });

    this.events.subscribe('redeemedpoints:created',
      (redeemedPoints) => {
        this.redeemedHistory = redeemedPoints;
      },
      () => {
        console.log(this.redeemedHistory);
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

    this.missions = this.authService.getMissions();
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
    this.cashPointsHidden = false;
  }

  showCashPoints () {
    this.cashPointsHidden = true;
  }

  hideCashPoints () {
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
      let lastBankerFound: string;

      // Cash out mission
      for (const playermission of this.user.missions) {
        if (playermission.completed == 0) {
          for (const mission of this.missions) {
            if (playermission.mission_id == mission.id) {
              if (mission.name.includes('Banker')) {
                lastBankerFound = mission.name;
                this.authService.addProgress(mission.name);
              }
            }
          }
        }
      }

      if (!lastBankerFound) {
        this.authService.addProgress('Banker 1').subscribe(
          data => {
            console.log(data);
          },
          error => {
          },
          () => {
          }
        );
        this.authService.addProgress('Banker 2').subscribe(
          data => {
            console.log(data);
            let mission: PlayerMission;
          },
          error => {
          },
          () => {
          }
        );
        this.authService.addProgress('Banker 3').subscribe(
          data => {
            console.log(data);
          },
          error => {
          },
          () => {
          }
        );
      } else if (lastBankerFound === 'Banker 1') {
        this.authService.addProgress('Banker 2').subscribe(
          data => {
            console.log(data);
          },
          error => {
          },
          () => {
          }
        );
        this.authService.addProgress('Banker 3').subscribe(
          data => {
            console.log(data);
          },
          error => {
          },
          () => {
          }
        );
      } else if (lastBankerFound === 'Banker 2') {
        this.authService.addProgress('Banker 3').subscribe(
          data => {
            console.log(data);
          },
          error => {
          },
          () => {
          }
        );
      }
    } else {
      this.alertService.presentToast('You cannot change the selected amount of points', 'error');
    }
    this.hideCashPoints();
  }

  logOut() {
    this.authService.logout().subscribe(
      data => {
        console.log(data);
      },
      error => {
        console.log(error);
      },
      () => {
        this.navCtrl.navigateRoot('/login');
      }
    );
  }

  goToEdit() {
    this.navCtrl.navigateForward('/edit');
  }
}
