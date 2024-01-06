function processDate(date){
  return {
    month: date.getMonth(), 
    date: date.getDate(),
    year: date.getFullYear(),
  }
}

function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}${month}${year}`;
}

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(formatDateDDMMYYYY(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}


function mapEventObject(event){
  const startDate = event.start.dateTime 
    ? processDate(new Date(event.start.dateTime))
    : processDate(new Date(`${event.start.date}T00:00:00`))
  const endDate = event.end.dateTime 
    ? processDate(new Date(event.end.dateTime))
    : processDate(new Date(`${event.end.date}T00:00:00`))
  
  const allDatesBetween = getDatesInRange(new Date(startDate.year, startDate.month, startDate.date),
    new Date(endDate.year, endDate.month, endDate.date));
  
  return {
    allDatesBetween: allDatesBetween,
  }
}

async function loadEvents(max = 8) {
  try {
    const endpoint = await fetch(`./.netlify/functions/calfetch?maxResults=${max}`);
    const data = await endpoint.json();
    const processedEvents = data.map(e => mapEventObject(e));
    const blocked = processedEvents.reduce((allDates, event) => {
      return allDates.concat(event.allDatesBetween);
    }, []);
    return blocked;
  } catch (e) {
    console.log(e);
    throw e; // Re-throw the error to handle it outside this function if needed
  }
}



const date_picker_element = document.querySelector('.date-picker');
const selected_date_element = document.querySelector('.date-picker .selected-date');
const dates_element = document.querySelector('.date-picker .dates');
const mth_element = document.querySelector('.date-picker .dates .month .mth');
const next_mth_element = document.querySelector('.date-picker .dates .month .next-mth');
const prev_mth_element = document.querySelector('.date-picker .dates .month .prev-mth');
const days_element = document.querySelector('.date-picker .dates .days');
const select_button = document.getElementById('select');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let date = new Date();
let day = date.getDate();
let month = date.getMonth();
let year = date.getFullYear();

let selectedDate = date;
let selectedDay = day;
let selectedMonth = month;
let selectedYear = year;

mth_element.textContent = months[month] + ' ' + year;

selected_date_element.textContent = formatDate(date);
selected_date_element.dataset.value = selectedDate;

populateDates();


// EVENT LISTENERS
date_picker_element.addEventListener('click', toggleDatePicker);
next_mth_element.addEventListener('click', goToNextMonth);
prev_mth_element.addEventListener('click', goToPrevMonth);
select_button.addEventListener('click', dateSelected);

// FUNCTIONS
function dateSelected (e) {
    dates_element.classList.toggle('active');
}

function toggleDatePicker (e) {
	if (!checkEventPathForClass(e.composedPath(), 'dates')) {
		dates_element.classList.toggle('active');
	}
}

function goToNextMonth (e) {
	month++;
	if (month > 11) {
		month = 0;
		year++;
	}
	mth_element.textContent = months[month] + ' ' + year;
	populateDates();
}

function goToPrevMonth (e) {
	month--;
	if (month < 0) {
		month = 11;
		year--;
	}
	mth_element.textContent = months[month] + ' ' + year;
	populateDates();
}

function populateDates (e) {
	days_element.innerHTML = '';
	let amount_days = 31;

	if (month == 1) {
		amount_days = 28;
	}

  loadEvents().then(blockedDates => {
    for (let i = 0; i < amount_days; i++) {
      const day_element = document.createElement('div');
      day_element.classList.add('day');
      day_element.textContent = i + 1;
      const formattedDate = `${(i + 1).toString().padStart(2, '0')}${(month + 1).toString().padStart(2, '0')}${year}`;

      if (blockedDates.includes(formattedDate)) {
          day_element.classList.add('blocked');
      }

      if (selectedDay == (i + 1) && selectedYear == year && selectedMonth == month) {
        day_element.classList.add('selected');
      }

      day_element.addEventListener('click', function () {
        selectedDate = new Date(year + '-' + (month + 1) + '-' + (i + 1));
        selectedDay = (i + 1);
        selectedMonth = month;
        selectedYear = year;

        selected_date_element.textContent = formatDate(selectedDate);
        selected_date_element.dataset.value = selectedDate;

        populateDates();
      });

      days_element.appendChild(day_element);
    }
  }
  );
}

// HELPER FUNCTIONS
function checkEventPathForClass (path, selector) {
	for (let i = 0; i < path.length; i++) {
		if (path[i].classList && path[i].classList.contains(selector)) {
			return true;
		}
	}
	
	return false;
}

function formatDate (d) {
	let day = d.getDate();
	if (day < 10) {
		day = '0' + day;
	}

	let month = d.getMonth() + 1;
	if (month < 10) {
		month = '0' + month;
	}

	let year = d.getFullYear();

	return day + ' / ' + month + ' / ' + year;
}