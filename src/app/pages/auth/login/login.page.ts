import { Component, OnInit } from '@angular/core';
import { ModalController, NavController, LoadingController } from '@ionic/angular';
import { RegisterPage } from '../register/register.page';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private loading;
  private email = '';
  private psswd = '';

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private navCtrl: NavController,
    private alertService: AlertService,
    private storage: Storage,
    public loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.storage.get('user_email').then(
      email => {
        this.email = email;

        this.storage.get('user_psswd').then(
          password => {
            this.psswd = password;

            if (this.email && this.psswd) {
              this.loginCall(this.email, this.psswd);
            }
          },
          error => {
            this.psswd = '';
          }
        );
      },
      error => {
        this.email = '';
      }
    );
  }

  async registerModal() {
    this.navCtrl.navigateForward('register');
  }

  login(form: NgForm) {
    this.loginCall(form.value.email, form.value.password);
  }

  loginCall(email: string, password: string) {
    this.authService.login(email, password).subscribe(
      data => {
        this.presentLoading();
        this.alertService.presentToast('Logged In', 'success');
      },
      error => {
        this.presentLoading();
        if (error.error.error) {
          let errorMessage = error.error.error;
          if (errorMessage === 'password') {
            errorMessage = 'Wrong email or password';
          }
          this.alertService.presentToast(errorMessage, 'error');
          console.log(error.error.error);
        } else {
          this.alertService.presentToast('There\'s an error on Server side', 'error');
          console.log('There\'s an error on Server side');
        }
      },
      () => {
        this.navCtrl.navigateRoot('/dashboard');
      }
    );
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 3000
    });

    await this.loading.present();

    const { role, data } = await this.loading.onDidDismiss();
  }
}
