import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Poll } from 'src/app/models/poll';
import { PlayerAnswer } from 'src/app/models/playerAnswer';
import { Question } from 'src/app/models/question';
import { AuthService } from 'src/app/services/auth.service';
import { NavController, IonSlides } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Platform } from '@ionic/angular';
import { Mission } from 'src/app/models/mission';
import { PlayerMission } from 'src/app/models/playerMission';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
  @ViewChild(IonSlides) slides: IonSlides;
  pollId = null;
  poll: Poll;
  answers: PlayerAnswer[] = [];
  openQuestions: any[] = [];
  missions: Mission[];
  player: User;

  constructor(
    private keyboard: Keyboard,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    public navCtrl: NavController,
    public plt: Platform) {
    }

  ngOnInit() {
    this.pollId = this.activatedRoute.snapshot.paramMap.get('pollId');
    this.poll = this.authService.getPollById(this.pollId);

    for (const question of this.poll.questions) {
      this.openQuestions.push({id: question.id, value: ''});

      for (const answer of question.answers) {
        answer.classname = '';
      }
    }
  }

  ionViewDidEnter() {
    this.player = this.authService.user();
    this.missions = this.authService.getMissions();
  }

  GoBack() {
    this.navCtrl.pop();
  }

  saveAnswer (questionId: number, value: string, index: number) {
    for (const question of this.poll.questions) {
      if (question.id == questionId) {
        for (const answer of question.answers) {
          if (answer.id.toString() === value) {
            answer.classname = 'chosen';
          } else {
            answer.classname = 'hide';
          }
        }
      }
    }

    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = questionId;
    playerAnswer.value = value;
    this.answers.push(playerAnswer);

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }

  saveYesNoAnswer (questionId: number, value: string, index: number) {
    for (const question of this.poll.questions) {
      if (question.id == questionId) {
        for (const answer of question.answers) {
          if (answer.text === value) {
            answer.classname = 'chosen';
          } else {
            answer.classname = 'hide';
          }
        }
      }
    }

    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = questionId;
    playerAnswer.value = value;
    this.answers.push(playerAnswer);

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }

  saveOpenAnswer (question: Question, index: number) {
    let value = '';
    for (const openQuestion of this.openQuestions) {
      if (openQuestion.id == question.id) {
        value = openQuestion.value.toString();
      }
    }

    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = value;
    this.answers.push(playerAnswer);

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }

  sendAnswers () {
    const answersWrapper: any[] = [];
    answersWrapper.push({answers: this.answers});
    let answersJson = JSON.stringify(answersWrapper);
    answersJson = answersJson.slice(1, -1);

    this.authService.saveAnswer(JSON.stringify(this.answers), this.poll.id).subscribe(
      data => {
        console.log(data);
        let lastSharerFound: string;

        // Cash out mission
        for (const playermission of this.player.missions) {
          if (playermission.completed == 0) {
            for (const mission of this.missions) {
              if (playermission.mission_id == mission.id) {
                if (mission.name.includes('Sharer of knowledge')) {
                  lastSharerFound = mission.name;
                  this.authService.addProgress(mission.name);
                }
              }
            }
          }
        }

        if (!lastSharerFound) {
          this.authService.addProgress('Sharer of knowledge 1').subscribe(
            missiondata => {
              console.log(missiondata);
            },
            error => {
            },
            () => {
            }
          );
          this.authService.addProgress('Sharer of knowledge 2').subscribe(
            missiondata => {
              console.log(missiondata);
            },
            error => {
            },
            () => {
            }
          );
          this.authService.addProgress('Sharer of knowledge 3').subscribe(
            missiondata => {
              console.log(missiondata);
            },
            error => {
            },
            () => {
            }
          );
        } else if (lastSharerFound === 'Sharer of knowledge 1') {
          this.authService.addProgress('Sharer of knowledge 2').subscribe(
            missiondata => {
              console.log(missiondata);
            },
            error => {
            },
            () => {
            }
          );
          this.authService.addProgress('Sharer of knowledge 3').subscribe(
            missiondata => {
              console.log(missiondata);
            },
            error => {
            },
            () => {
            }
          );
        } else if (lastSharerFound === 'Sharer of knowledge 2') {
          this.authService.addProgress('Sharer of knowledge 3').subscribe(
            missiondata => {
              console.log(missiondata);
            },
            error => {
            },
            () => {
            }
          );
        }
      },
      error => {
        console.log(error);
      },
      () => {
      }
    );

    this.navCtrl.navigateRoot('/dashboard');
  }

  goBack () {
    this.slides.getActiveIndex().then(index => {
      if (index == 0) {
        this.navCtrl.navigateRoot('/dashboard');
      } else {
        this.slides.slidePrev();
      }
      });
  }

  closeKeyboard () {
    if (this.plt.is('mobile')) {
      if (this.keyboard.isVisible) {
        this.keyboard.hide();
      }
    }
  }
}
