import {select, templates} from '../settings.js';
import {AmountWidget} from './AmountWidget.js';
import {DatePicker} from './DatePicker.js';
import {HourPicker} from './HourPicker.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;
    
    thisBooking.render(element);
    thisBooking.initWidgets();
    
  }

  render(element) {
    const thisBooking = this;

    /* generate HTML based on templates.bookingWidget without giving it a of the argument */
    const generatedHTML = templates.bookingWidget;

    /* create an empty thisBooking.dom object */
    thisBooking.dom = {};

    /* write to this object the wrapper property equal to the argument received */
    thisBooking.dom.wrapper = element;

    /* convert the contents of the wrapper into the HTML code generated from the template */
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    /* in the thisBooking.dom.peopleAmount property, save a single element found in the wrapper and matching the select.booking.peopleAmount selector */
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);

    /* analogously to peopleAmount find and save an item for hoursAmount */
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

  }
}

    