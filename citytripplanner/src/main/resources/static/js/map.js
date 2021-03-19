mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

let addedMarkers = [];
let addedDays = [];
let currentSelectedDay = null;
let currentShownRoute = [];

let initialPoint = null;
let movedPoint = null;
let currentBounds = null;

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [27.60, 47.16],
    zoom: 12
});

let geoLocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
});

map.addControl(geoLocate);

function getTodaysDate()
{
    date = new Date();
    day = date.getDate();
    month = date.getMonth() + 1;
    year = date.getFullYear();

    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;

    today = year + "-" + month + "-" + day;

    return today;
}

document.getElementById('addDay').setAttribute('min', getTodaysDate());
document.getElementById('addDay').setAttribute('value', getTodaysDate());
document.getElementById('dayStart').setAttribute('value', new Date().toLocaleTimeString('en-US',
    {hour12: false,
            hour: "numeric",
            minute: "numeric"}));
document.getElementById('dayEnd').setAttribute('value', new Date().toLocaleTimeString('en-US',
    {hour12: false,
            hour: "numeric",
            minute: "numeric"}));

function getPOIDetails(id, name, marker)
{
    const url = `http://localhost:8080/poi/${id}`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(data => {
            let hoursHTML = ``;
            data.poiHours.sort(function(a, b) {
                return a.dayNumber - b.dayNumber;
            });

            for(const hours of data.poiHours)
            {
                hoursHTML += `
                    <div class="mt-3 bg-indigo-200 rounded-xl shadow">
                        <p class="text-center border-b-2 border-gray-400 font-bold text-gray-600">
                            ${hours.dayName ? hours.dayName : "unavailable"}
                        </p>
                        <p class="text-center font-bold text-gray-600">
                            Opening: ${hours.openingAt ? hours.openingAt : "unavailable"}
                        </p>
                        <p class="text-center font-bold text-gray-600">
                            Closing: ${hours.closingAt ? hours.closingAt : "unavailable"}
                        </p>
                    </div>`;
            }

            let html = `
                    <div class="flex flex-row items-center justify-between mb-2">
                        <p class="font-bold text-2xl text-indigo-400">
                            ${name}
                        </p>
                        <button id="poi_add_${id}"
                                class="p-1 border-green-400 border-2 text-gray-600 hover:bg-green-400 hover:text-white
                                focus:outline-none rounded-xl transition ease-out duration-600">
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    </div>
                    
                    ${data.photoPrefix ? `<img class="rounded-2xl shadow-xl" alt="POI Photo" src="${data.photoPrefix}500${data.photoSuffix}">` : ""}
                     <div class="overflow-auto no-scrollbar max-h-36">
                        <p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">
                            Phone: ${data.formattedPhone ? data.formattedPhone : "unavailable"}
                        </p>
                        <p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">
                            Rating: ${data.rating ? data.rating : "unavailable"}
                        </p>
                        <p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">
                            Type: ${data.type ? data.type : "unavailable"}
                        </p>
                        <p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">
                            Price Tier: ${data.priceTier ? data.priceTier : "unavailable"}
                        </p>
                        ${hoursHTML}
                     </div>`;

            let popUp = new mapboxgl.Popup({className: `mapbox-gl-popup-${id}`}).setHTML(html).on('open', e => {
                if(document.getElementById("tabsContainer").__x.$data.tab === 'itinerary')
                {
                    document.getElementById(`poi_add_${id}`).classList.add('hidden');
                }
                else
                {
                    document.getElementById(`poi_add_${id}`).classList.remove('hidden');
                }
            });
            marker.setPopup(popUp);
            marker.togglePopup();

            addedMarkers.find( ({poi}) => poi.id === id)['details'] = data;

            document.getElementById(`poi_add_${id}`).addEventListener('click', function() {
                addPOItoDay(id);
            });
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function addPOItoDay(id)
{
    if(currentSelectedDay && !currentSelectedDay.pois.find( ({poi}) => poi.id === id))
    {
        let el = addedMarkers.find( ({poi}) => poi.id === id);
        currentSelectedDay.pois.push(el);
        let poiHoursInfo = el.details.poiHours.find( ({dayNumber}) => dayNumber === currentSelectedDay.dayNumber);
        let openingAt = null;
        let closingAt = null;

        if(poiHoursInfo)
        {
            openingAt = poiHoursInfo.openingAt.split(':')[0] + ':' + poiHoursInfo.openingAt.split(':')[1];
            closingAt = poiHoursInfo.closingAt.split(':')[0] + ':' + poiHoursInfo.closingAt.split(':')[1];
        }

        currentSelectedDay.visitDurations.push({
            id: el.poi.id,
            visitDuration: '1:00',
            openingAt: openingAt,
            closingAt: closingAt
        });

        if('colours' in el)
        {
            el['colours'].push(currentSelectedDay.colour);
            let boxShadowString = `0 0 0 3px ${el['colours'][0]}`;

            for(let i = 1; i < el['colours'].length; i++)
            {
                boxShadowString += `, 0 0 0 ${(i + 1) * 3}px ${el['colours'][i]}`
            }

            el['marker']._element.style.boxShadow = boxShadowString;
        }
        else
        {
            el['colours'] = [currentSelectedDay.colour];
            el['marker']._element.style.boxShadow = `0 0 0 3px ${el['colours'][0]}`;
        }

        let poiContainer = document.getElementById(`poiContainer_${currentSelectedDay.id}`);
        const indexOfPoi = currentSelectedDay.pois.findIndex(function(poi) { return poi.poi.id === id});

        const div = document.createElement('div');

        div.className = 'w-full border border-gray-300 rounded-xl mt-2';
        div.id = `poi_${id}_day_${currentSelectedDay.id}`;
        div.innerHTML = `
            <div class="flex flex-row rounded-xl text-white"
                    style="background-image: url(${el['details'].photoPrefix}${500}${el['details'].photoSuffix});
                    background-position: center; background-repeat: no-repeat; background-size: cover;">
                <button type="button" class="w-full p-4 text-left focus:outline-none"
                    @click="selectedIn !== '${id}_${currentSelectedDay.id}' ? selectedIn = '${id}_${currentSelectedDay.id}' : selectedIn = null">
                    <div class="flex flex-col justify-between">
                        <p class="text-2xl font-bold leading-tight"
                            style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                            ${el['poi'].name}
                        </p>
                        <p style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                            ${openingAt} - ${closingAt}
                        </p>
                    </div>
                </button>
                <button type="button" onclick="removePOIFromDay(\`${id}\`, currentSelectedDay)"
                        class="p-7 focus:outline-none hover:bg-red-400 hover:text-white rounded-lg transition ease-out duration-600">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="relative overflow-hidden transition-all max-h-0 duration-700" id="poiInDay_${id}_${currentSelectedDay.id}"
                 x-ref="poiInDay_${id}_${currentSelectedDay.id}"
                 x-bind:style="selectedIn == '${id}_${currentSelectedDay.id}' ?
                 'max-height: ' + $refs.poiInDay_${id}_${currentSelectedDay.id}.scrollHeight + 'px' : ''">
                <div class="p-6" id="poiInDayContainer_${id}_${currentSelectedDay.id}">
                    <div class="flex items-center justify-start">
                        <label class="pr-4 font-bold tracking-tight text-gray-500" for="poiInDayVisit_${id}_${currentSelectedDay.id}">Duration:</label>
                        <input class="w-full shadow appearance-none border rounded py-2 px-2 text-grey-darker
                        focus:outline-none focus:ring" type="text" id="poiInDayVisit_${id}_${currentSelectedDay.id}"
                        name="poiInDayVisit_${id}_${currentSelectedDay.id}" pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" value="1:00"
                        @click.away="verifyDurationInput('poiInDayVisit_${id}_${currentSelectedDay.id}')"/>
                    </div>
                </div>
            </div>
        `;

        if(poiContainer.innerText === 'No locations have been added')
        {
            document.getElementById(`poiContainer_${currentSelectedDay.id}`).innerHTML = "";
            document.getElementById(`poiContainer_${currentSelectedDay.id}`).appendChild(div);
            document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).style.maxHeight =
                document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).scrollHeight + 'px';
        }
        else
        {
            document.getElementById(`poiContainer_${currentSelectedDay.id}`).appendChild(div);
            document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).style.maxHeight =
                document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).scrollHeight + 'px';
        }

        document.getElementById(`poiInDay_${id}_${currentSelectedDay.id}`).addEventListener('transitionstart', () => {
            if(document.getElementById(`poiInDay_${id}_${currentSelectedDay.id}`))
            {
                const calc = parseInt(document.getElementById(`poiContainerParent_${currentSelectedDay.id}`)
                        .style.maxHeight.replace('px','')) +
                    parseInt(document.getElementById(`poiInDay_${id}_${currentSelectedDay.id}`).style.maxHeight.replace('px',''));

                if(calc)
                    document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).style.maxHeight = calc + 'px';
            }
        });

        document.getElementById(`poiInDayVisit_${id}_${currentSelectedDay.id}`).addEventListener('input', () => {
            let input = document.getElementById(`poiInDayVisit_${id}_${currentSelectedDay.id}`);
            if(!input.validity.valid)
            {
                input.classList.remove('focus:ring-green-400');
                input.classList.add('focus:ring-red-400');

                currentSelectedDay.visitDurations.find(({id}) => id === id).visitDuration = '1:00';
            }
            else
            {
                input.classList.remove('focus:ring-red-400');
                input.classList.add('focus:ring-green-400');

                currentSelectedDay.visitDurations.find(({id}) => id === id).visitDuration = input.value;
            }
        });
    }
}

