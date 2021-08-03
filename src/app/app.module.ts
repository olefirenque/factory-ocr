import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {FileInputModule} from 'ng-uikit-pro-standard';
import {DragDirective} from './drag.directive';

@NgModule({
  declarations: [
    AppComponent,
    DragDirective,
  ],
  imports: [
    BrowserModule,
    FileInputModule,
    // DragDirective,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
