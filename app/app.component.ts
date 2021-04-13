import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatDatepicker} from '@angular/material';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  date = new Date('2017-11-07');
  @ViewChild('datePicker') datePicker: MatDatepicker<Date>;

  ngAfterViewInit() {
    setTimeout(() => {
      //this.datePicker.open();
    });
  }
}