function verifyDurationInput(id)
{
    let input = document.getElementById(id);
    if(!input.validity.valid)
    {
        input.value = "1:00";
        input.classList.remove('focus:ring-red-400');
        input.classList.add('focus:ring');
    }
}

function removePOIFromDay(id, day)
{
    const poi = day.pois.find( ({poi}) => poi.id === id);
    const indexOfPoi = day.pois.findIndex(function(poi) { return poi.poi.id === id});
    const indexOfPoiDuration = day.visitDurations.findIndex(function(poi) { return poi.id === id});

    document.getElementById(`poi_${id}_day_${day.id}`).remove();

    let el = addedMarkers.find( ({poi}) => poi.id === id);
    const index = poi.colours.indexOf(day.colour);

    el['colours'].splice(index, 1);

    if(el['colours'][0])
    {
        let boxShadowString = `0 0 0 3px ${el['colours'][0]}`;

        for(let i = 1; i < el['colours'].length; i++)
        {
            boxShadowString += `, 0 0 0 ${(i + 1) * 3}px ${el['colours'][i]}`
        }

        el['marker']._element.style.boxShadow = boxShadowString;
    }
    else
    {
        el['marker']._element.style.boxShadow = '';
    }

    day.pois.splice(indexOfPoi, 1);
    day.visitDurations.splice(indexOfPoiDuration, 1);

    let poiContainer = document.getElementById(`poiContainer_${day.id}`);

    if(poiContainer.childNodes.length === 0)
    {
        poiContainer.innerText = 'No locations have been added';
    }
}

