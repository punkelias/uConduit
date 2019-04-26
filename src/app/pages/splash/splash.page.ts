import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

  constructor(public viewCtrl: NavController, private splashScreen: SplashScreen, private navCtrl: NavController) {
  }

  ngOnInit() {
  }

  ionViewDidEnter() {

    this.splashScreen.hide();

    setTimeout(() => {
        this.navCtrl.navigateRoot('/dashboard');
    }, 16000);

  }

}
