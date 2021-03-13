mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

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
let addedMarkers = [];

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
                hoursHTML += `` +
                    `<div class="mt-3 bg-indigo-200 rounded-xl shadow">` +
                    `<p class="text-center border-b-2 border-gray-400 font-bold text-gray-600">` +
                    `${hours.dayName ? hours.dayName : "unavailable"}` +
                    `</p>` +
                    `<p class="text-center font-bold text-gray-600">` +
                    `Opening: ${hours.openingAt ? hours.openingAt : "unavailable"}` +
                    `</p>` +
                    `<p class="text-center font-bold text-gray-600">` +
                    `Closing: ${hours.closingAt ? hours.closingAt : "unavailable"}` +
                    `</p>` +
                    `</div>`;
            }

            let html = `` +
                `<p class="mb-2 border-b-2 font-bold text-2xl text-center text-indigo-400">` +
                `${name}` +
                `</p>` +
                (data.photoPrefix ? `<img class="rounded-2xl shadow-xl" alt="POI Photo" src="${data.photoPrefix}500${data.photoSuffix}">` : "") +
                `<div class="overflow-auto no-scrollbar max-h-36">` +
                `<p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">` +
                `Phone: ${data.formattedPhone ? data.formattedPhone : "unavailable"}` +
                `</p>` +
                `<p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">` +
                `Rating: ${data.rating ? data.rating : "unavailable"}` +
                `</p>` +
                `<p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">` +
                `Type: ${data.type ? data.type : "unavailable"}` +
                `</p>` +
                `<p class="mt-3 w-full text-center border-b-2 font-bold text-gray-600">` +
                `Price Tier: ${data.priceTier ? data.priceTier : "unavailable"}` +
                `</p>` +
                `${hoursHTML}` +
                `</div>`;

            let popUp = new mapboxgl.Popup().setHTML(html);
            marker.setPopup(popUp);
            marker.togglePopup();
            addedMarkers.find( ({poi}) => poi.id === id)['details'] = data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
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

let initialPoint = null;
let movedPoint = null;

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