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
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;

    let today = year + "-" + month + "-" + day;

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

function getPOIDetails(id, marker)
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

            addPoiDetails(data, marker);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function addPoiDetails(data, marker)
{
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
                ${data.name}
            </p>
            <button id="poi_add_${data.id}"
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

    let popUp = new mapboxgl.Popup({className: `mapbox-gl-popup-${data.id}`}).setHTML(html).on('open', e => {
        if(document.getElementById("tabsContainer").__x.$data.tab === 'itinerary')
        {
            document.getElementById(`poi_add_${data.id}`).classList.add('hidden');
        }
        else
        {
            document.getElementById(`poi_add_${data.id}`).classList.remove('hidden');
        }
    });

    marker.setPopup(popUp);
    marker.togglePopup();

    addedMarkers.find( ({poi}) => poi.id === data.id)['details'] = data;

    document.getElementById(`poi_add_${data.id}`).addEventListener('click', function() {
        addPOItoDay(data.id, null, null, '1:00');
    });
}

function addPOItoDay(id, dayId, accommodation, visitDuration)
{
    let day = currentSelectedDay;
    if(dayId !== null)
    {
        day = addedDays.find( ({id}) => id === dayId);
    }

    if(day && !day.pois.find( ({poi}) => poi.id === id))
    {
        if(dayId === null)
        {
            addLoadingNotSaved();
        }

        let el = addedMarkers.find( ({poi}) => poi.id === id);

        day.pois.push(el);
        let poiHoursInfo = el.details.poiHours.find( ({dayNumber}) => dayNumber === day.dayNumber);
        let openingAt = null;
        let closingAt = null;

        if(poiHoursInfo)
        {
            openingAt = poiHoursInfo.openingAt.split(':')[0] + ':' + poiHoursInfo.openingAt.split(':')[1];
            closingAt = poiHoursInfo.closingAt.split(':')[0] + ':' + poiHoursInfo.closingAt.split(':')[1];
        }

        day.visitDurations.push({
            id: el.poi.id,
            visitDuration: visitDuration,
            openingAt: openingAt,
            closingAt: closingAt
        });

        if('colours' in el)
        {
            el['colours'].push(day.colour);
            let boxShadowString = `0 0 0 3px ${el['colours'][0]}`;

            for(let i = 1; i < el['colours'].length; i++)
            {
                boxShadowString += `, 0 0 0 ${(i + 1) * 3}px ${el['colours'][i]}`
            }

            el['marker']._element.style.boxShadow = boxShadowString;
        }
        else
        {
            el['colours'] = [day.colour];
            el['marker']._element.style.boxShadow = `0 0 0 3px ${el['colours'][0]}`;
        }

        let poiContainer = document.getElementById(`poiContainer_${day.id}`);
        const indexOfPoi = day.pois.findIndex(function(poi) { return poi.poi.id === id});

        const div = document.createElement('div');

        div.className = 'relative border border-gray-300 rounded-xl mt-2';
        div.id = `poi_${id}_day_${day.id}`;
        div.innerHTML = `
            <div class="flex flex-row rounded-xl text-white break-all overflow-hidden"
                    style="background-image: url(${el['details'].photoPrefix}${500}${el['details'].photoSuffix});
                    background-position: center; background-repeat: no-repeat; background-size: cover;">
                <button type="button" class="w-full p-4 text-left focus:outline-none"
                    @click="selectedIn !== '${id}_${day.id}' ? selectedIn = '${id}_${day.id}' : selectedIn = null">
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
                <button type="button" x-show="'${el.details.type}' === 'Hotel'" id="poiInDayAccommodation_${id}_${day.id}"
                        :class="{'active bg-green-400' : accommodation === '${id}'}"
                        class="p-7 focus:outline-none hover:bg-green-400 hover:text-white rounded-lg transition ease-out duration-600"
                        @click="if(accommodation === '${id}') {accommodation = null;} else {accommodation = '${id}';}
                                verifyAccommodation('${id}', ${day.id}, accommodation);">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1
                       1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </button>
                <button type="button" onclick="removePOIFromDay(\`${id}\`, ${day.id})" @click="if(accommodation === '${id}') {accommodation = null;}"
                        class="p-7 focus:outline-none hover:bg-red-400 hover:text-white rounded-lg transition ease-out duration-600">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="relative overflow-hidden transition-all max-h-0 duration-700" id="poiInDay_${id}_${day.id}"
                 x-ref="poiInDay_${id}_${day.id}"
                 x-bind:style="selectedIn == '${id}_${day.id}' ?
                 'max-height: ' + $refs.poiInDay_${id}_${day.id}.scrollHeight + 'px' : ''">
                <div class="p-6" id="poiInDayContainer_${id}_${day.id}">
                    <div class="flex items-center justify-start">
                        <label class="pr-4 font-bold tracking-tight text-gray-500" for="poiInDayVisit_${id}_${day.id}">Duration:</label>
                        <input class="w-full shadow appearance-none border rounded py-2 px-2 text-grey-darker
                        focus:outline-none focus:ring" type="text" id="poiInDayVisit_${id}_${day.id}"
                        name="poiInDayVisit_${id}_${day.id}" pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" value="${visitDuration}"
                        @click.away="verifyDurationInput('poiInDayVisit_${id}_${day.id}')"/>
                    </div>
                </div>
            </div>
        `;

        if(poiContainer.childNodes.length === 1 && poiContainer.childNodes[0].nodeType === Node.TEXT_NODE)
        {
            document.getElementById(`poiContainer_${day.id}`).innerHTML = "";
            document.getElementById(`poiContainer_${day.id}`).appendChild(div);
            document.getElementById(`poiContainerParent_${day.id}`).style.maxHeight =
                document.getElementById(`poiContainerParent_${day.id}`).scrollHeight + 'px';
        }
        else
        {
            document.getElementById(`poiContainer_${day.id}`).appendChild(div);
            document.getElementById(`poiContainerParent_${day.id}`).style.maxHeight =
                document.getElementById(`poiContainerParent_${day.id}`).scrollHeight + 'px';
        }

        document.getElementById(`poiInDay_${id}_${day.id}`).addEventListener('transitionstart', () => {
            if(document.getElementById(`poiInDay_${id}_${day.id}`))
            {
                const calc = parseInt(document.getElementById(`poiContainerParent_${day.id}`)
                        .style.maxHeight.replace('px','')) +
                    parseInt(document.getElementById(`poiInDay_${id}_${day.id}`).style.maxHeight.replace('px',''));

                if(calc)
                    document.getElementById(`poiContainerParent_${day.id}`).style.maxHeight = calc + 'px';
            }
        });

        addInputDurationRegex(id, day);

        if(accommodation !== null && accommodation === id)
        {
            let input = document.getElementById(`poiInDay_${id}_${dayId}`);
            input.innerHTML = '';
        }
    }
}

