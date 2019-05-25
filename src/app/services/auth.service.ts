import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, map } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { EnvService } from './env.service';
import { User } from '../models/user';
import { Poll } from '../models/poll';
import { Events } from '@ionic/angular';
import { RedeemedPoints } from '../models/redeemedPoints';
import { Place } from '../models/place';
import { Answer } from '../models/answer';
import { Mission } from '../models/mission';
import { PlayerMission } from '../models/playerMission';
import { elementEnd } from '@angular/core/src/render3';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  isLoggedIn = false;
  private token: any = {
    session_token: ''
  };

  private player: User;
  private polls: Poll[];
  private completedPolls: Poll[];
  private redeemedPoints: RedeemedPoints[];
  private states: Place[];
  private cities: Place[];
  private missions: Mission[];

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private env: EnvService,
    public events: Events
  ) { }

  login(email: String, password: String) {
    return this.http.post<any>(this.env.API_URL + 'player/in',
      {email: email, password: password}
    ).pipe(
      map(
        data => {
          this.player = data.player;
          this.token.session_token = this.player.session_token;
          this.isLoggedIn = true;
          if (this.player.icon_path) {
            this.player.icon_path = this.env.API_URL + this.player.icon_path;
          }

          this.events.publish('player:created', (this.player));
          console.log(this.player);
          this.storage.set('session_token', this.token.session_token)
          .then(
            () => {
              console.log('Token Stored');
            },
            error => console.error('Error storing token', error)
          );

          this.storage.set('user_email', email)
          .then(
            () => {
              console.log('Email Stored');
            },
            error => console.error('Error storing email', error)
          );

          this.storage.set('user_psswd', password)
          .then(
            () => {
              console.log('Item Stored');
            },
            error => console.error('Error storing item', error)
          );

          const today = new Date();
          const consecutive = 1;

          this.storage.get('last_login').then(
            (lastLogin) => {
              const oneDay = 24 * 60 * 60 * 100;
              const lastLoginDate = new Date(lastLogin);
              today.setHours(0, 0, 0);
              lastLoginDate.setHours(0, 0, 0);

              const diffDates = Math.ceil(Math.abs(today.getTime() - lastLoginDate.getTime()) / (oneDay));

              this.storage.get('consecutive_logins').then(
                (val) => {
                  if (diffDates > 2) {
                    this.storage.set('consecutive_logins', consecutive);
                  } else if (diffDates == 2) {
                    val += 1;
                    this.storage.set('consecutive_logins', val);
                  } else if (val == 0) {
                    this.storage.set('consecutive_logins', consecutive);
                  }
                }).catch((error) => {
                  this.storage.set('consecutive_logins', consecutive);
              });

              this.storage.set('last_login', today);
          }).catch((error) => {
            this.storage.set('last_login', today);
            this.storage.set('consecutive_logins', consecutive);
          });

          this.storage.set('last_login', today)
          .then(
            () => {
              console.log('Date Stored');
            },
            error => console.error('Error storing date', error)
          );

          return this.token;
        }
      )
    );
  }

  register(image: Blob, image_name: string, first_name: string, last_name: string, birthdate: string, gender: string,
    email: string, password: string, country_code: string, state_id: string, city_id: string, postal_code: string
    ) {
    if (gender === 'Male') {
      gender = 'm';
    } else {
      gender = 'f';
    }

    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    formData.append('birthdate', birthdate);
    formData.append('gender', gender);
    formData.append('email', email);
    formData.append('password', password);
    if (image) {
      formData.append('image_file', image, image_name);
    }
    formData.append('country_code', country_code);
    if (state_id) {
      formData.append('state_id', state_id);
    }
    if (city_id) {
      formData.append('city_id', city_id);
    }
    formData.append('postal_code', postal_code);

    return this.http.post(this.env.API_URL + 'player/up', formData);
  }

  logout() {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });

    return this.http.post(this.env.API_URL + 'player/out', {}, { headers: headers })
    .pipe(
      tap(data => {
        this.storage.remove('session_token');
        this.storage.remove('user_email');
        this.storage.remove('user_psswd');
        this.isLoggedIn = false;
        delete this.token;
        return data;
      })
    );
  }

  user() {
    return this.player;
  }

  getToken() {
    return this.storage.get('session_token').then(
      data => {
        this.token.session_token = data;

        if (this.token != null) {
          this.isLoggedIn = true;
        } else {
          this.isLoggedIn = false;
        }
      },
      error => {
        this.token = null;
        this.isLoggedIn = false;
      }
    );
  }

  retrievePolls() {
    this.storage.get('session_token').then(
      (tokenResult) => {
        this.token.session_token = tokenResult;

        const headers = new HttpHeaders({
          'session-token': tokenResult
        });

        return this.http.get<any>(this.env.API_URL + 'player/poll/all?per_page=20&page=1',
        { headers: headers })
        .subscribe((response) => {
            response.polls.forEach(element => {
              element.cover = this.env.API_URL + element.cover_path;

              if (!element.background_color) {
                element.background_color = element.color;
              }

              for (const question of element.questions) {
                if (question.type === 'yesno') {
                  if (question.answers instanceof Array) {
                  const answerYes = new Answer();
                  answerYes.text = 'Yes';
                  const answerNo = new Answer();
                  answerNo.text = 'No';

                  question.answers.push(answerYes);
                  question.answers.push(answerNo);
                  }
                }
              }
            });
            console.log(response);
            this.polls = response.polls;
            this.events.publish('polls:created', (this.polls));
        });
    });
  }

  retrieveCompletedPolls() {
    this.storage.get('session_token').then(
      (tokenResult) => {
        this.token.session_token = tokenResult;

        const headers = new HttpHeaders({
          'session-token': tokenResult
        });

        return this.http.get<any>(this.env.API_URL + 'player/poll/completed?per_page=100&page=1',
        { headers: headers })
        .subscribe((response) => {
            console.log(response);
            this.completedPolls = response.polls;
            this.events.publish('completedpolls:created', (this.completedPolls));
        });
    });
  }

  getPolls () {
    return this.polls;
  }

  getCompletedPolls () {
    return this.completedPolls;
  }

  retrieveRedeemHistory() {
    this.storage.get('session_token').then(
      (tokenResult) => {
        this.token.session_token = tokenResult;

        const headers = new HttpHeaders({
          'session-token': tokenResult
        });

        return this.http.get<any>(this.env.API_URL + 'player/redeem/history?per_page=100&page=1',
        { headers: headers })
        .subscribe((response) => {
            console.log(response);
            this.redeemedPoints = response.redeem_history;
            this.events.publish('redeemedpoints:created', (this.redeemedPoints));
        });
    });
  }

  getRedeemHistory() {
    return this.redeemedPoints;
  }

  getPollById(pollId: number) {
    for (const poll of this.polls) {
      if (poll.id == pollId) {
        return poll;
      }
    }

    return null;
  }

  saveAnswer(answers:  string, poll_id: number, points: number) {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });

    return this.http.post<any>(this.env.API_URL + 'player/poll/save/answers',
      { answers: answers, poll_id: poll_id },
      { headers: headers }
    ).pipe(
      map(
        data => {
         console.log(data);
         this.player.points = parseInt(this.player.points.toString(), 10) + parseInt(points.toString(), 10);
        }
      )
    );
  }

  retrieveStates() {
    return this.http.get<any>(this.env.API_URL + 'state/all')
    .subscribe((response) => {
        this.states = response.states;
        this.events.publish('states:created', (this.states));
    });
  }

  getStates() {
    return this.states;
  }

  retrieveCities(stateCode: number) {
    return this.http.get<any>(this.env.API_URL + 'state/' + stateCode +  '/cities')
    .subscribe((response) => {
        this.cities = response.cities;
        this.events.publish('cities:created', (this.cities));
    });
  }

  getCities() {
    return this.cities;
  }

  cashPoints(points: number) {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });

    return this.http.post<any>(this.env.API_URL + 'player/redeem',
      { points_spent: points },
      { headers: headers }
    ).pipe(
      map(
        data => {
         console.log(data);
        }
      )
    );
  }

  retrieveMissions() {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });

    return this.http.get<any>(this.env.API_URL + 'mission/all', {headers: headers})
    .subscribe((response) => {
        console.log(response);
        this.missions = response.missions;

        for (const playerMission of this.player.missions) {
          if (playerMission.completed == 1) {
            for (const mission of this.missions) {
              if (playerMission.mission_id == mission.id) {
                if (mission.name === 'Completer') {
                  this.player.visitorLevel = 1;
                } else if (mission.name.includes('Banker')) {
                  const nameArray = mission.name.split(' ');
                  this.player.bankerLevel = parseInt(nameArray[nameArray.length - 1], 10);
                } else if (mission.name.includes('Sharer')) {
                  const nameArray = mission.name.split(' ');
                  this.player.sharerLevel = parseInt(nameArray[nameArray.length - 1], 10);
                } else if (mission.name.includes('Visitor')) {
                  const nameArray = mission.name.split(' ');
                  this.player.visitorLevel = parseInt(nameArray[nameArray.length - 1], 10);
                }
              }
            }
          }
        }
        this.events.publish('missions:created', (this.missions));
    });
  }

  getMissions() {
    return this.missions;
  }

  addProgress(missionName: string) {
    let missionId = 0;
    let userCompleted = false;

    if (this.missions) {
      for (const mission of this.missions) {
        if (mission.name === missionName) {
          missionId = mission.id;
        }
      }
    }

    if (this.player.missions) {
      for (const playerMissions of this.player.missions) {
        if (playerMissions.mission_id == missionId) {
          if (playerMissions.completed == 1) {
            userCompleted = true;
          }
        }
      }
    }

    if (missionId > 0 && !userCompleted) {
      const headers = new HttpHeaders({
        'session-token': this.token.session_token
      });

      return this.http.post<any>(this.env.API_URL + 'player/mission/add_progress',
        { mission_id: missionId },
        { headers: headers }
      ).pipe(
        map(
          data => {
            console.log(data);
            let playerMission: PlayerMission;
            playerMission = data.player_mission;

            let found = false;
            for (let playerM of this.player.missions) {
              if (playerM.mission_id == playerMission.mission_id) {
                found = true;
                playerM = playerMission;
              }
            }

            if (!found) {
              this.player.missions.push(playerMission);
            }
            this.events.publish('player:updated', (this.player));
          }
        )
      );
    }
  }

  checkUserInfo () {
    return (this.player.last_name && this.player.first_name && this.player.birthdate && this.player.email &&
      this.player.gender && this.player.icon_path && this.player.country_code && this.player.postal_code);
  }

  edit(image: Blob, image_name: string, first_name: string, last_name: string, birthdate: string, gender: string,
    email: string, password: string, country_code: string, state_id: string, city_id: string, postal_code: string
    ) {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });
    if (gender === 'Male') {
      gender = 'm';
    } else {
      gender = 'f';
    }

    if (!first_name) {
      first_name = this.player.first_name;
    }

    if (!last_name) {
      last_name = this.player.last_name;
    }

    if (!birthdate) {
      birthdate = this.player.birthdate;
    }

    if (!gender) {
      gender = this.player.gender;
    }

    if (!email) {
      email = this.player.email;
    }

    if (!country_code) {
      country_code = this.player.country_code;
    }

    if (!state_id) {
      state_id = this.player.state_id.toString();
    }

    if (!city_id) {
      city_id = this.player.city_id.toString();
    }

    if (!postal_code) {
      postal_code = this.player.postal_code;
    }

    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    formData.append('birthdate', birthdate);
    formData.append('gender', gender);
    formData.append('email', email);
    if (password) {
      formData.append('password', password);
    }
    if (image) {
      formData.append('image_file', image, image_name);
    }
    formData.append('country_code', country_code);
    formData.append('state_id', state_id);
    formData.append('city_id', city_id);
    formData.append('postal_code', postal_code);

    return this.http.post<any>(this.env.API_URL + 'player/profile/update', formData, { headers: headers })
    .pipe(
      map(
        data => {
          console.log(data);
          this.player = data.player;
          this.events.publish('player:updated', (this.player));
        }
      )
    );
  }
}
