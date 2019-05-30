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
      question.answered = false;
    }
  }

  ionViewDidEnter() {
    this.player = this.authService.user();
    this.missions = this.authService.getMissions();
    const themeWrapper = document.querySelector('body');
    themeWrapper.style.setProperty('--mainColor', this.poll.color);
    themeWrapper.style.setProperty('--bgColor', this.poll.background_color);
  }

  GoBack() {
    this.navCtrl.pop();
  }

  saveAnswer (question: Question, value: string, index: number, type: string) {
    question.answered = true;
    for (const answer of question.answers) {
      if (answer.id.toString() === value) {
        answer.classname = 'chosen';
      } else {
        answer.classname = 'hide';
      }
    }

    this.openQuestions[index].value = parseInt(value, 10);

    if (this.poll.instant_feedback) {
      if (type === 'multiple') {
        this.createChartMultiple(question, this.openQuestions[index].value);
      } else {
        this.createChartScale(question, this.openQuestions[index].value, 5);
      }
    } else {
      this.advance(index);
    }

    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = value;
    this.answers.push(playerAnswer);
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
    question.answered = true;

    if (this.poll.instant_feedback) {
      this.createChart(question, value);
    }
  }

  saveOpenAnswer (question: Question, index: number, type: string) {
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

    if (type === 'range' && !question.answered && this.poll.instant_feedback) {
      this.createChartRange(question);
    } else {
      this.advance(index);
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

  updateAnswer (question: Question, value: number) {
    if (this.checkBoxAnswers.includes(value)) {
      this.checkBoxAnswers.splice(this.checkBoxAnswers.indexOf(value), 1);
    } else {
      this.checkBoxAnswers.push(value);
    }
  }

  saveCheckBoxAnswers (question: Question, index: number, type: string) {
    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = this.checkBoxAnswers.join(',');
    this.answers.push(playerAnswer);
    question.answered = true;

    if (type === 'checkbox' && this.poll.instant_feedback) {
      this.createChartCheckBox(question);
    } else {
      this.advance(index);
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
    question.answered = true;
    const playerAnswer = new PlayerAnswer();
    playerAnswer.poll_id = this.poll.id;
    playerAnswer.question_id = question.id;
    playerAnswer.value = ev.detail.value;
    this.answers.push(playerAnswer);

    if (this.poll.instant_feedback) {
      this.createChartScale(question, ev.detail.value, 10);
    } else {
      question.answered = true;
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
          console.log('entra');
          for (const answer of this.poll.questions[index].answers) {
            this.matrixAnswers.push({id: answer.id, value: 0});
            console.log(this.matrixAnswers.length);
          }
        }

        this.feedbackData = null;
      }
   });
  }

  createChart(question: Question, value: string) {
    this.feedbackData = {
      chartType: 'PieChart',
      dataTable: [
        ['Answer', 'Percent']
      ],
      options: {
      'width': 300,
      'height': 200,
      backgroundColor: 'transparent',
      fill: 'transparent',
      legend: 'labeled',
      theme: 'maximized'
      }
    };

    let totalAnswered = 0;

    if (!question.feedback) {
      question.feedback = { No: 0, Yes: 0 };
    }

    if (!question.feedback['No']) {
      question.feedback.No = 0;
    }

    if (!question.feedback['Yes']) {
      question.feedback.Yes = 0;
    }

    if (value === 'Yes') {
      question.feedback.Yes += 1;
    } else {
      question.feedback.No += 1;
    }

    totalAnswered = question.feedback.Yes + question.feedback.No;
console.log(question.feedback.Yes + ' ' + question.feedback.No + ' ' + totalAnswered);
    this.feedbackData.dataTable.push(['Yes', question.feedback.Yes / totalAnswered]);
    this.feedbackData.dataTable.push(['No', question.feedback.No / totalAnswered]);
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

    this.advance(index);
  }

  createChartMultiple (question: Question, value: number) {
    let totalAnswered = 0;

    for (const answer of question.answers) {
      if (value == answer.id) {
        answer.feedback += 1;
      }
      totalAnswered += answer.feedback;
    }

    for (const answer of question.answers) {
      answer.feedbackValue = (answer.feedback / totalAnswered) * 100;
    }
  }

  createChartCheckBox(question: Question) {
    let totalAnswered = 0;
    question.answered = true;

    for (const answer of question.answers) {
      for (const value of this.checkBoxAnswers) {
        if (value == answer.id) {
          answer.feedback += 1;
        }
      }
      totalAnswered += answer.feedback;
    }

    for (const answer of question.answers) {
      answer.feedbackValue = (answer.feedback / totalAnswered) * 100;
    }
    this.checkBoxAnswers = [];
    this.checkBoxAnswers.length = 0;
  }

  createChartScale(question: Question, value: number, limit: number) {
    let totalAnswered = 0;
    let sumAnswers = 0;
    question.answered = true;

    if (!question.feedback) {
      if (limit == 5) {
        question.feedback = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        };
      } else {
        question.feedback = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0
        };
      }
    }

    if (!question.feedback[1]) {
      question.feedback[1] = 0;
    }

    if (!question.feedback[2]) {
      question.feedback[2] = 0;
    }

    if (!question.feedback[3]) {
      question.feedback[3] = 0;
    }

    if (!question.feedback[4]) {
      question.feedback[4] = 0;
    }

    if (!question.feedback[5]) {
      question.feedback[5] = 0;
    }

    if (limit == 10) {
      if (!question.feedback[6]) {
        question.feedback[6] = 0;
      }

      if (!question.feedback[7]) {
        question.feedback[7] = 0;
      }

      if (!question.feedback[8]) {
        question.feedback[8] = 0;
      }

      if (!question.feedback[9]) {
        question.feedback[9] = 0;
      }

      if (!question.feedback[10]) {
        question.feedback[10] = 0;
      }
    }

    question.feedback[value] += 1;

    totalAnswered = question.feedback[1] + question.feedback[2] + question.feedback[3] + question.feedback[4] + question.feedback[5];
    sumAnswers = question.feedback[1] + (2 * question.feedback[2]) + (3 * question.feedback[3]) +
    (4 * question.feedback[4]) + (5 * question.feedback[5]);

    if (limit == 10) {
      totalAnswered += question.feedback[6] + question.feedback[7] + question.feedback[8] + question.feedback[9] + question.feedback[10];
      sumAnswers += (6 * question.feedback[6]) + (7 * question.feedback[7]) + (8 * question.feedback[8]) +
      (9 * question.feedback[9]) + (10 * question.feedback[10]);
    }

    question.feedbackValue = Math.round(sumAnswers / totalAnswered);
    console.log(question.feedbackValue);
  }

  advance(index: number) {
    if (index < this.poll.questions.length - 1) {
      this.slides.slideNext(1500);
    } else {
      this.sendAnswers();
    }
  }

  createChartRange(question: Question) {
    question.answered = true;
    let totalAnswered = 0;
    let sumAnswers = 0;

    for (const keys of Object.keys(question.feedback)) {
      totalAnswered += question.feedback[keys];
      sumAnswers += question.feedback[keys] * parseInt(keys, 10);
    }

    question.feedbackValue = Math.round(sumAnswers / totalAnswered);
  }
}
