import {Component, OnInit} from '@angular/core';
import {createWorker} from 'tesseract.js';
import {FileHandle} from './drag.directive';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'tesseract.js-angular-app';
  ocrResult = 'Recognizing...';
  canvas: any;
  ctx: any;
  rect: any;
  rectExtract: any;
  drag = false;
  imageObj = null;

  tryRotate = false;
  recognizeAtStart = false;

  listArr = [];

  files: FileHandle[] = [];

  constructor() {
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

  async doOCR() {
    const worker = createWorker({
      logger: m => console.log(m),
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const {data: {orientation_degrees}} = await worker.detect(this.imageObj.src);

    let result = this.imageObj.src;
    if (this.tryRotate) {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      canvas.width = Math.max(this.canvas.width, this.canvas.height);
      canvas.height = Math.max(this.canvas.width, this.canvas.height);
      const ctx = canvas.getContext('2d');
      ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      ctx.rotate(orientation_degrees * Math.PI / 180);
      ctx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.width / 2);
      console.log(orientation_degrees);
      result = canvas.toDataURL();
      this.imageObj.width = canvas.width;
      this.imageObj.height = canvas.height;
      this.imageObj.src = result;
      console.log(result);
    }
    const {data: {text}} = await worker.recognize(result);
    this.ocrResult = text;
    await worker.terminate();
  }

  // Different OCR methods are required, because they have different confidence in different cases

  // Works better, but it is harder to make rotation, because it is needed to rotate rectangles
  async doRectOCR(rectangle) {
    const worker = createWorker({
      logger: m => {
      },
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const data = await worker.recognize(this.imageObj.src, {rectangle});
    const {data: {text}} = data;
    this.listArr.push(text);
    await worker.terminate();
  }

  // Probably works slower, but it is easy to rotate an image before the crop
  async doCropOCR() {
    const worker = createWorker({
      logger: m => {
      },
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = Math.max(this.rect.w, this.rect.h);
    canvas.height = Math.max(this.rect.w, this.rect.h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.canvas, this.rect.startX, this.rect.startY, this.rect.w, this.rect.h, 0, 0, this.rect.w, this.rect.h);
    const results = [];
    for (let phi = 0; phi <= 360; phi += 90) {
      const cur = this.getRotatedImage(canvas, phi);
      const data = await worker.recognize(cur);
      const {data: {text, confidence}} = data;
      results.push({text, confidence});
    }
    console.log(results);
    const bestMatch = results.sort((x, y) => {
      return x.confidence - y.confidence;
    }).pop();

    this.listArr.push(bestMatch.text);
    await worker.terminate();
  }

  getRotatedImage(canv, orientationDegrees) {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = Math.max(canv.width, canv.height);
    canvas.height = Math.max(canv.width, canv.height);
    const ctx = canvas.getContext('2d');
    ctx.translate(canv.width / 2, canv.height / 2);
    ctx.rotate(orientationDegrees * Math.PI / 180);
    ctx.drawImage(canv, -canv.width / 2, -canv.width / 2);
    return canvas.toDataURL();
  }

  init(imageData) {
    this.imageObj = new Image();
    this.imageObj.onload = () => {
      this.canvas.setAttribute('width', this.imageObj.width);
      this.canvas.setAttribute('height', this.imageObj.height);
      this.ctx.drawImage(this.imageObj, 0, 0, this.imageObj.width, this.imageObj.height);
    };
    this.imageObj.src = imageData;
    if (this.recognizeAtStart) {
      this.doOCR();
    }
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
    const rectangles = {
      left: this.rect.startX + (this.rect.w < 0 ? this.rect.w : 0),
      top: this.rect.startY + (this.rect.h < 0 ? this.rect.h : 0),
      width: Math.abs(this.rect.w),
      height: Math.abs(this.rect.h),
    };
    this.doCropOCR().then(r => console.log('successful CROP ', r));
    this.doRectOCR(rectangles).then(r => console.log('successful RECT ', r));
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

  readFile(event) {
    const file = event.target.files[0];
    console.log(file);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      console.log(e.target.result);
      this.init(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  filesDropped(files: FileHandle[]): void {
    this.files = files;
    const file = files[0].file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.init(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  removeItem(index: number) {
    this.listArr.splice(index, 1);
  }

  chooseAnotherFile() {
    this.files.length = 0;
    this.canvas.setAttribute('width', 0);
    this.canvas.setAttribute('height', 0);
  }
}