function addPOIs(lat, lng, radius)
{
    const url = `http://localhost:8080/poi?ll=${lat},${lng}&radius=${radius}`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(data => {
            for(const poi of data)
            {
                if(!addedMarkers.some(e => e.poi.id === poi.id))
                {
                    let el = document.createElement('div');
                    el.className = "block bg-indigo-400 rounded-full p-0 border-none cursor-pointer";
                    el.id = `poi_marker_${poi.id}`;
                    el.style.backgroundImage = `url(${poi.iconPrefix}` + 32 + `${poi.iconSuffix}`;
                    el.style.width = 32 + 'px';
                    el.style.height = 32 + 'px';

                    let marker = new mapboxgl.Marker(el)
                        .setLngLat([poi.lng, poi.lat])
                        .addTo(map);
                    addedMarkers.push({
                        poi,
                        marker
                    });

                    marker.getElement().addEventListener('click', function() {
                        if(marker.getPopup() == null)
                        {
                            getPOIDetails(poi.id, poi.name, marker);
                        }
                    });
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

geoLocate.on('geolocate', function(e) {
    initialPoint = [e.coords.longitude, e.coords.latitude];
});

map.on('load', function() {
    initialPoint = [map.getCenter().lng, map.getCenter().lat];

    const lat = map.getCenter().lat;
    const lng = map.getCenter().lng;
    let radiusPoint = [map.getBounds()._ne.lng, map.getBounds()._ne.lat];
    let radius = turf.distance([lng, lat], radiusPoint, {units: 'kilometers'});
    addPOIs(lat, lng, radius / 2);
});

map.on('moveend', function() {
    movedPoint = [map.getCenter().lng, map.getCenter().lat];
    let distance = turf.distance(initialPoint, movedPoint, {units: 'kilometers'});

    const lat = map.getCenter().lat;
    const lng = map.getCenter().lng;
    let radiusPoint = [map.getBounds()._ne.lng, map.getBounds()._ne.lat];
    let radius = turf.distance([lng, lat], radiusPoint, {units: 'kilometers'});

    if(map.getZoom() >= 12 && distance >= radius / 4)
    {
        console.log("Loading")
        addPOIs(lat, lng, radius / 2);
        initialPoint = movedPoint;
    }
});

function addDayElement(id, dayName, date, dayStart, dayEnd, colour) {

    const div = document.createElement('div');
    document.getElementById("createItineraryButton").classList.remove("hidden");

    div.className = 'relative m-2 border border-gray-300 rounded-xl';
    div.id = 'day_' + id
    div.innerHTML = `
        <div class="flex flex-row">
            <div style="background-color: ${colour};" class="h-auto rounded-l-2xl w-2"></div>
            <button type="button" class="w-full p-6 text-left text-gray-500 font-bold leading-tight focus:outline-none"
                @click="selected !== ${id} ? selected = ${id} : selected = null;
                selected === ${id} ? currentSelectedDay = addedDays.find( ({id}) => id === ${id}) : currentSelectedDay = null;">
                <div class="flex flex-col justify-between">
                   <p>${dayName}, ${date}</p>
                   <p>${dayStart} - ${dayEnd}</p>
                </div>
            </button>
            <button x-show="selected !== ${id}"
                onclick="removeDayElement(${id})" class="p-7 focus:outline-none hover:bg-red-400 hover:text-white rounded-xl transition ease-out duration-600">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div x-show="selected === ${id}" class="p-7 bg-green-400 text-white rounded-xl flex flex-row items-center">
                <svg class="w-6 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        </div>
        <div class="relative overflow-hidden transition-all max-h-0 duration-700" id="poiContainerParent_${id}"
             x-ref="dayContainer_${id}"
             x-bind:style="selected == ${id} ? 'max-height: ' + $refs.dayContainer_${id}.scrollHeight + 'px' : ''">
            <div class="p-6" id="poiContainer_${id}">
                No locations have been added
            </div>
        </div>
      `;

    document.getElementById('daysContainer').appendChild(div);

    if (document.getElementById('daysContainer').classList.contains("hidden"))
    {
        document.getElementById('daysContainer').classList.remove("hidden");
    }
}

function removeDayElement(id)
{
    const index = addedDays.findIndex(function(day) { return day.id === id});
    let dayRet = addedDays[index];

    for(let i = dayRet.pois.length - 1; i >= 0; i--)
    {
        removePOIFromDay(dayRet.pois[i].poi.id, dayRet);
    }

    document.getElementById('day_' + id).remove();

    if(index > -1)
        addedDays.splice(index, 1);

    if(addedDays.length <= 0)
    {
        document.getElementById("createItineraryButton").classList.add("hidden");
    }
}

function addDay()
{
    let displayDate = document.getElementById('addDay');
    let displayTimeStart = document.getElementById('dayStart');
    let displayTimeEnd = document.getElementById('dayEnd');

    let selectedDate = new Date(displayDate.value);
    let selectedTimeStart = parseInt(displayTimeStart.value.split(':')[0]) * 60 + parseInt(displayTimeStart.value.split(':')[1]);
    let selectedTimeEnd = parseInt(displayTimeEnd.value.split(':')[0]) * 60 + parseInt(displayTimeEnd.value.split(':')[1]);
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let dateFormatted = displayDate.value.split("-");

    if(displayDate.value && displayTimeStart.value && displayTimeEnd.value && selectedTimeEnd - selectedTimeStart > 0)
    {
        if(!addedDays.find( ({date}) => date === displayDate.value))
        {
            let children = document.getElementById("daysContainer").children;
            let highestId = -1;

            for (let i = 0; i < children.length; i++) {
                let child = children[i];

                if(child.id.split("_")[1] > highestId)
                {
                    highestId = child.id.split("_")[1]
                }
            }
            highestId++;

            const colour = getRandomColor();
            addedDays.push({id: highestId,
                date: displayDate.value,
                dayStart: selectedTimeStart,
                dayEnd: selectedTimeEnd,
                dayName: days[selectedDate.getDay()],
                dayNumber: selectedDate.getDay() === 0 ? 7 : selectedDate.getDay(),
                colour: colour,
                visitDurations: [],
                pois: []
            });

            addDayElement(highestId, days[selectedDate.getDay()], dateFormatted[1] + '/' + dateFormatted[2] + "/" + dateFormatted[0],
                displayTimeStart.value, displayTimeEnd.value, colour);
        }
    }
}

function getRandomColor()
{
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function data()
{
    return {
        selected: null,
        selectedIn: null
    }
}

function sendPOIByDayData()
{
    let scheduleToSend = [];

    for(let i = 0; i < addedDays.length; i++)
    {
        let pois = [];

        for(let j = 0; j < addedDays[i].pois.length; j++)
        {
            let visitTimesData = addedDays[i].visitDurations.find( ({id}) => id === addedDays[i].pois[j].poi.id);
            pois.push({
                id:  addedDays[i].pois[j].poi.id,
                lat: addedDays[i].pois[j].poi.lat,
                lng: addedDays[i].pois[j].poi.lng,
                openingAt: visitTimesData.openingAt,
                closingAt: visitTimesData.closingAt,
                visitDuration: visitTimesData.visitDuration
            });
        }

        scheduleToSend.push({
            id: addedDays[i].id,
            dayName: addedDays[i].dayName,
            dayNumber: addedDays[i].dayNumber,
            date: addedDays[i].date,
            colour: addedDays[i].colour,
            dayStart: addedDays[i].dayStart,
            dayEnd: addedDays[i].dayEnd,
            pois: pois
        });
    }

    const url = `http://localhost:8080/schedule`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleToSend)
    })
    .then(response => response.json())
    .then(data => {

        if(data.length > 0)
        {
            document.getElementById("itineraryTab").classList.remove("hidden");
            document.getElementById("tabsContainer").__x.$data.tab = 'itinerary';
            document.getElementById("itineraryContainer").innerHTML = '';

            let popUpsAddButtons = document.querySelectorAll('*[id^="poi_add_"]');

            for(let i = 0; i < popUpsAddButtons.length; i++)
            {
                popUpsAddButtons[i].classList.add("hidden");
            }

            for(let i = 0; i < data.length; i++)
            {
                if(data[i].pois !== null)
                {
                    let dayStart = data[i].pois.find( ({ord}) => ord === 0).visitTimesStart;
                    let dayEnd = data[i].pois.find( ({ord}) => ord === (data[i].pois.length - 1)).visitTimesEnd;

                    addItineraryElement(i, data[i].dayName, data[i].date, dayStart, dayEnd, data[i].colour, data[i].pois);
                }
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function addItineraryElement(id, dayName, date, dayStart, dayEnd, colour, pois) {

    const div = document.createElement('div');

    div.className = 'relative m-2 border border-gray-300 rounded-xl';
    div.id = 'dayItinerary_' + id
    div.innerHTML = `
        <div class="flex flex-row">
            <div style="background-color: ${colour};" class="h-auto rounded-l-2xl w-2"></div>
            <button type="button" class="w-full p-6 text-left text-gray-500 font-bold leading-tight focus:outline-none"
                @click="selected !== ${id} ? selected = ${id} : selected = null;
                        if(selected !== ${id}) cleanShownRoutes();" id="viewItineraryOnMapButton_${id}">
                <div class="flex flex-col justify-between">
                   <p>${dayName}, ${date}</p>
                   <p>${dayStart} - ${dayEnd}</p>
                </div>
            </button>
            <div x-show="selected === ${id}" class="p-7 bg-green-400 text-white rounded-xl flex flex-row items-center">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013
                   16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            </div>
        </div>
        <div class="relative overflow-hidden transition-all max-h-0 duration-700"
             x-ref="dayContainerItinerary_${id}"
             x-bind:style="selected == ${id} ? 'max-height: ' + $refs.dayContainerItinerary_${id}.scrollHeight + 'px' : ''">
            <div class="p-6" id="poiContainerItinerary_${id}">
            </div>
        </div>
      `;

    document.getElementById('itineraryContainer').appendChild(div);

    document.getElementById(`viewItineraryOnMapButton_${id}`).addEventListener("click", function() {
        if(currentBounds === null)
        {
            currentBounds = {
                coords: [[map.getBounds()._ne.lng, map.getBounds()._ne.lat],
                    [map.getBounds()._sw.lng, map.getBounds()._sw.lat]],
                zoom: map.getZoom()
            };
        }
       viewItineraryOnMap(pois, colour);
    });

    for(let i = 0; i < pois.length; i++)
    {
        let poi = pois.find( ({ord}) => ord === i);

        addPOIToItinerary(poi, id, pois.length);
    }
}

function addPOIToItinerary(poiInfo, dayId, poisLength)
{
    let el = addedMarkers.find( ({poi}) => poi.id === poiInfo.id);

    const div = document.createElement('div');

    div.className = 'w-full border border-gray-300 rounded-xl mt-2';
    div.id = `poi_${poiInfo.id}_day_${dayId}_itinerary`;
    div.innerHTML = `
        <div class="flex flex-row rounded-xl text-white"
                style="background-image: url(${el['details'].photoPrefix}${500}${el['details'].photoSuffix});
                background-position: center; background-repeat: no-repeat; background-size: cover;">
            <div class="w-full p-4 text-left focus:outline-none">
                <div class="flex flex-col justify-between">
                    <p class="text-2xl font-bold leading-tight"
                        style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                        ${el['poi'].name}
                    </p>
                    <p style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                        ${poiInfo.visitTimesStart} - ${poiInfo.visitTimesEnd}
                    </p>
                </div>
            </div>
        </div>
    `;

    document.getElementById(`poiContainerItinerary_${dayId}`).appendChild(div);

    if(poiInfo.ord !== poisLength - 1)
    {
        const distanceDiv = document.createElement('div');

        distanceDiv.className = 'w-full mt-5 mb-5 border-l-4 border-dotted border-gray-500 ml-5';
        distanceDiv.id = `poi_${poiInfo.id}_day_${dayId}_itineraryDistance`;
        distanceDiv.innerHTML = `
            <div class="flex flex-row text-gray-500 uppercase leading-tight">
                <div class="flex flex-row justify-end w-full mr-2">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                    </svg>
                </div>
                <div class="flex flex-row w-full mr-3">
                    ${poiInfo.timeToNextPoi} min
                </div>
            </div>
        `;

        document.getElementById(`poiContainerItinerary_${dayId}`).appendChild(distanceDiv);

        if(poiInfo.waitingTime > 0)
        {
            const waitingDiv = document.createElement('div');

            waitingDiv.className = 'w-full mt-5 mb-5';
            waitingDiv.innerHTML = `
                <div class="flex flex-row text-gray-500 uppercase leading-tight">
                    <div class="flex flex-row justify-end w-full mr-2">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="flex flex-row w-full mr-3">
                        ${poiInfo.waitingTime} min
                    </div>
                </div>
            `;

            document.getElementById(`poi_${poiInfo.id}_day_${dayId}_itineraryDistance`).appendChild(waitingDiv);
        }
    }
}

function decodePolyLine(str, precision)
{
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

    while (index < str.length)
    {

        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

function flipped(coords)
{
    var flipped = [];
    for (var i = 0; i < coords.length; i++) {
        var coord = coords[i].slice();
        flipped.push([coord[1], coord[0]]);
    }
    return flipped;
}

function viewItineraryOnMap(pois, colour)
{
    cleanShownRoutes();

    let geoJson = {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': []
        }
    };

    currentShownRoute = [];
    let allCoordinates = [];

    for(let i = 0; i < pois.length; i++)
    {
        let el = document.getElementById(`poi_marker_${pois[i].id}`);
        let styleBackgroundImage = el.style.backgroundImage;

        currentShownRoute.push({
            marker: el,
            id: pois[i].id,
            backgroundImage: styleBackgroundImage
        });

        el.style.backgroundImage = '';
        el.style.boxShadow = '';
        el.innerHTML = `
            <div class="flex flex-row justify-center font-bold text-white text-2xl rounded-full"
                 style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased; background-color: ${colour}">
                ${pois[i].ord + 1}
            </div>
        `;

        if(pois[i].polyLine !== null)
        {
            let coordinates = flipped(decodePolyLine(pois[i].polyLine, 6));
            allCoordinates.push(...coordinates);

            geoJson.data.features.push({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            });
        }
    }

    map.addSource('route', geoJson);

    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': `${colour}`,
            'line-width': 8
        }
    });

    let bounds = allCoordinates.reduce(function (bounds, coord) {
        return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));

    map.fitBounds(bounds, {
        padding: 20
    });
}

function cleanShownRoutes()
{
    if(currentShownRoute.length !== 0)
    {
        if(map.getLayer('route'))
        {
            map.removeLayer('route');
        }

        if(map.getSource('route'))
        {
            map.removeSource('route');
        }

        for(let i = 0; i < currentShownRoute.length; i++)
        {
            el = currentShownRoute[i].marker;
            el.innerHTML = '';
            el.style.backgroundImage = currentShownRoute[i].backgroundImage;
            el.style.boxShadow = currentShownRoute[i].boxShadow;

            let poi = addedMarkers.find( ({poi}) => poi.id === currentShownRoute[i].id);

            if(poi['colours'][0])
            {
                let boxShadowString = `0 0 0 3px ${poi['colours'][0]}`;

                for(let j = 1; j < poi['colours'].length; j++)
                {
                    boxShadowString += `, 0 0 0 ${(j + 1) * 3}px ${poi['colours'][j]}`
                }

                poi['marker']._element.style.boxShadow = boxShadowString;
            }
            else
            {
                poi['marker']._element.style.boxShadow = '';
            }
        }

        map.fitBounds(currentBounds.coords);
    }
}

document.getElementById("plannerTabButton").addEventListener("click", function() {
    document.getElementById("itineraryContainer").__x.$data.selected = null;
});