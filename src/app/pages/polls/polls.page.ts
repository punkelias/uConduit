import { Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import { Events, IonSlides } from '@ionic/angular';
import { Poll } from 'src/app/models/poll';
import { AuthService } from 'src/app/services/auth.service';
import { Mission } from 'src/app/models/mission';
import { PlayerMission } from 'src/app/models/playerMission';
import { User } from 'src/app/models/user';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-polls',
  templateUrl: 'polls.page.html',
  styleUrls: ['polls.page.scss']
})
export class PollsPage implements OnInit, AfterViewInit {
  @ViewChild(IonSlides) slides: IonSlides;
  polls: Poll[];
  missions: Mission[];
  player: User;

  constructor(
    public events: Events,
    private storage: Storage,
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
            this.authService.addProgress('Completer').subscribe(
              data => {
                console.log(data);
                let mission: PlayerMission;
                let mdata: any;
                mdata = data;
                mission = mdata.player_mission;

                this.authService.addPlayerMission(mission);
              },
              error => {
              },
              () => {
              }
            );
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
                    let mission: PlayerMission;
                    let mdata: any;
                    mdata = data;
                    mission = mdata.player_mission;

                    this.authService.addPlayerMission(mission);
                  },
                  error => {
                  },
                  () => {
                  }
                );
                this.authService.addProgress('Visitor 2').subscribe(
                  data => {
                    console.log(data);
                    let mission: PlayerMission;
                    let mdata: any;
                    mdata = data;
                    mission = mdata.player_mission;

                    this.authService.addPlayerMission(mission);
                  },
                  error => {
                  },
                  () => {
                  }
                );
                this.authService.addProgress('Visitor 3').subscribe(
                  data => {
                    console.log(data);
                    let mission: PlayerMission;
                    let mdata: any;
                    mdata = data;
                    mission = mdata.player_mission;

                    this.authService.addPlayerMission(mission);
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
                    let mission: PlayerMission;
                    let mdata: any;
                    mdata = data;
                    mission = mdata.player_mission;

                    this.authService.addPlayerMission(mission);
                  },
                  error => {
                  },
                  () => {
                  }
                );
                this.authService.addProgress('Visitor 3').subscribe(
                  data => {
                    console.log(data);
                    let mission: PlayerMission;
                    let mdata: any;
                    mdata = data;
                    mission = mdata.player_mission;

                    this.authService.addPlayerMission(mission);
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
                    let mission: PlayerMission;
                    let mdata: any;
                    mdata = data;
                    mission = mdata.player_mission;

                    this.authService.addPlayerMission(mission);
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
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.authService.retrievePolls();
    this.authService.retrieveMissions();
  }

  ngAfterViewInit() {
  }
}
