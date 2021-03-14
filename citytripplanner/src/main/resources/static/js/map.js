mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

let addedMarkers = [];
let addedDays = [];
let currentSelectedDay = null;

let initialPoint = null;
let movedPoint = null;

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
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
            data.poiHours.sort((a, b) => a.dayNumber < b.dayNumber);

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

            let popUp = new mapboxgl.Popup({className: `mapbox-gl-popup-${id}`}).setHTML(html);
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

        const div = document.createElement('div');

        div.className = 'relative m-2 border border-gray-300 rounded-xl';
        div.id = `poi_${id}_day_${currentSelectedDay.id}`;
        div.innerHTML = `
            ${el['details'].photoPrefix ? `<img class="w-full h-10 shadow-xl rounded-xl object-cover object-center" alt="POI Photo"
            src="${el['details'].photoPrefix}500${el['details'].photoSuffix}">` : ""}
        `;


        if(poiContainer.innerText === 'No Locations have been added')
        {
            document.getElementById(`poiContainer_${currentSelectedDay.id}`).innerHTML = div.innerHTML;
            document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).style.maxHeight =
                document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).scrollHeight + 'px';
        }
        else
        {
            document.getElementById(`poiContainer_${currentSelectedDay.id}`).appendChild(div);
            document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).style.maxHeight =
                document.getElementById(`poiContainerParent_${currentSelectedDay.id}`).scrollHeight + 'px';
        }
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
             x-ref="dayContainer_${id}" x-bind:style="selected == ${id} ? 'max-height: ' + $refs.dayContainer_${id}.scrollHeight + 'px' : ''">
            <div class="p-6" id="poiContainer_${id}">
                No Locations have been added
            </div>
        </div>
      `;

    document.getElementById('daysContainer').appendChild(div);

    if (document.getElementById('daysContainer').classList.contains("hidden"))
    {
        document.getElementById('daysContainer').classList.remove("hidden");
    }
}

function removeDayElement(id) {
    document.getElementById('day_' + id).remove();

    const index = addedDays.findIndex(function(day) { return day.id === id});
    if(index > -1)
        addedDays.splice(index, 1);
}

function addDay()
{
    let displayDate = document.getElementById('addDay');
    let displayTimeStart = document.getElementById('dayStart');
    let displayTimeEnd = document.getElementById('dayEnd');

    let selectedDate = new Date(displayDate.value);
    let selectedTimeStart = displayTimeStart.value.split(':')[0] * 60 + displayTimeStart.value.split(':')[1];
    let selectedTimeEnd = displayTimeEnd.value.split(':')[0] * 60 + displayTimeEnd.value.split(':')[1];
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let dateFormatted = displayDate.value.split("-");

    if(displayDate.value && displayTimeStart.value && displayTimeEnd.value && selectedTimeEnd - selectedTimeStart > 0)
    {
        if(!addedDays.find( ({date}) => date === displayDate.value))
        {
            let children = document.getElementById("daysContainer").children;
            let highestId = 0;

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