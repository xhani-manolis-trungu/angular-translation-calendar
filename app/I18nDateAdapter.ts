/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DateAdapter, MAT_DATE_LOCALE, MatDateFormats} from '@angular/material';
import {Inject, Optional} from '@angular/core';
import {DatePipe, FormStyle, getLocaleDayNames, getLocaleFirstDayOfWeek, getLocaleMonthNames, TranslationWidth} from '@angular/common';

const DEFAULT_DATE_NAMES = range(31, i => String(i + 1));

/**
 * Matches strings that have the form of a valid RFC 3339 string
 * (https://tools.ietf.org/html/rfc3339). Note that the string may not actually be a valid date
 * because the regex will match strings and with out of bounds month, date, etc.
 */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/;

export const I18N_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: null,
  },
  display: {
    dateInput: 'shortDate',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'longDate',
    monthYearA11yLabel: 'MMMM yyyy',
  }
};

export class I18nDateAdapter extends DateAdapter<Date> {
  private datePipe: DatePipe;

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) public matDateLocale: string) {
    super();
    super.setLocale(this.matDateLocale);
    this.datePipe = new DatePipe(matDateLocale);
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return getLocaleMonthNames(this.matDateLocale, FormStyle.Format, this.getStyle(style));
  }

  getDateNames(): string[] {
    return DEFAULT_DATE_NAMES;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return getLocaleDayNames(this.matDateLocale, FormStyle.Format, this.getStyle(style));
  }

  getYearName(date: Date): string {
    return String(this.getYear(date));
  }

  getFirstDayOfWeek(): number {
    return getLocaleFirstDayOfWeek(this.matDateLocale);
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(this._createDateWithOverflow(
      this.getYear(date), this.getMonth(date) + 1, 0));
  }

  clone(date: Date): Date {
    return this.createDate(this.getYear(date), this.getMonth(date), this.getDate(date));
  }

  createDate(year: number, month: number, date: number): Date {
    // Check for invalid month and date (except upper bound on date which we have to check after
    // creating the Date).
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }

    const result = this._createDateWithOverflow(year, month, date);

    // Check that the date wasn't above the upper bound for the month, causing the month to overflow
    if (result.getMonth() !== month) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }

    return result;
  }

  today(): Date {
    return new Date();
  }

  parse(value: any, parseFormat: any): Date | null {
    // We have no way using the native JS Date to set the parse format or locale, so we ignore these parameters.
    if (typeof value === 'number') {
      return new Date(value);
    }
    return value ? new Date(Date.parse(value)) : null;
  }

  format(date: Date, displayFormat: string): string {
    if (!this.isValid(date)) {
      throw Error('I18nDateAdapter: Cannot format invalid date.');
    }
    return this.datePipe.transform(date, displayFormat);
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = this._createDateWithOverflow(this.getYear(date), this.getMonth(date) + months, this.getDate(date));

    // It's possible to wind up in the wrong month if the original month has more days than the new
    // month. In this case we want to go to the last day of the desired month.
    // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
    // guarantee this.
    if (this.getMonth(newDate) !== ((this.getMonth(date) + months) % 12 + 12) % 12) {
      newDate = this._createDateWithOverflow(this.getYear(newDate), this.getMonth(newDate), 0);
    }

    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return this._createDateWithOverflow(this.getYear(date), this.getMonth(date), this.getDate(date) + days);
  }

  toIso8601(date: Date): string {
    return [
      date.getUTCFullYear(),
      this._2digit(date.getUTCMonth() + 1),
      this._2digit(date.getUTCDate())
    ].join('-');
  }

  fromIso8601(iso8601String: string): Date | null {
    // The `Date` constructor accepts formats other than ISO 8601, so we need to make sure the
    // string is the right format first.
    if (ISO_8601_REGEX.test(iso8601String)) {
      const d = new Date(iso8601String);
      if (this.isValid(d)) {
        return d;
      }
    }
    return null;
  }

  isDateInstance(obj: any): boolean {
    return obj instanceof Date;
  }

  isValid(date: Date): boolean {
    return !isNaN(date.getTime());
  }

  private getStyle(style: 'long' | 'short' | 'narrow'): TranslationWidth {
    switch(style) {
      case 'long':
        return TranslationWidth.Wide;
      case 'short':
        return TranslationWidth.Abbreviated;
      case 'narrow':
        return TranslationWidth.Narrow;
    }
  }

  /**
   * Pads a number to make it two digits.
   * @param n The number to pad.
   * @returns The padded number.
   */
  private _2digit(n: number) {
    return ('00' + n).slice(-2);
  }

  /** Creates a date but allows the month and date to overflow. */
  private _createDateWithOverflow(year: number, month: number, date: number) {
    const result = new Date(year, month, date);

    // We need to correct for the fact that JS native Date treats years in range [0, 99] as
    // abbreviations for 19xx.
    if (year >= 0 && year < 100) {
      result.setFullYear(this.getYear(result) - 1900);
    }
    return result;
  }
}

/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}
