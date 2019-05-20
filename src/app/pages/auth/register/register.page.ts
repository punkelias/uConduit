import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ModalController, NavController, Events, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { ActionSheetController, ToastController, Platform } from '@ionic/angular';
import { File as IonicFile, FileEntry, IFile } from '@ionic-native/File/ngx';
import { HttpClient } from '@angular/common/http';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Storage } from '@ionic/storage';
import { FilePath } from '@ionic-native/file-path/ngx';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Place } from 'src/app/models/place';

const STORAGE_KEY = 'my_images';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  image = [];
  @ViewChild('signUpSlider') signupSlider;
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
    private actionSheetController: ActionSheetController, private toastController: ToastController,
    private storage: Storage, private plt: Platform, private ref: ChangeDetectorRef, private filePath: FilePath,
    public formBuilder: FormBuilder,
    private router: Router,
    private modalController: ModalController,
    private authService: AuthService,
    private navCtrl: NavController,
    private alertService: AlertService,
    public events: Events,
    public loadingController: LoadingController
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
      //this.fileToUpload = this.getSingleFile(imageData);
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
      //this.fileToUpload = new File([imageBlob], imageName, { type: 'image/jpeg' });
      console.log(this.fileToUpload);
     }, (err) => {
      // Handle error
      console.log(err);
     });

    /*this.camera.getPicture(options).then(imagePath => {
        if (this.plt.is('android') && sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {
            this.filePath.resolveNativePath(imagePath)
                .then(filePath => {
                    const correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
                    const currentName = imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.lastIndexOf('?'));
                    this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
                });
        } else {
            const currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
            const correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
            console.log(currentName);
            console.log(correctPath);
            this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
        }
    });*/
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

  /*createFileName() {
    const d = new Date(),
        n = d.getTime(),
        newFileName = n + '.jpg';
    return newFileName;
  }

  copyFileToLocalDir(namePath, currentName, newFileName) {
      this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(success => {
          this.updateStoredImages(newFileName);
      }, error => {
          console.error('Error while storing file.');
          console.error(error);
      });
  }

  updateStoredImages(name) {
      const filePath = this.file.dataDirectory + name;
      const resPath = this.pathForImage(filePath);

      const newEntry = {
          name: name,
          path: resPath,
          filePath: filePath
      };
      if (this.image[0]) {
        this.deleteImage(this.image[0], 0);
      }
      this.image = [newEntry, ...this.image];
      this.ref.detectChanges(); // trigger change detection cycle
      this.startUpload(this.image);
  }

  deleteImage(imgEntry, position) {
    this.image.splice(position, 1);

    this.storage.get(STORAGE_KEY).then(images => {
        const arr = JSON.parse(images);
        const filtered = arr.filter(name => name != imgEntry.name);
        this.storage.set(STORAGE_KEY, JSON.stringify(filtered));

        const correctPath = imgEntry.filePath.substr(0, imgEntry.filePath.lastIndexOf('/') + 1);

        this.file.removeFile(correctPath, imgEntry.name).then(res => {
            console.log('File removed.');
        });
    });
  }

  startUpload(imgEntry) {
    this.file.resolveLocalFilesystemUrl(imgEntry.filePath)
        .then(entry => {
            ( < FileEntry > entry).file(file => this.readFile(file));
        })
        .catch(err => {
            console.error('Error while reading file.');
        });
  }

  readFile(file: any) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const imgBlob = new Blob([reader.result], {
              type: file.type
          });
          this.fileToUpload.imgBlob = imgBlob;
          this.fileToUpload.fileName = file.name;
      };
      reader.readAsArrayBuffer(file);
  }*/

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
  }

  prev() {
      this.signupSlider.slidePrev();
  }

  register() {
    console.log(this.fileToUpload);
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

  async getSingleFile(filePath: string): Promise<File> {
    // Get FileEntry from image path
    const fileEntry: FileEntry = await this.file.resolveLocalFilesystemUrl(filePath) as FileEntry;

    // Get File from FileEntry. Again note that this file does not contain the actual file data yet.
    const cordovaFile: IFile = await this.convertFileEntryToCordovaFile(fileEntry);

    // Use FileReader on each object to populate it with the true file contents.
    return this.convertCordovaFileToJavascriptFile(cordovaFile);
  }

  private convertFileEntryToCordovaFile(fileEntry: FileEntry): Promise<IFile> {
    return new Promise<IFile>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    });
  }

  private convertCordovaFileToJavascriptFile(cordovaFile: IFile): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.error) {
          reject(reader.error);
        } else {
          const blob: any = new Blob([reader.result], { type: cordovaFile.type });
          blob.lastModifiedDate = new Date();
          blob.name = cordovaFile.name;
          resolve(blob as File);
        }
      };
      reader.readAsArrayBuffer(cordovaFile);
    });
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
