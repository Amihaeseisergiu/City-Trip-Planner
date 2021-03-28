mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

let addedMarkers = [];
let currentShownRoute = [];
let currentBounds = null;

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [27.60, 47.16],
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
        <div class="flex flex-row items-center justify-center mb-2">
            <p class="font-bold text-2xl text-indigo-400">
                ${data.name}
            </p>
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

    let popUp = new mapboxgl.Popup({className: `mapbox-gl-popup-${data.id}`}).setHTML(html);

    marker.setPopup(popUp);
    marker.togglePopup();

    addedMarkers.find( ({poi}) => poi.id === data.id)['details'] = data;
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