function verifyAccommodation(id, dayId, accommodation)
{
    addLoadingNotSaved();

    let input = document.getElementById(`poiInDay_${id}_${dayId}`);

    if(accommodation === null)
    {
        input.innerHTML = `
            <div class="p-6" id="poiInDayContainer_${id}_${dayId}">
                <div class="flex items-center justify-start">
                    <label class="pr-4 font-bold tracking-tight text-gray-500" for="poiInDayVisit_${id}_${dayId}">Duration:</label>
                    <input class="w-full shadow appearance-none border rounded py-2 px-2 text-grey-darker
                    focus:outline-none focus:ring" type="text" id="poiInDayVisit_${id}_${dayId}"
                    name="poiInDayVisit_${id}_${dayId}" pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" value="1:00"
                    @click.away="verifyDurationInput('poiInDayVisit_${id}_${dayId}')"/>
                </div>
            </div>
        `;

        let day = addedDays.find( ({id}) => id === dayId);

        addInputDurationRegex(id, day);
    }
    else
    {
        input.innerHTML = '';
    }
}

function addInputDurationRegex(poiId, day)
{
    document.getElementById(`poiInDayVisit_${poiId}_${day.id}`).addEventListener('input', () => {
        addLoadingNotSaved();

        let input = document.getElementById(`poiInDayVisit_${poiId}_${day.id}`);

        if(!input.validity.valid)
        {
            input.classList.remove('focus:ring-green-400');
            input.classList.add('focus:ring-red-400');

            day.visitDurations.find(({id}) => id === poiId).visitDuration = '1:00';
        }
        else
        {
            input.classList.remove('focus:ring-red-400');
            input.classList.add('focus:ring-green-400');

            day.visitDurations.find(({id}) => id === poiId).visitDuration = input.value;
        }
    });
}

