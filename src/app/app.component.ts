import {Component, OnInit} from '@angular/core';
import {FileHandle} from './drag.directive';
import {HttpEventType, HttpErrorResponse} from '@angular/common/http';
import {of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {UploadService} from './upload.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'OCR';
  status = 'Waiting for the selection';
  canvas: any;
  ctx: any;
  rect: any;
  rectExtract: any;
  drag = false;
  imageObj = null;

  recognizedParts = [];
  droppedFiles: FileHandle[] = [];

  constructor(private uploadService: UploadService) {
    this.imageObj = new Image();
  }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rect = {startX: 0, startY: 0, w: 0, h: 0};
    this.rectExtract = {startX: 0, startY: 0, w: 0, h: 0};
    this.drag = false;

    this.canvas.addEventListener('mousedown', this.mouseDown.bind(this), false);
    this.canvas.addEventListener('mouseup', this.mouseUp.bind(this), false);
    this.canvas.addEventListener('mousemove', this.mouseMove.bind(this), false);
  }

  async sendCroppedImage() {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = Math.max(this.rect.w, this.rect.h);
    canvas.height = Math.max(this.rect.w, this.rect.h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.canvas, this.rect.startX, this.rect.startY, this.rect.w, this.rect.h, 0, 0, this.rect.w, this.rect.h);

    this.status = 'Recognizing...';

    canvas.toBlob((blob) => {
      this.uploadFile({
        data: blob,
        inProgress: false,
        progress: 0,
      });
    });
  }

  init(imageData) {
    this.imageObj = new Image();
    this.imageObj.onload = () => {
      this.canvas.setAttribute('width', this.imageObj.width);
      this.canvas.setAttribute('height', this.imageObj.height);
      this.ctx.drawImage(this.imageObj, 0, 0, this.imageObj.width, this.imageObj.height);
    };
    this.imageObj.src = imageData;
  }

  mouseDown(e) {
    if (e.which === 1) {
      this.rect.startX = e.pageX - e.target.offsetLeft;
      this.rect.startY = e.pageY - e.target.offsetTop;
      this.drag = true;
    }
  }

  mouseUp() {
    this.drag = false;
    this.sendCroppedImage().then();
  }

  mouseMove(e) {
    if (this.drag) {
      this.ctx.clearRect(0, 0, this.imageObj.width, this.imageObj.height);
      this.ctx.drawImage(this.imageObj, 0, 0);
      this.rect.w = (e.pageX - e.target.offsetLeft) - this.rect.startX;
      this.rect.h = (e.pageY - e.target.offsetTop) - this.rect.startY;
      this.ctx.strokeStyle = 'red';
      this.ctx.strokeRect(this.rect.startX, this.rect.startY, this.rect.w, this.rect.h);
    }
  }

  filesDropped(files: FileHandle[]): void {
    this.droppedFiles = files;
    const file = files[0].file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.init(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  removeItem(index: number) {
    this.recognizedParts.splice(index, 1);
  }

  chooseAnotherFile() {
    this.droppedFiles.length = 0;
    this.canvas.setAttribute('width', 0);
    this.canvas.setAttribute('height', 0);
  }

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file.data);
    file.inProgress = true;
    return this.uploadService.upload(formData).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            file.progress = Math.round(event.loaded * 100 / event.total);
            break;
          case HttpEventType.Response:
            return event;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        file.inProgress = false;
        return of(`${file.data.name} upload failed.`);
      })).subscribe((event: any) => {
      if (typeof (event) === 'object') {

        this.status = 'Done';

        console.log(event.body);
        event.body.TextDetections.forEach((detection) => {
          if (detection.Type === 'WORD') {
            this.recognizedParts.push(detection.DetectedText);
          }
        });
      }
    });
  }
}
