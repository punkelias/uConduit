import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Poll } from 'src/app/models/poll';
import { PlayerAnswer } from 'src/app/models/playerAnswer';
import { Question } from 'src/app/models/question';
import { AuthService } from 'src/app/services/auth.service';
import { NavController, IonSlides, Events } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Platform } from '@ionic/angular';
import { Mission } from 'src/app/models/mission';
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
  checkBoxAnswers: number[] = [];
  feedbackData;
  matrixAnswers: any[] = [];

  constructor(
    private keyboard: Keyboard,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    public navCtrl: NavController,
    public events: Events,
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
    const themeWrapper = document.querySelector('body');
    themeWrapper.style.setProperty('--mainColor', this.poll.color);
  }

  GoBack() {
    this.navCtrl.pop();
  }

  saveAnswer (question: Question, value: string, index: number) {
    for (const answer of question.answers) {
      if (answer.id.toString() === value) {
        answer.classname = 'chosen';
      } else {
        answer.classname = 'hide';
      }
    }

    this.openQuestions[index].value = parseInt(value, 10);

    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = value;
    this.answers.push(playerAnswer);

    if (this.poll.show_crow_answers) {
      this.createChart(question);
    }

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(3000);
    } else {
      this.sendAnswers();
    }
  }

  saveYesNoAnswer (question: Question, value: string, index: number) {
    for (const answer of question.answers) {
      if (answer.text === value) {
        answer.classname = 'chosen';
      } else {
        answer.classname = 'hide';
      }
    }

    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = value;
    this.answers.push(playerAnswer);

    if (this.poll.show_crow_answers) {
      this.createChart(question);
    }

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(3000);
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

    this.authService.saveAnswer(JSON.stringify(this.answers), this.poll.id, this.poll.points).subscribe(
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

    this.events.publish('polls:returned', (''));
    this.navCtrl.navigateRoot('/dashboard');
  }

  goBack () {
    this.slides.getActiveIndex().then(index => {
      if (index == 0) {
        this.events.publish('polls:returned', (''));
        this.navCtrl.navigateForward('/dashboard');
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

  updateAnswer (value: number) {
    if (this.checkBoxAnswers.includes(value)) {
      this.checkBoxAnswers.splice(this.checkBoxAnswers.indexOf(value), 1);
    } else {
      this.checkBoxAnswers.push(value);
    }
  }

  saveCheckBoxAnswers (question: Question, index: number) {
    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = this.checkBoxAnswers.join(',');
    this.answers.push(playerAnswer);
    this.checkBoxAnswers = [];
    this.checkBoxAnswers.length = 0;

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }

  reorderItems(ev: any, index: number) {
    const element = this.checkBoxAnswers[ev.detail.from];
    this.checkBoxAnswers.splice(ev.detail.from, 1);
    this.checkBoxAnswers.splice(ev.detail.to, 0, element);
    const answer = this.poll.questions[index].answers[ev.detail.from];
    this.poll.questions[index].answers.splice(ev.detail.from, 1);
    this.poll.questions[index].answers.splice(ev.detail.to, 0, answer);
    console.log(this.checkBoxAnswers.join(','));
    ev.detail.complete();
  }

  segmentChanged(ev: any, question: Question, index: number) {
    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = ev.detail.value;
    this.answers.push(playerAnswer);

    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }

  slideChanged() {
    this.slides.getActiveIndex().then(index => {
      if (index < this.poll.questions.length) {
        if (this.poll.questions[index].type === 'ranking') {
          for (const answer of this.poll.questions[index].answers) {
            this.checkBoxAnswers.push(answer.id);
          }
        }

        if (this.poll.questions[index].type === 'matrix') {
          for (const answer of this.poll.questions[index].answers) {
            this.matrixAnswers.push({id: answer.id, value: 0});
          }
        }
      }
   });
  }

  createChart(question: Question) {
    this.feedbackData = {
      chartType: 'PieChart',
      dataTable: [
        ['Answer', 'Percent']
      ],
      options: {
      'width': 400,
      'height': 300
      }
    };

    for (const answer of question.answers) {
      this.feedbackData.dataTable.push([answer.text, answer.feedback]);
    }
  }

  updateMatrixAnswers (index: number, value: number) {
    this.matrixAnswers[index].value = value;
  }

  saveMatrixAnswers (question: Question, index: number) {
    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = JSON.stringify(this.matrixAnswers);
    this.answers.push(playerAnswer);
    this.matrixAnswers = [];
    this.matrixAnswers.length = 0;
    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }
}