function verifyDurationInput(id)
{
    let input = document.getElementById(id);
    if(!input.validity.valid)
    {
        addLoadingNotSaved();

        input.value = "1:00";
        input.classList.remove('focus:ring-red-400');
        input.classList.add('focus:ring');
    }
}

function removePOIFromDay(id, dayId)
{
    addLoadingNotSaved();

    let day = addedDays.find( ({id}) => id === dayId);

    const poi = day.pois.find( ({poi}) => poi.id === id);
    const indexOfPoi = day.pois.findIndex(function(poi) { return poi.poi.id === id});
    const indexOfPoiDuration = day.visitDurations.findIndex(function(poi) { return poi.id === id});

    document.getElementById(`poi_${id}_day_${day.id}`).remove();

    let el = addedMarkers.find( ({poi}) => poi.id === id);
    const index = poi.colours.indexOf(day.colour);

    el['colours'].splice(index, 1);

    recalculateColours(el);

    day.pois.splice(indexOfPoi, 1);
    day.visitDurations.splice(indexOfPoiDuration, 1);

    let poiContainer = document.getElementById(`poiContainer_${day.id}`);

    if(poiContainer.childNodes.length === 0)
    {
        poiContainer.innerText = 'No locations have been added';
    }

    document.getElementById(`poiContainerParent_${day.id}`).style.maxHeight =
        document.getElementById(`poiContainerParent_${day.id}`).scrollHeight  + 'px';
}

function recalculateColours(el)
{
    if(('colours' in el) && el['colours'][0])
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
                addPoiMarker(poi);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function addPoiMarker(poi)
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

        let toAdd = {
            poi: poi,
            marker: marker
        }

        if('type' in poi)
        {
            toAdd['details'] = poi;
        }

        addedMarkers.push(toAdd);

        marker.getElement().addEventListener('click', function() {
            if(marker.getPopup() == null)
            {
                getPOIDetails(poi.id, marker);
            }
        });
    }
    else
    {
        let el = addedMarkers.find( ({poi}) => poi.id === poi.id);

        if( ('type' in poi) && !('details' in el))
        {
            el['details'] = poi;
        }
    }
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
        addPOIs(lat, lng, radius / 2);
        initialPoint = movedPoint;
    }
});

