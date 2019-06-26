import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavController, Events, LoadingController, IonContent } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { ActionSheetController, ToastController, Platform } from '@ionic/angular';
import { File as IonicFile } from '@ionic-native/File/ngx';
import { HttpClient } from '@angular/common/http';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Storage } from '@ionic/storage';
import { map } from 'rxjs/operators';
import { Place } from 'src/app/models/place';

const STORAGE_KEY = 'my_images';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: [
    './register.page.scss'
    ],
})
export class RegisterPage implements OnInit {
  image = [];
  @ViewChild('signUpSlider') signupSlider;
  @ViewChild(IonContent) content: IonContent;
  step_one_form: FormGroup;
  step_two_form: FormGroup;
  step_three_form: FormGroup;
  genders: Array<string>;
  fileToUpload: Blob;
  countryCode = '';
  stateCode: number;
  loading;
  fileBase64;
  fileName: string;

  public submitAttempt = false;

  countries;
  states: Place[];
  cities: Place[];

  validation_messages = {
    'image': [
      { type: 'required', message: 'A Profile Image is required.' }
    ],
    'name': [
      { type: 'required', message: 'Name is required.' }
    ],
    'lastname': [
      { type: 'required', message: 'Last name is required.' }
    ],
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Please enter a valid email.' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 8 characters long.' }
    ],
    'terms': [
      { type: 'pattern', message: 'You must accept terms and conditions.' }
    ],
    'countrycode': [
      { type: 'required', message: 'Your Country is required.' }
    ],
    'postalcode': [
      { type: 'required', message: 'Your Postal Code is required.' }
    ],
  };

  constructor(
    private camera: Camera, private file: IonicFile, private http: HttpClient, private webview: WebView,
    private actionSheetController: ActionSheetController, private storage: Storage, private plt: Platform,
    public formBuilder: FormBuilder, public authService: AuthService, private navCtrl: NavController,
    private alertService: AlertService, public events: Events, public loadingController: LoadingController
  ) {
    this.events.subscribe('states:created',
      (states) => {
        this.states = states;
      },
      () => {
        console.log(this.states);
      });
      this.events.subscribe('cities:created',
        (cities) => {
          this.cities = cities;
        },
        () => {
          console.log(this.cities);
        });
  }

  ngOnInit() {
    this.readCountries();

    this.plt.ready().then(() => {
      this.loadStoredImages();
    });
    this.genders = [
      'Male',
      'Female'
    ];

    this.step_one_form = this.formBuilder.group({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(8),
        Validators.required
      ]))
    });

    this.step_two_form = this.formBuilder.group({
      image: new FormControl('', Validators.nullValidator),
      name: new FormControl('', Validators.required),
      lastname: new FormControl('', Validators.required),
      gender: new FormControl(this.genders[0], Validators.nullValidator),
      birthdate: new FormControl('', Validators.nullValidator)
    });

    this.step_three_form = this.formBuilder.group({
      countrycode: new FormControl('', Validators.required),
      stateid: new FormControl('', Validators.nullValidator),
      cityid: new FormControl('', Validators.nullValidator),
      postalcode: new FormControl('', Validators.required),
      terms: new FormControl(true, Validators.pattern('true'))
    });
  }

  ionViewDidEnter() {
  }

  readCountries() {
    if (this.countries) {
      return Promise.resolve(this.countries);
    }
    return new Promise(resolve => {
      this.http.get<any>('assets/data/countries.json').pipe(map(
          (response) => response.countries
        )).
        subscribe(
          (data) => {
            {
              console.log(data);
              this.countries = data;
              resolve(this.countries);
            }
          }
        );
    });
  }

  loadStoredImages() {
    this.storage.get(STORAGE_KEY).then(images => {
      if (images) {
        const arr = JSON.parse(images);

        for (const img of arr) {
          const filePath = this.file.dataDirectory + img;
          const resPath = this.pathForImage(filePath);
          this.image.push({ name: img, path: resPath, filePath: filePath });
        }
      }
    });
  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Choose a profile image',
      buttons: [
        {
          text: 'Load from Library',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
          }
        },
        {
          text: 'Use Camera',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('cancel');
          }
        }
      ]
    });

    actionSheet.present();
  }

  takePicture(sourceType: PictureSourceType) {
    let options: CameraOptions;

    if (sourceType === this.camera.PictureSourceType.CAMERA) {
      options = {
        quality: 100,
        targetWidth: 600,
        sourceType: this.camera.PictureSourceType.CAMERA,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE
      };
    } else {
      options = {
        quality: 100,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE
      };
    }

    this.camera.getPicture(options).then((imageData) => {
      this.fileBase64 = 'data:image/jpeg;base64,' + imageData;
      // Naming the image
      const date = new Date().valueOf();
      let text = '';
      const possibleText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 5; i++) {
        text += possibleText.charAt(Math.floor(Math.random() *    possibleText.length));
      }
      // Replace extension according to your media type
      this.fileName = date + '.' + text + '.jpeg';
      // call method that creates a blob from dataUri
      const imageBlob = this.dataURItoBlob(imageData);
      this.fileToUpload = imageBlob;
      document.getElementById('profile-pic').click();
     }, (err) => {
      // Handle error
      console.log(err);
     });
  }

  dataURItoBlob(dataURI) {
    const byteString = window.atob(dataURI);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([int8Array], { type: 'image/jpeg' });

    return blob;
 }

  onSubmit() {
    this.submitAttempt = true;

    if (!this.step_one_form.valid) {
        this.signupSlider.slideTo(0);
    } else if (!this.step_two_form.valid) {
        this.signupSlider.slideTo(1);
    }  else if (!this.step_three_form.valid) {
      this.signupSlider.slideTo(2);
    } else {
        console.log(this.step_one_form.value);
        console.log(this.step_two_form.value);
        console.log(this.step_three_form.value);
        this.register();
    }
  }

  next() {
    this.signupSlider.slideNext();
    this.content.scrollToTop(50);
  }

  prev() {
    this.signupSlider.slidePrev();
    this.content.scrollToTop(50);
  }

  register() {
    this.presentLoading();
    this.authService.register(this.fileToUpload, this.fileName, this.step_two_form.value.name, this.step_two_form.value.lastname,
      this.step_two_form.value.birthdate, this.step_two_form.value.gender, this.step_one_form.value.email,
      this.step_one_form.value.password, this.step_three_form.value.countrycode, this.step_three_form.value.stateid,
      this.step_three_form.value.cityid, this.step_three_form.value.postalcode).subscribe(
      data => {
        this.authService.login(this.step_one_form.value.email, this.step_one_form.value.password).subscribe(
          logindata => {
            this.navCtrl.navigateRoot('/dashboard');
            console.log(logindata);
          },
          (error) => {
            console.log(error);
            this.alertService.presentToast(error.error, 'error');
          },
          () => {
            this.navCtrl.navigateRoot('/dashboard');
          }
        );
        this.alertService.presentToast(data['message'], 'success');
        console.log(data);
      },
      error => {
        console.log(error);
        this.alertService.presentToast(error.error.error, 'error');
      },
      () => {
      }
    );
  }

  countrySelected() {
    this.countryCode = this.step_three_form.value.countrycode;

    if (this.countryCode && this.countryCode === 'US') {
      this.authService.retrieveStates();
    } else {
      this.states =  [];
      this.cities =  [];
    }
  }

  stateSelected() {
    this.stateCode = this.step_three_form.value.stateid;

    if (this.stateCode) {
      this.authService.retrieveCities(this.stateCode);
    } else {
      this.cities =  [];
    }
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 3000
    });

    await this.loading.present();

    const { role, data } = await this.loading.onDidDismiss();
  }

  GoBack() {
    this.navCtrl.navigateForward('/login');
  }
}
