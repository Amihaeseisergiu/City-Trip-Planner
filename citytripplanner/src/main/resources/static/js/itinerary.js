mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

let addedMarkers = [];
let currentShownRoute = [];
let currentBounds = null;

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [0, 0],
    zoom: 12
});

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
            document.getElementById(`poi_marker_loading_${id}`).remove();
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
            <div class="flex flex-row justify-between">
                <p class="text-gray-500 font-light">
                    ${hours.dayName} : 
                    
                </p>
                <p class="text-gray-500 font-light">
                    ${hours.openingAt.split(':')[0] + ':' + hours.openingAt.split(':')[1]} - 
                    ${hours.closingAt.split(':')[0] + ':' + hours.closingAt.split(':')[1]}
                </p>
            </div>`;
    }

    let starsHTML = '';
    let starsAdded = 0;

    for(let i = 0; i < Math.floor(data.rating / 2); i++)
    {
        starsHTML += `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921
                    1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371
                    1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07
                    3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0
                    00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1
                    1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1
                    0 00.951-.69l1.07-3.292z" />
            </svg>
        `;
        starsAdded += 1;
    }

    for(let i = 0; i < 5 - starsAdded; i++)
    {
        starsHTML += `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
              stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519
              4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1
              1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1
              1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1
              1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1
              1 0 00.951-.69l1.519-4.674z" />
            </svg>
        `;
    }

    let prices = ['', '$', '$$', '$$$', '$$$$'];
    let priceColours = ['#0ffc03', '#4fc91e', '#d9d516', '#d99e16', '#db5e16'];

    let html = `
        <div class="flex flex-row items-center justify-center mb-2 mt-3">
            <div class="w-full h-8 flex truncate relative">
                <p class="absolute font-bold text-2xl text-indigo-400 cursor-default select-none"
                   style="transition-timing-function: linear;"
                   onmouseover="if(this.clientWidth > this.parentNode.clientWidth)
                                {this.style.transform = 'translateX(calc(' + (this.parentNode.clientWidth) + 'px - 100%))';}
                                this.style.transition = '${data.name.length / 15}s'; "
                   onmouseout="this.style.transform = 'translateX(0)'; this.style.transition = '1s';">
                    ${data.name}
                </p>
            </div>
            <div class="top-3 left-1/2 absolute transform -translate-x-1/2 flex flex-row select-none">
                <p class="text-sm font-bold leading-tight mr-1" style="color: ${priceColours[data.priceTier]};">
                    ${prices[data.priceTier]}
                </p>
                <p class="text-gray-500 text-sm font-bold leading-tight whitespace-nowrap">
                    ${data.type ? data.type.length > 20 ? data.type.substring(0, 20) + '...' : data.type : "Unknown type"}
                </p>
            </div>
        </div>
        
        <div x-data="{showTimeTable: false}"
             @mouseover="showTimeTable = true"
             @mouseover.away="showTimeTable = false"
             style="background-position: center; background-repeat: no-repeat; background-size: cover;
                    ${data.photoPrefix ? `background-image: url(${data.photoPrefix}500${data.photoSuffix});` : ""}"
             class="w-48 h-48 rounded-2xl shadow-xl relative">
             <div class="p-1 absolute top-1 left-1/2 flex flex-row bg-white rounded-xl transform -translate-x-1/2">
                ${starsHTML}
             </div>
             <div x-show="showTimeTable === true"
                  x-transition:enter="transition duration-500 transform ease-out"
                  x-transition:enter-start="scale-75 opacity-0"
                  x-transition:enter-end="opacity-100"
                  x-transition:leave="transition duration-300 transform ease-in"
                  x-transition:leave-end="opacity-0 scale-75"
                  class="absolute top-0 right-0 bottom-0 left-0 w-full h-full rounded-xl bg-white select-none">
                    <p class="text-center text-sm font-bold text-gray-500 border-b-2 w-full">
                        Time table
                    </p>
                    <div class="p-4">
                        ${hoursHTML}
                    </div>
             </div>
        </div>
         `;

    document.getElementById(`poi_marker_loading_${data.id}`).remove();

    let markerZIndex = marker._element.style.zIndex;
    let markerDivEl = document.getElementById(`poi_marker_${data.id}`);

    let popUp = new mapboxgl.Popup({className: `mapbox-gl-popup-${data.id} z-40`}).setHTML(html).on("open", e => {
        marker._element.style.zIndex = 49;
        marker._element.classList.remove("bring-to-front");
        markerDivEl.classList.add('scale-125');
    }).on("close", e => {
        marker._element.style.zIndex = markerZIndex;
        marker._element.classList.add("bring-to-front");
        markerDivEl.classList.remove('scale-125');
    });

    marker.setPopup(popUp);

    if(document.getElementsByClassName('mapboxgl-popup').length === 0)
    {
        marker.togglePopup();
    }

    addedMarkers.find( ({poi}) => poi.id === data.id)['details'] = data;
}

function addPoiMarker(poi)
{
    if(!addedMarkers.some(e => e.poi.id === poi.id))
    {
        let el = document.createElement('div');
        el.className = "z-10 bring-to-front";
        el.innerHTML = `
            <div style="background-image: url(${poi.iconPrefix}${64}${poi.iconSuffix}); width: 32px; height: 32px; background-size: cover;"
                 class="block bg-indigo-400 rounded-full p-0 border-none cursor-pointer transform transition hover:scale-125 duration-500"
                 id="poi_marker_${poi.id}">
            </div>
        `;

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
                if(document.getElementById(`poi_marker_loading_${poi.id}`) === null)
                {
                    let markerLoadingDiv = document.createElement("div");
                    markerLoadingDiv.innerHTML = `
                        <div id="poi_marker_loading_${poi.id}"
                             class="absolute animate-ping h-full w-full rounded-full bg-indigo-400"></div>
                    `;
                    el.insertBefore(markerLoadingDiv, document.getElementById(`poi_marker_${poi.id}`));

                    getPOIDetails(poi.id, marker);
                }
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

function constructItinerary(data)
{
    document.getElementById("itineraryContainer").innerHTML = '';

    if(data.routes.length > 0)
    {
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

        div.className = 'mb-4 flex flex-col border rounded-xl w-full transform scale-95';
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
}

function addItineraryElement(id, dayName, date, dayStart, dayEnd, colour, pois, accommodation) {

    const div = document.createElement('div');

    div.className = 'relative w-full flex flex-col items-center';
    div.id = 'dayItinerary_' + id
    div.innerHTML = `
        <div :class="{'hover:border-transparent border-transparent transform scale-100 -translate-y-1 transition ease-out duration-500 bg-white shadow-lg': selected === ${id},
             'transform scale-95 -translate-y-0 transition ease-out duration-500 border-gray-200 hover:border-gray-400': selected !== ${id}}"
             class="w-11/12 z-10 mt-3 group rounded-xl border-2 bg-gray-50 cursor-pointer select-none flex flex-row justify-between">
            <div style="background-color: ${colour};" class="absolute top-1 left-1 rounded-full w-3 h-3"></div>
            <button type="button" class="flex-grow min-w-0 p-6 text-left text-gray-500 leading-tight focus:outline-none"
                @click="selected !== ${id} ? selected = ${id} : selected = null;
                        if(selected !== ${id}) cleanShownRoutes();" id="viewItineraryOnMapButton_${id}">
                <p :class="{'text-indigo-400': selected === ${id}}"
                  class="font-bold group-hover:text-indigo-400 truncate">
                    ${dayName}, ${date}
               </p>
               <p class="truncate">${dayStart} - ${dayEnd}</p>
            </button>
            <div x-show="selected === ${id}" class="p-6 text-green-400 rounded-xl flex flex-row items-center">
                <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013
                   16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            </div>
        </div>
        <div class="w-10/12 transform z-0 -translate-y-1 items-center relative
             overflow-hidden transition-all max-h-0 ease-in-out duration-500"
             x-ref="dayContainerItinerary_${id}"
             x-bind:style="selected == ${id} ? 'max-height: ' + $refs.dayContainerItinerary_${id}.scrollHeight + 'px' : ''">
            <div class="flex flex-col p-5 bg-white border-l-2 border-r-2 border-b-2 rounded-b-xl items-center" id="poiContainerItinerary_${id}">
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
            <div class="flex-grow min-w-0 p-4 text-left focus:outline-none">
                <p class="text-2xl font-bold leading-tight truncate"
                    style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                    ${el['poi'].name}
                </p>
                <p class="truncate" style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                    ${accommodationTimeInfo !== null ? accommodationTimeInfo : poiInfo.visitTimesStart + ' - ' + poiInfo.visitTimesEnd}
                </p>
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

            waitingDiv.className = 'w-full mt-5';
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

        el.style.backgroundImage = '';
        el.style.boxShadow = '';
        el.classList.remove('z-10');
        el.classList.add('z-20');
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

        let arrows = [];

        if(pois[i].polyLine !== null)
        {
            let coordinates = flipped(decodePolyLine(pois[i].polyLine, 6));
            allCoordinates.push(...coordinates);

            for(let j = 1; j < coordinates.length - 1; j++)
            {
                const lineBearing = turf.bearing(coordinates[j],
                    coordinates[j + 1]);

                let foundArrow = null;
                for(let k = 0; k < currentShownRoute.length; k++)
                {
                    for(let l = 0; l < currentShownRoute[k].arrows.length; l++)
                    {
                        let coords = [currentShownRoute[k].arrows[l].getLngLat().lng, currentShownRoute[k].arrows[l].getLngLat().lat];
                        let coords2 = coordinates[j];

                        if(coords[0] === coords2[0] && coords[1] === coords2[1])
                        {
                            foundArrow = currentShownRoute[k].arrows[l];
                            break;
                        }
                    }
                }

                let marker_el = document.createElement('div');
                marker_el.className = 'z-0 flex flex-row justify-center items-center text-white rounded-full'
                if(foundArrow !== null)
                {
                    marker_el.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>`;
                }
                else
                {
                    marker_el.innerHTML = `
                    <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z">
                        </path>
                    </svg>`;
                }
                marker_el.style.width = 20 + 'px';
                marker_el.style.height = 20 + 'px';
                marker_el.style.backgroundColor = colour;

                var arrowMarker = new mapboxgl.Marker(marker_el);
                arrowMarker.setLngLat(coordinates[j])
                    .setRotation(lineBearing).setRotationAlignment('map')
                    .setPitchAlignment('map').addTo(map);
                arrows.push(arrowMarker);
            }

            geoJson.data.features.push({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            });
        }

        currentShownRoute.push({
            marker: el,
            id: pois[i].poiId,
            backgroundImage: styleBackgroundImage,
            arrows: arrows
        });
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

    let bounds = null;

    if(allCoordinates.length > 0)
    {
        bounds = allCoordinates.reduce(function (bounds, coord) {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));
    }
    else
    {
        let poi = addedMarkers.find( ({poi}) => poi.id === pois[0].poiId).poi;
        bounds = [[poi.lng, poi.lat], [poi.lng, poi.lat]];
    }

    map.fitBounds(bounds, {
        padding: 100
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
            let el = currentShownRoute[i].marker;
            el.classList.remove('z-20');
            el.classList.add('z-10');

            let markerDivEl = document.getElementById(`poi_marker_${currentShownRoute[i].id}`);
            markerDivEl.innerHTML = '';
            markerDivEl.style.backgroundImage = currentShownRoute[i].backgroundImage;
            markerDivEl.style.boxShadow = currentShownRoute[i].boxShadow;

            let poi = addedMarkers.find( ({poi}) => poi.id === currentShownRoute[i].id);

            for(let j = 0; j < currentShownRoute[i].arrows.length; j++)
            {
                currentShownRoute[i].arrows[j].remove();
            }
        }

        map.fitBounds(currentBounds.coords);
    }
}

document.addEventListener('DOMContentLoaded', function()
{
    let pathArray = window.location.pathname.split('/');

    if(pathArray.length === 3 && pathArray[2] !== null)
    {
        const url = `http://localhost:8080/itinerary/view/${pathArray[2]}`;
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => response.json())
            .then(data => {

                let poisIds = [];

                for(let i = 0; i < data.routes.length; i++)
                {
                    for(let j = 0; j < data.routes[i].pois.length; j++)
                    {
                        poisIds.push(data.routes[i].pois[j].poiId);
                    }
                }

                let div = document.createElement('div');

                div.className = 'p-3 w-full';
                div.innerHTML = `
                    <div class="flex flex-row w-full justify-center items-center font-bold text-xl">
                        <p class="text-indigo-500">
                            ${data.userName}
                        </p>
                        <p class="text-gray-500">
                            's itinerary
                        </p>
                    </div>
                `;

                document.getElementById(`itineraryCreatorName`).appendChild(div);

                fetch(`http://localhost:8080/poi/multiple`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(poisIds)
                }).then(response => response.json())
                    .then(poiData => {

                        let coordinates = []
                        for(let i = 0; i < poiData.length; i++)
                        {
                            addPoiMarker(poiData[i]);
                            coordinates.push([poiData[i].lng, poiData[i].lat]);
                        }

                        constructItinerary(data);

                        let bounds = new mapboxgl.LngLatBounds();
                        coordinates.forEach(function(coordinate) {
                            bounds.extend(coordinate);
                        });
                        map.setCenter([(bounds._ne.lng + bounds._sw.lng) / 2, (bounds._ne.lat + bounds._sw.lat) / 2]);
                        map.fitBounds(bounds, { padding: 300 });
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });

            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}, false);