function addDayElement(id, dayName, date, dayStart, dayEnd, colour, accommodation)
{
    const div = document.createElement('div');
    document.getElementById("createItineraryButton").classList.remove("hidden");

    div.className = 'relative m-2 border border-gray-300 rounded-xl';
    div.id = 'day_' + id
    div.innerHTML = `
        <div class="flex flex-row">
            <div style="background-color: ${colour};" class="h-auto rounded-l-3xl w-2"></div>
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
            <div class="p-6" id="poiContainer_${id}" x-data="{accommodation: ${accommodation === null ? null : "'" + accommodation + "'"}, selectedIn: null}">
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
    addLoadingNotSaved();

    const index = addedDays.findIndex(function(day) { return day.id === id});
    let dayRet = addedDays[index];

    for(let i = dayRet.pois.length - 1; i >= 0; i--)
    {
        removePOIFromDay(dayRet.pois[i].poi.id, dayRet.id);
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
                displayTimeStart.value, displayTimeEnd.value, colour, null);
            addLoadingNotSaved();
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

function sendPOIByDayData()
{
    addLoading();

    let scheduleToSend = getScheduleToSend();

    const url = `http://localhost:8080/planner/solve/restricted`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleToSend)
    })
    .then(response => response.json())
    .then(data => {

        addLoadingSaved();
        constructItinerary(data, true);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function constructItinerary(data, switchTab)
{
    document.getElementById("itineraryTab").classList.remove("hidden");
    document.getElementById("itineraryContainer").innerHTML = '';

    if(data.routes.length > 0)
    {
        addShareButtons(data.id);

        for(let i = 0; i < data.routes.length; i++)
        {
            if(data.routes[i].pois !== null && data.routes[i].pois.length > 0)
            {
                let dateFormatted = data.routes[i].date.split("-");
                let dayStart = data.routes[i].pois.find( ({ord}) => ord === 0).visitTimesStart;
                let dayEnd = data.routes[i].pois.find( ({ord}) => ord === (data.routes[i].pois.length - 1)).visitTimesEnd;

                if(data.routes[i].accommodation !== null)
                {
                    dayStart = data.routes[i].pois.find( ({ord}) => ord === 0).visitTimesStart;
                    dayEnd = data.routes[i].pois.find( ({ord}) => ord === 0).visitTimesEnd;
                }

                addItineraryElement(i, data.routes[i].dayName, dateFormatted[1] + '/' + dateFormatted[2] + '/' + dateFormatted[0],
                    dayStart, dayEnd, data.routes[i].colour, data.routes[i].pois, data.routes[i].accommodation);
            }
        }
    }
    else
    {
        let div = document.createElement('div');

        div.className = 'm-2 mb-4 flex flex-col border rounded-xl';
        div.id = 'itineraryNoSolutions';
        div.innerHTML = `
        <div class="p-3 w-full text-indigo-400 font-bold leading-tight flex flex-row justify-center items-center">
            <p>
                No solutions were found
            </p>
            <svg class="w-5 h-5 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
               d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        `;

        document.getElementById('itineraryContainer').appendChild(div);
    }

    if(switchTab)
    {
        document.getElementById("tabsContainer").__x.$data.tab = 'itinerary';

        let popUpsAddButtons = document.querySelectorAll('*[id^="poi_add_"]');

        for(let i = 0; i < popUpsAddButtons.length; i++)
        {
            popUpsAddButtons[i].classList.add("hidden");
        }
    }
}

function addShareButtons(path)
{
    let div = document.createElement('div');

    div.className = 'm-2 mb-4 flex flex-col border rounded-xl';
    div.id = 'itineraryShareContainer';
    div.innerHTML = `
        <div class="text-indigo-400 font-bold leading-tight flex flex-row justify-between items-center">
            <div class="p-3 flex flex-row items-center justify-center">
                <svg class="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886
                   12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632
                   3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0
                   105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <p>
                    Share your itinerary
                </p>
            </div>
            <div class="flex flex-row items-center justify-center p-3">
                <a class="px-1"
                    href="https://facebook.com/sharer/sharer.php?u=http%3A%2F%2Flocalhost%3A8080%2Fitinerary%2F${path}"
                    target="_blank" rel="noopener" aria-label="">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path style="fill: #3c4cdd" d="M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38 12-12S18.62 0
                         12 0zm3.6 11.5h-2.1v7h-3v-7h-2v-2h2V8.34c0-1.1.35-2.82
                         2.65-2.82h2.35v2.3h-1.4c-.25 0-.6.13-.6.66V9.5h2.34l-.24 2z"/>
                    </svg>
                </a>
                <a class="px-1"
                    href="https://twitter.com/intent/tweet/?text=Check%20out%20my%20itinerary!%20
                    http%3A%2F%2Flocalhost%3A8080%2Fitinerary%2F${path}" target="_blank" rel="noopener" aria-label="">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path style="fill: #289acf" d="M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38
                         12-12S18.62 0 12 0zm5.26 9.38v.34c0 3.48-2.64 7.5-7.48
                         7.5-1.48 0-2.87-.44-4.03-1.2 1.37.17 2.77-.2 3.9-1.08-1.16-.02-2.13-.78-2.46-1.83.38.1.8.07
                         1.17-.03-1.2-.24-2.1-1.3-2.1-2.58v-.05c.35.2.75.32 1.18.33-.7-.47-1.17-1.28-1.17-2.2
                         0-.47.13-.92.36-1.3C7.94 8.85 9.88 9.9 12.06 10c-.04-.2-.06-.4-.06-.6 0-1.46
                         1.18-2.63 2.63-2.63.76 0 1.44.3 1.92.82.6-.12 1.95-.27 1.95-.27-.35.53-.72 1.66-1.24 2.04z"/>
                    </svg>
                </a>
                <a class="px-1"
                    href="https://reddit.com/submit/?url=http%3A%2F%2Flocalhost%3A8080%2Fitinerary%2F${path}&amp;
                    resubmit=true&amp;title=Check%20out%20my%20itinerary!" target="_blank" rel="noopener" aria-label="">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <circle style="fill: #cf2828" cx="9.391" cy="13.392" r=".978"/>
                        <path style="fill: #cf2828" d="M14.057
                              15.814c-1.14.66-2.987.655-4.122-.004-.238-.138-.545-.058-.684.182-.13.24-.05.545.19.685.72.417
                              1.63.646 2.568.646.93 0 1.84-.228 2.558-.642.24-.13.32-.44.185-.68-.14-.24-.445-.32-.683-.18zM5 12.086c0
                              .41.23.78.568.978.27-.662.735-1.264 1.353-1.774-.2-.207-.48-.334-.79-.334-.62 0-1.13.507-1.13 1.13z"/>
                        <path style="fill: #cf2828" d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm6.673
                              14.055c.01.104.022.208.022.314 0 2.61-3.004 4.73-6.695
                              4.73s-6.695-2.126-6.695-4.74c0-.105.013-.21.022-.313C4.537
                              13.73 4 12.97 4 12.08c0-1.173.956-2.13 2.13-2.13.63 0 1.218.29 1.618.757 1.04-.607 2.345-.99
                              3.77-1.063.057-.803.308-2.33 1.388-2.95.633-.366 1.417-.323 2.322.085.302-.81 1.076-1.397
                              1.99-1.397 1.174 0 2.13.96 2.13 2.13 0 1.177-.956 2.133-2.13 2.133-1.065
                              0-1.942-.79-2.098-1.81-.734-.4-1.315-.506-1.716-.276-.6.346-.818 1.395-.88 2.087
                              1.407.08 2.697.46 3.728 1.065.4-.468.987-.756 1.617-.756 1.17 0 2.13.953 2.13
                              2.13 0 .89-.54 1.65-1.33 1.97z"/>
                        <circle style="fill: #cf2828" cx="14.609" cy="13.391" r=".978"/>
                        <path style="fill: #cf2828" d="M17.87 10.956c-.302 0-.583.128-.79.334.616.51 1.082 1.112 1.352
                              1.774.34-.197.568-.566.568-.978 0-.623-.507-1.13-1.13-1.13z"/>
                    </svg>
                </a>
            </div>
        </div>
        <input class="w-full appearance-none rounded-b-xl py-2 px-2 text-gray-600 leading-tight
         focus:outline-none truncate text-center bg-indigo-100"
        type="text" id="itineraryShareLink"
        name="itineraryShareLink" value="http://localhost:8080/itinerary/${path}"/>
    `;

    document.getElementById('itineraryContainer').appendChild(div);

    document.getElementById("itineraryShareLink").addEventListener('click', function() {
        this.select();
        document.execCommand('copy');
        this.value = "Copied!";
        this.disabled = true;

        let input = this;
        setTimeout(function() {
            input.value = `http://localhost:8080/itinerary/${path}`;
            input.disabled = false;
        }, 1000);
    });
}

function addItineraryElement(id, dayName, date, dayStart, dayEnd, colour, pois, accommodation) {

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
        viewItineraryOnMap(pois, colour, accommodation);
    });

    let start = accommodation !== null ? 1 : 0;
    let end = accommodation !== null ? pois.length : pois.length - 1;

    if(accommodation !== null)
    {
        let poi = pois.find( ({ord}) => ord === 0);
        addPOIToItinerary(poi, id, true, 'Leaving at ' + poi.visitTimesStart);
    }

    for(let i = start; i < end; i++)
    {
        let poi = pois.find( ({ord}) => ord === i);

        addPOIToItinerary(poi, id, true, null);
    }

    if(accommodation !== null)
    {
        let poi = pois.find( ({ord}) => ord === 0);
        addPOIToItinerary(poi, id, false, 'Arriving at ' + poi.visitTimesEnd);
    }
    else
    {
        let poi = pois.find( ({ord}) => ord === pois.length - 1);
        addPOIToItinerary(poi, id, false, null);
    }
}

