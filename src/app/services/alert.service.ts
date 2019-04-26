import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private toastController: ToastController) { }
  async presentToast(message: any, status: string) {
    let themeColor: string;

    if (status === 'success') {
      themeColor = 'medium';
    } else {
      themeColor = 'light';
    }

    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: themeColor
    });
    toast.present();
  }
}
