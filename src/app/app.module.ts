import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

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
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