function addPOIToItinerary(poiInfo, dayId, addInfoToNext, accommodationTimeInfo)
{
    let el = addedMarkers.find( ({poi}) => poi.id === poiInfo.poiId);

    const div = document.createElement('div');

    div.className = 'w-full border border-gray-300 rounded-xl mt-2';
    div.id = `poi_${poiInfo.poiId}_day_${dayId}_itinerary`;
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
                        ${accommodationTimeInfo !== null ? accommodationTimeInfo : poiInfo.visitTimesStart + ' - ' + poiInfo.visitTimesEnd}
                    </p>
                </div>
            </div>
            <div class="p-7 text-white rounded-lg ${accommodationTimeInfo !== null ? '' : 'hidden'} flex flex-col justify-center">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1
                   1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </div>
        </div>
    `;

    document.getElementById(`poiContainerItinerary_${dayId}`).appendChild(div);

    if(addInfoToNext)
    {
        const distanceDiv = document.createElement('div');

        distanceDiv.className = 'w-full mt-5 mb-5 border-l-4 border-dotted border-gray-500 ml-5';
        distanceDiv.id = `poi_${poiInfo.poiId}_day_${dayId}_itineraryDistance`;
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

            document.getElementById(`poi_${poiInfo.poiId}_day_${dayId}_itineraryDistance`).appendChild(waitingDiv);
        }
    }
}

function decodePolyLine(str, precision)
{
    let index = 0,
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
    let flipped = [];

    for (let i = 0; i < coords.length; i++)
    {
        let coord = coords[i].slice();
        flipped.push([coord[1], coord[0]]);
    }
    return flipped;
}

function viewItineraryOnMap(pois, colour, accommodation)
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
        let el = document.getElementById(`poi_marker_${pois[i].poiId}`);
        let styleBackgroundImage = el.style.backgroundImage;

        currentShownRoute.push({
            marker: el,
            id: pois[i].poiId,
            backgroundImage: styleBackgroundImage
        });

        el.style.backgroundImage = '';
        el.style.boxShadow = '';
        el.innerHTML = `
            <div class="flex flex-row justify-center font-bold text-white text-2xl rounded-full"
                 style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased; background-color: ${colour}">
                ${accommodation === null ? pois[i].ord + 1 : accommodation === pois[i].poiId ?
                  '<svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1' +
                    ' 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />\n' +
                  '</svg>' : pois[i].ord + 1
                }
            </div>
        `;

        if(pois[i].polyLine !== null && (pois.length === 2 ? pois[i].ord === 0 : true))
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

            recalculateColours(poi);
        }

        map.fitBounds(currentBounds.coords);
    }
}

document.getElementById("plannerTabButton").addEventListener("click", function() {
    document.getElementById("itineraryContainer").__x.$data.selected = null;
});

window.addEventListener('keydown', function(event) {
    if(event.ctrlKey || event.metaKey)
    {
        let state = document.getElementById("loadingContainer").__x.$data.state;

        if(String.fromCharCode(event.which).toLowerCase() === 's')
        {
            event.preventDefault();

            if(state === 'unsaved')
            {
                savePlanner();
            }
        }
    }
});

function savePlanner()
{
    addLoading();

    let scheduleToSend = getScheduleToSend();

    const url = `http://localhost:8080/planner/save/restricted`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleToSend)
    }).then(response => {
        addLoadingSaved();
    })
    .catch((error) => {
        addLoadingError();
        console.error('Error:', error);
    });
}

