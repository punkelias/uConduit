import { Component, OnInit } from '@angular/core';
import { MenuController, Events } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  constructor(private menu: MenuController, private authService: AuthService, public events: Events, public navCtrl: NavController) {
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
  }
}
