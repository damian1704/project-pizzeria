import {select, templates, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element){
    const thisBooking = this;
    
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    
  }

  getData(){
    const thisBooking = this;
    
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,

      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])    
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];        
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    
    thisBooking.booked = {};

    for(let item of bookings){     
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }    

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }  

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat === 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }  
    } 

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] === 'undefined'){
      thisBooking.booked[date] = {};
    }
    
    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
     
      if(typeof thisBooking.booked[date][hourBlock] === 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  checkAllAvailable(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] === 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined'
    ){
      allAvailable = true;
    }

    return allAvailable;
  }

  updateDOM(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !thisBooking.checkAllAvailable()
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove(classNames.booking.selected);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(wrapper){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = wrapper;
    
    thisBooking.dom.wrapper.appendChild(utils.createDOMFromHTML(generatedHTML));
    
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    
  }

  initWidgets(){
    const thisBooking = this;
    
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    for(let table of thisBooking.dom.tables){
      table.addEventListener('click', function(){
        thisBooking.selectTable(table);
      });
    }
    
    thisBooking.dom.wrapper.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  clearSelected(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      table.classList.remove(classNames.booking.selected);
    }  
    thisBooking.selectedTableId = '';
  }

  selectTable(table){
    const thisBooking = this;
    
    thisBooking.clearSelected();

    let tableId = table.getAttribute(settings.booking.tableIdAttribute);

    if(!isNaN(tableId)){
      tableId = parseInt(tableId);
    }

    if(thisBooking.checkAllAvailable() || !thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)){ 
      table.classList.toggle(classNames.booking.selected);
      thisBooking.selectedTableId = tableId;
      console.log('thisBooking.selectedTableId', thisBooking);
    } 
  }


  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.date,
      hour: thisBooking.hourPicker.correctValue,
      table: thisBooking.selectedTableId,
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      starters: [],
    };

    for(let starter of thisBooking.dom.starters){
      console.log(starter.checked);
      if(starter.checked){
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
        alert('Zapisano');
      });

    thisBooking.makeBooked(thisBooking.date, thisBooking.hourPicker.correctValue, thisBooking.hoursAmount.correctValue, thisBooking.selectedTableId);  
    thisBooking.clearSelected();
    thisBooking.updateDOM();
  }
}

export default Booking;
    