function getScheduleToSend()
{
    let scheduleDays = [];

    for(let i = 0; i < addedDays.length; i++)
    {
        let pois = [];

        for(let j = 0; j < addedDays[i].pois.length; j++)
        {
            let visitTimesData = addedDays[i].visitDurations.find( ({id}) => id === addedDays[i].pois[j].poi.id);

            pois.push({
                poiId:  addedDays[i].pois[j].poi.id,
                lat: addedDays[i].pois[j].poi.lat,
                lng: addedDays[i].pois[j].poi.lng,
                colours: addedDays[i].pois[j].colours,
                openingAt: visitTimesData.openingAt,
                closingAt: visitTimesData.closingAt,
                visitDuration: visitTimesData.visitDuration
            });
        }

        let accommodation = document.getElementById(`poiContainer_${addedDays[i].id}`).__x.$data.accommodation;

        scheduleDays.push({
            dayId: addedDays[i].id,
            dayName: addedDays[i].dayName,
            dayNumber: addedDays[i].dayNumber,
            date: addedDays[i].date,
            colour: addedDays[i].colour,
            dayStart: addedDays[i].dayStart,
            dayEnd: addedDays[i].dayEnd,
            pois: pois,
            accommodation: accommodation
        });
    }

    return {
        scheduleDays: scheduleDays
    };
}

