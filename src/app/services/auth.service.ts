import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, catchError, map } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { EnvService } from './env.service';
import { User } from '../models/user';
import { Poll } from '../models/poll';
import { Events, AngularDelegate } from '@ionic/angular';
import { RedeemedPoints } from '../models/redeemedPoints';
import { Observable, of } from 'rxjs';
import { Place } from '../models/place';
import { Answer } from '../models/answer';
import { Mission } from '../models/mission';

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

          return this.token;
        }
      )
    );
  }

  register(image: File, first_name: string, last_name: string, birthdate: string, gender: string, email: string, password: string,
    country_code: string, state_id: string, city_id: string, postal_code: string
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
    console.log(image);
    if (image) {
      formData.append('image_file', image, image.name);
    }
    formData.append('country_code', country_code);
    formData.append('state_id', state_id);
    formData.append('city_id', city_id);
    formData.append('postal_code', postal_code);

    return this.http.post(this.env.API_URL + 'player/up', formData);
  }

  logout() {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });

    return this.http.get(this.env.API_URL + 'player/out', { headers: headers })
    .pipe(
      tap(data => {
        this.storage.remove('session_token');
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
              element.color_class = 'color-6';

              if (element.color === '#7BEDFF') {
                element.color_class = 'color-1';
              } else if (element.color === '#FF7B91') {
                element.color_class = 'color-2';
              } else if (element.color === '#2BE8A6') {
                element.color_class = 'color-3';
              } else if (element.color === '#FFF454') {
                element.color_class = 'color-4';
              } else if (element.color === '#A77BFF') {
                element.color_class = 'color-5';
              }

              for (const question of element.questions) {
                if (question.type === 'yesno') {
                  const answerYes = new Answer();
                  answerYes.text = 'Yes';
                  const answerNo = new Answer();
                  answerNo.text = 'No';

                  question.answers.push(answerYes);
                  question.answers.push(answerNo);
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

  saveAnswer(answers:  string, poll_id: number) {
    const headers = new HttpHeaders({
      'session-token': this.token.session_token
    });
    console.log(headers);
    console.log(answers);
    return this.http.post<any>(this.env.API_URL + 'player/poll/save/answers',
      { answers: answers, poll_id: poll_id },
      { headers: headers }
    );
  }

  retrieveStates() {
    return this.http.get<any>(this.env.API_URL + 'state/all')
    .subscribe((response) => {
        console.log(response);
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
        console.log(response);
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
        this.events.publish('missions:created', (this.missions));

        response.missions.forEach(element => {
            this.events.subscribe('mission' + element.id + ':progress',
            (missionId) => {
              this.addProgress(missionId);
            },
            () => {
              console.log(element);
            }
          );
        });
    });
  }

  addProgress(missionId: number) {
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
        }
      )
    );
  }
}
