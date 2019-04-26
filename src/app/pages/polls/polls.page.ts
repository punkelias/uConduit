import { Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import { Events, IonSlides } from '@ionic/angular';
import { Poll } from 'src/app/models/poll';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-polls',
  templateUrl: 'polls.page.html',
  styleUrls: ['polls.page.scss']
})
export class PollsPage implements OnInit, AfterViewInit {
  @ViewChild(IonSlides) slides: IonSlides;
  polls: Poll[];

  constructor(
    public events: Events,
    private authService: AuthService
    ) {
      this.events.subscribe('polls:created',
      (polls) => {
        this.polls = polls;
      },
      () => {
        console.log(this.polls);
      });
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.authService.retrievePolls();
  }

  ngAfterViewInit() {
  }
}