function addLoadingNotSaved()
{
    let loadingDiv = document.getElementById("loadingContainer");
    loadingDiv.__x.$data.state = 'unsaved';

    loadingDiv.innerHTML = `
        <button class="group hover:bg-indigo-500 rounded-full p-3 transition ease-out duration-300 focus:outline-none"
                onclick="savePlanner()">
            <svg class="w-5 h-5 text-indigo-500 group-hover:text-white"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003
                 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
        </button>
    `;
}

function addLoading()
{
    let loadingDiv = document.getElementById("loadingContainer");
    loadingDiv.__x.$data.state = 'loading';

    loadingDiv.innerHTML = `
        <div class="p-3">
            <div class="h-4 w-4 relative">
                <div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400"></div>
                <div class="rounded-full h-full h-full bg-indigo-500"></div>
            </div>
        </div>
    `;
}

function addLoadingSaved()
{
    let loadingDiv = document.getElementById("loadingContainer");
    loadingDiv.__x.$data.state = 'saved';

    loadingDiv.innerHTML = `
        <div class="p-3">
            <svg class="w-5 h-5 text-indigo-500 group-hover:text-white"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
    `;
}

function addLoadingError()
{
    let loadingDiv = document.getElementById("loadingContainer");
    loadingDiv.__x.$data.state = 'unsaved';

    loadingDiv.innerHTML = `
        <button class="group hover:bg-indigo-500 rounded-full p-3 transition ease-out duration-300 focus:outline-none"
                onclick="savePlanner()">
            <svg class="w-5 h-5 text-indigo-500 group-hover:text-white"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                       d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
    `;
}

