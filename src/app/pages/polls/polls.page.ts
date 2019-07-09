import { Component, OnInit, ViewChild} from '@angular/core';
import { Events, IonSlides, NavController } from '@ionic/angular';
import { Poll } from 'src/app/models/poll';
import { AuthService } from 'src/app/services/auth.service';
import { Mission } from 'src/app/models/mission';
import { User } from 'src/app/models/user';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-polls',
  templateUrl: 'polls.page.html',
  styleUrls: ['polls.page.scss']
})
export class PollsPage implements OnInit {
  slideOpts = {
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 15
  };

  @ViewChild(IonSlides) slides: IonSlides;
  polls: Poll[];
  missions: Mission[];
  player: User;

  constructor(
    public events: Events,
    private storage: Storage,
    public navCtrl: NavController,
    private authService: AuthService
    ) {
      this.events.subscribe('polls:created',
      (polls) => {
        this.polls = polls;
      },
      () => {
        console.log(this.polls);
      });

      this.events.subscribe('missions:created',
        (missions) => {
          this.missions = missions;
        },
        () => {
          console.log(this.missions);

          if (this.authService.checkUserInfo()) {
            // Complete profile mission
            this.authService.addProgress('Completer');
          }

          // Consecutive logins mission
          this.player = this.authService.user();
          this.storage.get('consecutive_logins').then(
            (val) => {
              let lastVisitorFound: string;

              for (const playermission of this.player.missions) {
                if (playermission.completed == 0) {
                  for (const mission of this.missions) {
                    if (playermission.mission_id == mission.id) {
                      if (mission.name.includes('Visitor')) {
                        lastVisitorFound = mission.name;
                        if (playermission.progress < val && mission.steps >= val) {
                          this.authService.addProgress(mission.name);
                        }
                      }
                    }
                  }
                }
              }

              if (!lastVisitorFound) {
                this.authService.addProgress('Visitor 1').subscribe(
                  data => {
                    console.log(data);
                  },
                  error => {
                  },
                  () => {
                  }
                );
                this.authService.addProgress('Visitor 2').subscribe(
                  data => {
                    console.log(data);
                  },
                  error => {
                  },
                  () => {
                  }
                );
                this.authService.addProgress('Visitor 3').subscribe(
                  data => {
                    console.log(data);
                  },
                  error => {
                  },
                  () => {
                  }
                );
              } else if (lastVisitorFound === 'Visitor 1') {
                this.authService.addProgress('Visitor 2').subscribe(
                  data => {
                    console.log(data);
                  },
                  error => {
                  },
                  () => {
                  }
                );
                this.authService.addProgress('Visitor 3').subscribe(
                  data => {
                    console.log(data);
                  },
                  error => {
                  },
                  () => {
                  }
                );
              } else if (lastVisitorFound === 'Visitor 2') {
                this.authService.addProgress('Visitor 3').subscribe(
                  data => {
                    console.log(data);
                  },
                  error => {
                  },
                  () => {
                  }
                );
              }
            }).catch((error) => {
              console.log(error);
          });
      });

      this.events.subscribe('polls:returned',
      (message) => {
        this.onEnter();
      },
      () => {
        console.log(this.polls);
      });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.authService.retrievePolls();
    this.authService.retrieveMissions();
  }

  onEnter() {
    this.authService.retrievePolls();
    this.authService.retrieveMissions();
  }

  showDetails (id: number) {
    this.navCtrl.navigateForward('/details/' + id);
  }
}
