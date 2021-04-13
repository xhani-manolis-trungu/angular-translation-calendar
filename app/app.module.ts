import { NgModule, LOCALE_ID } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MatDatepickerModule,
  MatFormFieldModule,
  MatNativeDateModule
} from "@angular/material";

import { AppComponent } from "./app.component";
import { HelloComponent } from "./hello.component";

import { I18N_DATE_FORMATS, I18nDateAdapter } from "./I18nDateAdapter";

import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import localeGr from "@angular/common/locales/el";
registerLocaleData(localeGr);

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  declarations: [AppComponent, HelloComponent],
  providers: [
    { provide: LOCALE_ID, useValue: "el" },
    { provide: DateAdapter, useClass: I18nDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: I18N_DATE_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