document.addEventListener('DOMContentLoaded', function()
{
    addLoading();

    const url = `http://localhost:8080/planner/restricted`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(response => response.json())
    .then(data => {

        if(data.schedule !== null)
        {
            let newDayButton = document.getElementById("addNewDayButton");
            let createItineraryButton = document.getElementById("createItineraryButton");
            newDayButton.disabled = true;
            createItineraryButton.disabled = true;

            let poisIds = [];
            for(let i = 0; i < data.schedule.scheduleDays.length; i++)
            {
                for(let j = 0; j < data.schedule.scheduleDays[i].pois.length; j++)
                {
                    poisIds.push(data.schedule.scheduleDays[i].pois[j].poiId);
                }
            }

            if(data.itinerary !== null)
            {
                for(let i = 0; i < data.itinerary.routes.length; i++)
                {
                    for(let j = 0; j < data.itinerary.routes[i].pois.length; j++)
                    {
                        poisIds.push(data.itinerary.routes[i].pois[j].poiId);
                    }
                }
            }

            fetch(`http://localhost:8080/poi/multiple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(poisIds)
            }).then(response => response.json())
            .then(poiData => {

                for(let i = 0; i < poiData.length; i++)
                {
                    addPoiMarker(poiData[i]);
                }

                for(let i = 0; i < data.schedule.scheduleDays.length; i++)
                {
                    addedDays.push({id: data.schedule.scheduleDays[i].dayId,
                        date: data.schedule.scheduleDays[i].date,
                        dayStart: data.schedule.scheduleDays[i].dayStart,
                        dayEnd: data.schedule.scheduleDays[i].dayEnd,
                        dayName: data.schedule.scheduleDays[i].dayName,
                        dayNumber: data.schedule.scheduleDays[i].dayNumber,
                        colour: data.schedule.scheduleDays[i].colour,
                        visitDurations: [],
                        pois: []
                    });

                    let dateFormatted = data.schedule.scheduleDays[i].date.split("-");
                    let dayStart = (Math.floor(data.schedule.scheduleDays[i].dayStart / 60) < 10 ? '0'
                        + Math.floor(data.schedule.scheduleDays[i].dayStart / 60) : Math.floor(data.schedule.scheduleDays[i].dayStart / 60))
                        + ':' + (data.schedule.scheduleDays[i].dayStart % 60 < 10 ? '0' +
                            data.schedule.scheduleDays[i].dayStart % 60 : data.schedule.scheduleDays[i].dayStart % 60);
                    let dayEnd = (Math.floor(data.schedule.scheduleDays[i].dayEnd / 60) < 10 ? '0'
                        + Math.floor(data.schedule.scheduleDays[i].dayEnd / 60) : Math.floor(data.schedule.scheduleDays[i].dayEnd / 60))
                        + ':' + (data.schedule.scheduleDays[i].dayEnd % 60 < 10 ? '0' +
                            data.schedule.scheduleDays[i].dayEnd % 60 : data.schedule.scheduleDays[i].dayEnd % 60);

                    addDayElement(data.schedule.scheduleDays[i].dayId, data.schedule.scheduleDays[i].dayName,
                        dateFormatted[1] + '/' + dateFormatted[2] + "/" + dateFormatted[0],
                        dayStart, dayEnd, data.schedule.scheduleDays[i].colour, data.schedule.scheduleDays[i].accommodation);
                }

                for(let i = 0; i < data.schedule.scheduleDays.length; i++)
                {
                    for(let j = 0; j < data.schedule.scheduleDays[i].pois.length; j++)
                    {
                        addPOItoDay(data.schedule.scheduleDays[i].pois[j].poiId, data.schedule.scheduleDays[i].dayId,
                            data.schedule.scheduleDays[i].accommodation, data.schedule.scheduleDays[i].pois[j].visitDuration);
                    }
                }

                if(data.itinerary !== null)
                {
                    constructItinerary(data.itinerary, false);
                }

                newDayButton.disabled = false;
                createItineraryButton.disabled = false;
                addLoadingSaved();
            })
            .catch((error) => {
                addLoadingError();
                console.error('Error:', error);
            });
        }
        else
        {
            addLoadingSaved();
        }

    })
    .catch((error) => {
        addLoadingError();
        console.error('Error:', error);
    });
}, false);