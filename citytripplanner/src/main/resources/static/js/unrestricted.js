mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

let addedMarkers = [];
let addedDays = [];
let addedPOIs = [];
let currentShownRoute = [];
let currentShownPopUp = null;
let currentSelectedDay = null;

let initialPoint = null;
let movedPoint = null;
let currentBounds = null;

let m_posx = null;
let m_posy = null;
let resize_el = document.getElementById("resize");
let left_panel_resizing = 0;

if(document.body.clientWidth < 1024)
{
    resize_el.style.cursor = 'ns-resize';
}

function resize(e)
{
    let parent = resize_el.parentNode;
    let dx =  m_posx - e.x;
    let dy = m_posy - e.y;

    let newSize = document.body.clientWidth < 1024 ? parseInt(getComputedStyle(parent, '').height) - dy :
        parseInt(getComputedStyle(parent, '').width) - dx;

    if(document.body.clientWidth < 1024 ? (newSize < document.body.clientHeight / 1.28 || dy > 0) :
        (newSize < document.body.clientWidth / 2 || dx > 0))
    {
        if(document.body.clientWidth > 1024)
        {
            m_posx = e.x;

            if(newSize < 350 && dx >= 0 && (left_panel_resizing === 0 || left_panel_resizing === 1))
            {
                parent.style.width = '0px';
                parent.style.transition = 'width 1s';
                left_panel_resizing = 1;
                resize_el.classList.remove('hover:bg-indigo-400', 'opacity-0', 'hover:opacity-90');
                resize_el.classList.add('bg-indigo-500');

                const interval = setInterval(function() {
                    map.resize();
                }, 300);

                setTimeout(function () {
                    document.getElementById("tabsContainer").classList.add("hidden");
                }, 300);

                setTimeout(function () {
                    left_panel_resizing = 0;
                    clearInterval(interval);
                }, 1000);
            }
            else if(newSize < 350 && dx < 0 && (left_panel_resizing === 0 || left_panel_resizing === 2))
            {
                parent.style.width = '350px';
                parent.style.transition = 'width 1s';
                left_panel_resizing = 2;
                resize_el.classList.add('hover:bg-indigo-400', 'opacity-0', 'hover:opacity-90');
                resize_el.classList.remove('bg-indigo-500');

                const interval = setInterval(function() {
                    map.resize();
                }, 300);

                setTimeout(function () {
                    document.getElementById("tabsContainer").classList.remove("hidden");
                }, 100);

                setTimeout(function () {
                    left_panel_resizing = 0;
                    clearInterval(interval);
                }, 1000);
            }
            else if(left_panel_resizing === 0)
            {
                parent.style.transition = '';
                parent.style.width = newSize + "px";

            }
        }
        else
        {
            m_posy = e.y;
            if(newSize < 150 && dy >= 0 && (left_panel_resizing === 0 || left_panel_resizing === 1))
            {
                parent.style.height = '0px';
                parent.style.transition = 'height 1s';
                left_panel_resizing = 1;
                resize_el.classList.remove('hover:bg-indigo-400', 'opacity-0', 'hover:opacity-90');
                resize_el.classList.add('bg-indigo-500');

                const interval = setInterval(function() {
                    map.resize();
                }, 300);

                setTimeout(function () {
                    document.getElementById("tabsContainer").classList.add("hidden");
                }, 200);

                setTimeout(function () {
                    left_panel_resizing = 0;
                    clearInterval(interval);
                }, 1000);
            }
            else if(newSize < 150 && dy < 0 && (left_panel_resizing === 0 || left_panel_resizing === 2))
            {
                parent.style.height = '50%';
                parent.style.transition = 'height 1s';
                left_panel_resizing = 2;
                resize_el.classList.add('hover:bg-indigo-400', 'opacity-0', 'hover:opacity-90');
                resize_el.classList.remove('bg-indigo-500');

                const interval = setInterval(function() {
                    map.resize();
                }, 300);

                setTimeout(function () {
                    document.getElementById("tabsContainer").classList.remove("hidden");
                }, 200);

                setTimeout(function () {
                    left_panel_resizing = 0;
                    clearInterval(interval);
                }, 1000);
            }
            else if(left_panel_resizing === 0)
            {
                parent.style.transition = '';
                parent.style.height = newSize + "px";

                if(newSize > document.body.clientHeight / 1.8 && dy < 0)
                {
                    parent.style.height = '100%';
                    parent.style.transition = 'height 1s';
                    document.getElementById("mapParent").classList.add("hidden");
                }
                else if(newSize <= document.body.clientHeight / 1.8)
                {
                    if(document.getElementById("mapParent").classList.contains("hidden"))
                    {
                        document.getElementById("mapParent").classList.remove("hidden");
                    }
                }
            }
        }
        map.resize();
    }
}

function touchHandler(event)
{
    let touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;
        case "touchend":   type = "mouseup";   break;
        default:           return;
    }

    let simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
        first.screenX, first.screenY,
        first.clientX, first.clientY, false,
        false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);

    if(event.cancelable)
    {
        event.preventDefault();
    }
}

resize_el.addEventListener("touchstart", touchHandler, true);
resize_el.addEventListener("touchmove", touchHandler, true);
resize_el.addEventListener("touchend", touchHandler, true);
resize_el.addEventListener("touchcancel", touchHandler, true);

resize_el.addEventListener("mousedown", function(e){
    m_posx = e.x;
    m_posy = e.y;
    document.addEventListener("mousemove", resize, false);
}, false);

document.addEventListener("mouseup", function(){
    document.removeEventListener("mousemove", resize, false);
}, false);

window.addEventListener("resize", function(event) {
    let parent = resize_el.parentNode;

    if(document.body.clientWidth < 1024 && resize_el.style.cursor !== 'ns-resize')
    {
        resize_el.style.cursor = 'ns-resize';
        parent.style.transition = '';
        parent.style.width = '100%';
        parent.style.height = '50%';

        if(document.getElementById("mapParent").classList.contains("hidden"))
        {
            document.getElementById("mapParent").classList.remove("hidden");
        }

        if(document.getElementById("tabsContainer").classList.contains("hidden"))
        {
            document.getElementById("tabsContainer").classList.remove("hidden");
            resize_el.classList.add('hover:bg-indigo-400', 'opacity-0', 'hover:opacity-90');
            resize_el.classList.remove('bg-indigo-500');
        }

        map.resize();
    }
    else if(document.body.clientWidth >= 1024 && resize_el.style.cursor !== 'w-resize')
    {
        resize_el.style.cursor = 'w-resize';
        parent.style.transition = '';
        parent.style.width = '33.33%';
        parent.style.height = '100%';

        if (document.getElementById("mapParent").classList.contains("hidden")) {
            document.getElementById("mapParent").classList.remove("hidden");
        }

        if (document.getElementById("tabsContainer").classList.contains("hidden")) {
            document.getElementById("tabsContainer").classList.remove("hidden");
            resize_el.classList.add('hover:bg-indigo-400', 'opacity-0', 'hover:opacity-90');
            resize_el.classList.remove('bg-indigo-500');
        }

        map.resize();
    }
});

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [0, 0],
    zoom: 12
});

let geoLocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
});

map.addControl(geoLocate);

geoLocate.on('geolocate', function(e) {
    initialPoint = [e.coords.longitude, e.coords.latitude];
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

function getCurrentTime()
{
    return new Date().toLocaleTimeString('en-US',
        {hour12: false,
            hour: "numeric",
            minute: "numeric"});
}

function dayIsAdded(value)
{
    return addedDays.find( ({date}) => date === value)
}

document.getElementById('addDay').setAttribute('min', getTodaysDate());
document.getElementById('addDay').setAttribute('value', getTodaysDate());

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
        <div class="flex flex-col items-start mb-2 mt-2">
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
    let markerDivElBgImage = `url("${data.iconPrefix}${64}${data.iconSuffix}")`;

    let popUp = new mapboxgl.Popup({className: `mapbox-gl-popup-${data.id} z-40`}).setHTML(html).on('open', e => {
        currentShownPopUp = {
            marker: marker,
            markerZIndex: markerZIndex,
            markerDivEl: markerDivEl,
            markerDivElBgImage: markerDivElBgImage,
            poiId: data.id
        };

        marker._element.style.zIndex = 49;
        marker._element.classList.remove("bring-to-front");
        markerDivEl.classList.add('scale-125');

        if(document.getElementById("tabsContainer").__x.$data.tab === 'planner')
        {
            markerDivEl.classList.remove('bg-indigo-400');
            markerDivEl.classList.add('bg-white');
            markerDivEl.style.backgroundImage = '';

            let el = addedMarkers.find( ({poi}) => poi.id === data.id);

            if(!('colour' in el) || el['colour'] === null)
            {
                markerDivEl.innerHTML = `
                <button id="poi_add_${data.id}"
                        class="p-1 text-gray-500 transform focus:outline-none scale-125
                        hover:scale-150 hover:text-green-400 transition ease-out duration-500">
                    <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                `;

                document.getElementById(`poi_add_${data.id}`).addEventListener('click', function() {
                    markerDivEl.innerHTML = '';
                    markerDivEl.style.backgroundImage = markerDivElBgImage;
                    addPOI(data.id,  '1:00');
                });
            }
            else
            {
                markerDivEl.innerHTML = `
                <button id="poi_add_${data.id}"
                        class="p-1 focus:outline-none text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                `;
            }
        }
    }).on("close", e => {
        marker._element.style.zIndex = markerZIndex;
        marker._element.classList.add("bring-to-front");
        markerDivEl.classList.remove('scale-125');
        markerDivEl.style.backgroundImage = markerDivElBgImage;

        if(document.getElementById("tabsContainer").__x.$data.tab === 'planner')
        {
            markerDivEl.innerHTML = '';
            markerDivEl.classList.remove('bg-white');
            markerDivEl.classList.add('bg-indigo-400');
        }

        if(currentShownPopUp !== null && data.id === currentShownPopUp.poiId)
        {
            currentShownPopUp = null;
        }
    });

    marker.setPopup(popUp);

    if(document.getElementsByClassName('mapboxgl-popup').length === 0)
    {
        marker.togglePopup();
    }

    addedMarkers.find( ({poi}) => poi.id === data.id)['details'] = data;
}

function addPOI(id, visitDuration)
{
    if(!addedPOIs.find( ({poi}) => poi.id === id))
    {
        addLoadingNotSaved();

        let el = addedMarkers.find( ({poi}) => poi.id === id);
        let markerDivEl = document.getElementById(`poi_marker_${id}`);

        let indexOfAdded = addedPOIs.push(el) - 1;
        addedPOIs[indexOfAdded]['visitDuration'] = visitDuration;

        el['marker']._element.classList.add('z-20');

        const div = document.createElement('div');
        div.className = 'w-full relative w-full flex flex-col items-center mt-2';
        div.id = `poiAdded_${id}`;

        if(currentSelectedDay === null)
        {
            el['colour'] = '#22d625';
            markerDivEl.style.boxShadow = `0 0 0 3px ${el['colour']}`;

            div.innerHTML = `
                <div :class="{'hover:border-transparent border-transparent transform scale-100 -translate-y-1 transition ease-out duration-500 bg-white shadow-lg': selected === '${id}' && accommodation !== '${id}',
                     'transform scale-95 -translate-y-0 transition ease-out duration-500 border-gray-200 hover:border-gray-400': selected !== '${id}' || accommodation === '${id}'}"
                     class="w-11/12 z-10 group rounded-xl border-2 bg-gray-50 cursor-pointer select-none flex flex-row justify-between text-white"
                        style="background-image: url(${el['details'].photoPrefix}${500}${el['details'].photoSuffix});
                        background-position: center; background-repeat: no-repeat; background-size: cover;">
                    <div x-show="accommodation !== '${id}'"
                         style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;" 
                         class="absolute flex flex-row items-center select-none">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p id="poiVisitDurationText_${id}">
                            ${visitDuration}
                        </p>
                    </div>
                    <div id="poiWarningMessage_${id}"
                         style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;"
                         class="absolute top-1.5 right-0.5 text-red-600 bg-white rounded-full hidden
                                flex flex-row items-center select-none transform animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <button type="button" class="flex-grow min-w-0 p-7 text-left focus:outline-none"
                        @click="if(accommodation !== '${id}') selected !== '${id}' ? selected = '${id}' : selected = null">
                        <p class="text-2xl font-bold leading-tight truncate"
                            style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                            ${el['poi'].name}
                        </p>
                    </button>
                    <button type="button" x-show="'${el.details.type.replace(/['"]+/g, '')}' === 'Hotel'" id="poiAccommodation_${id}"
                            :class="{'active text-green-500 scale-125' : accommodation === '${id}'}"
                            class="p-4 focus:outline-none transform hover:scale-125 hover:text-green-500 transition ease-in-out duration-500"
                            onclick="addLoadingNotSaved()"
                            @click="if(accommodation === '${id}') {accommodation = null; selected = '${id}';} 
                                    else {accommodation = '${id}'; selected = null;}">
                        <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1
                           1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </button>
                    <button type="button" onclick="removePOI(\`${id}\`)" @click="if(accommodation === '${id}') {accommodation = null;}"
                            class="p-4 text-white focus:outline-none transform hover:scale-125 hover:text-red-500 transition ease-in-out duration-500">
                            <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                    </button>
                </div>
                <div class="w-10/12 transform z-0 -translate-y-1 items-center relative
                     overflow-hidden transition-all max-h-0 ease-in-out duration-500" id="poiVisitDurationParent_${id}"
                     x-ref="poiVisitDurationParent_${id}"
                     x-bind:style="selected === '${id}' && accommodation !== '${id}' ?
                     'max-height: ' + $refs.poiVisitDurationParent_${id}.scrollHeight + 'px' : ''">
                    <div class="flex flex-col p-5 bg-white border-l-2 border-r-2 border-b-2 rounded-b-xl items-center" id="poiVisitDurationContainer_${id}">
                        <div class="w-full flex items-center justify-start">
                            <label class="pr-4 tracking-tight text-gray-500" for="poiVisitDurationInput_${id}">Duration:</label>
                            <input class="w-full shadow appearance-none border rounded py-2 px-2 text-grey-darker
                            focus:outline-none focus:ring" type="text" id="poiVisitDurationInput_${id}"
                            name="poiVisitDurationInput_${id}" pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" value="${visitDuration}"
                            @click.away="verifyDurationInput('poiVisitDurationInput_${id}')"/>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById("daysPoisContainer").appendChild(div);

            verifyIntervalAcceptance(id, visitDuration);
        }
        else
        {
            el['colour'] = currentSelectedDay.colour;
            markerDivEl.style.boxShadow = `0 0 0 3px ${el['colour']}`;

            let poiHoursInfo = el.details.poiHours.find( ({dayNumber}) => dayNumber === currentSelectedDay.dayNumber);
            let openingAt = null;
            let closingAt = null;
            let poiWarningMessage = true;

            if(poiHoursInfo)
            {
                openingAt = poiHoursInfo.openingAt.split(':')[0] + ':' + poiHoursInfo.openingAt.split(':')[1];
                closingAt = poiHoursInfo.closingAt.split(':')[0] + ':' + poiHoursInfo.closingAt.split(':')[1];

                let currentPoiOpening = parseInt(openingAt.split(':')[0]) * 60 + parseInt(openingAt.split(':')[1]);
                let currentPoiClosing = parseInt(closingAt.split(':')[0]) * 60 + parseInt(closingAt.split(':')[1]);
                let currentVisitDuration = parseInt(visitDuration.split(':')[0]) * 60 + parseInt(visitDuration.split(':')[1]);
                if(currentPoiClosing < currentPoiOpening)
                {
                    currentPoiClosing = 1439;
                }

                poiWarningMessage = !((currentPoiOpening <= currentSelectedDay.dayStart && currentPoiClosing >= currentSelectedDay.dayEnd) ?
                    (currentSelectedDay.dayEnd - currentSelectedDay.dayStart >= currentVisitDuration ? true : false) :
                    (currentPoiOpening >= currentSelectedDay.dayStart && currentPoiClosing <= currentSelectedDay.dayEnd) ?
                        (currentPoiClosing - currentPoiOpening >= currentVisitDuration ? true : false) :
                        (currentPoiOpening <= currentSelectedDay.dayStart && currentPoiClosing <= currentSelectedDay.dayEnd) ?
                            (currentPoiClosing - currentSelectedDay.dayStart >= currentVisitDuration ? true : false) :
                            (currentPoiOpening >= currentSelectedDay.dayStart && currentPoiClosing >= currentSelectedDay.dayEnd) ?
                                (currentSelectedDay.dayEnd - currentPoiOpening >= currentVisitDuration ? true : false) : false);
            }

            div.innerHTML = `
                <div class="w-full z-10 flex flex-row rounded-xl text-white overflow-hidden relative"
                     style="background-image: url(${el['details'].photoPrefix}${500}${el['details'].photoSuffix});
                     background-position: center; background-repeat: no-repeat; background-size: cover;">
                    <div style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;" 
                         class="absolute flex flex-row items-center select-none">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p id="poiVisitDurationText_${id}">
                            ${visitDuration}
                        </p>
                    </div>
                    <div id="poiWarningMessage_${id}"
                         style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;"
                         class="absolute top-1.5 right-0.5 text-red-600 bg-white rounded-full ${poiWarningMessage ? '' : 'hidden'}
                                flex flex-row items-center select-none transform animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <button type="button" class="flex-grow min-w-0 p-4 text-left focus:outline-none"
                        @click="selected !== '${id}' ? selected = '${id}' : selected = null">
                        <p class="text-2xl font-bold leading-tight truncate"
                            style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                            ${el['poi'].name}
                        </p>
                        <p class="truncate" style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;">
                            ${openingAt} - ${closingAt}
                        </p>
                    </button>
                    <button type="button" onclick="removePOI(\`${id}\`)"
                            class="p-4 text-white focus:outline-none transform hover:scale-125 hover:text-red-500 transition ease-in-out duration-500">
                            <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                    </button>
                </div>
                <div class="w-10/12 transform z-0 -translate-y-1 items-center relative
                     overflow-hidden transition-all max-h-0 ease-in-out duration-500" id="poiVisitDurationParent_${id}"
                     x-ref="poiVisitDurationParent_${id}"
                     x-bind:style="selected === '${id}' ?
                     'max-height: ' + $refs.poiVisitDurationParent_${id}.scrollHeight + 'px' : ''">
                    <div class="flex flex-col p-5 bg-white border-l-2 border-r-2 border-b-2 rounded-b-xl items-center" id="poiVisitDurationContainer_${id}">
                        <div class="w-full flex items-center justify-start">
                            <label class="pr-4 tracking-tight text-gray-500" for="poiVisitDurationInput_${id}">Duration:</label>
                            <input class="w-full shadow appearance-none border rounded py-2 px-2 text-grey-darker
                            focus:outline-none focus:ring" type="text" id="poiVisitDurationInput_${id}"
                            name="poiVisitDurationInput_${id}" pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" value="${visitDuration}"
                            @click.away="verifyDurationInput('poiVisitDurationInput_${id}')"/>
                        </div>
                    </div>
                </div>
            `;

            let poiContainer = document.getElementById(`poiContainer_${currentSelectedDay.id}`);
            let poiContainerParent = document.getElementById(`poiContainerParent_${currentSelectedDay.id}`);

            if(poiContainer.childNodes.length === 1 && poiContainer.childNodes[0].nodeType === Node.TEXT_NODE)
            {
                poiContainer.innerHTML = "";
                poiContainer.appendChild(div);
                poiContainerParent.style.maxHeight = poiContainerParent.scrollHeight > 0 ? poiContainerParent.scrollHeight + 'px' :
                    poiContainer.childElementCount * 150 + 'px';
            }
            else
            {
                poiContainer.appendChild(div);
                poiContainerParent.style.maxHeight = poiContainerParent.scrollHeight > 0 ? poiContainerParent.scrollHeight + 'px' :
                    poiContainer.childElementCount * 150 + 'px';
            }

            document.getElementById(`poiVisitDurationParent_${id}`).addEventListener('transitionstart', () => {
                if(document.getElementById(`poiAdded_${id}`))
                {
                    const calc = parseInt(poiContainerParent.style.maxHeight.replace('px','')) +
                        parseInt(document.getElementById(`poiVisitDurationParent_${id}`).style.maxHeight.replace('px',''));

                    if(calc)
                        poiContainerParent.style.maxHeight = calc + 'px';
                }
            });

            addedPOIs[indexOfAdded]['day'] = currentSelectedDay.id;

            let totalDayVisitDurations = 0;
            addedPOIs.forEach(function(addedPOI) {
               if(('day' in addedPOI) && addedPOI.day === currentSelectedDay.id)
               {
                   let formattedPoiVisitDuration = parseInt(addedPOI.visitDuration.split(':')[0]) * 60
                       + parseInt(addedPOI.visitDuration.split(':')[1]);

                   totalDayVisitDurations += formattedPoiVisitDuration;
               }

               if(!('day' in addedPOI))
               {
                   verifyIntervalAcceptance(addedPOI.poi.id, addedPOI.visitDuration);
               }
            });

            if(currentSelectedDay.dayEnd - currentSelectedDay.dayStart < totalDayVisitDurations)
            {
                document.getElementById(`dayWarningMessage_${currentSelectedDay.id}`).classList.remove('hidden');
            }
        }

        let currentAddedPoi = addedPOIs[indexOfAdded];
        document.getElementById(`poiVisitDurationInput_${id}`).addEventListener('input', () => {
            addLoadingNotSaved();

            let input = document.getElementById(`poiVisitDurationInput_${id}`);

            if(!input.validity.valid || input.value.length === 0)
            {
                input.classList.remove('focus:ring-green-400');
                input.classList.add('focus:ring-red-400');

                currentAddedPoi.visitDuration = '1:00';
                document.getElementById(`poiVisitDurationText_${id}`).innerText = '1:00';
            }
            else
            {
                input.classList.remove('focus:ring-red-400');
                input.classList.add('focus:ring-green-400');

                currentAddedPoi.visitDuration = input.value;
                document.getElementById(`poiVisitDurationText_${id}`).innerText = input.value;
            }

            if('day' in currentAddedPoi)
            {
                let dayOfPoi = addedDays.find( ({id}) => id === currentAddedPoi.day);
                let poiHoursInfo = el.details.poiHours.find( ({dayNumber}) => dayNumber === dayOfPoi.dayNumber);
                let openingAt = null;
                let closingAt = null;
                let poiWarningMessage = true;

                if(poiHoursInfo)
                {
                    openingAt = poiHoursInfo.openingAt.split(':')[0] + ':' + poiHoursInfo.openingAt.split(':')[1];
                    closingAt = poiHoursInfo.closingAt.split(':')[0] + ':' + poiHoursInfo.closingAt.split(':')[1];

                    let currentPoiOpening = parseInt(openingAt.split(':')[0]) * 60 + parseInt(openingAt.split(':')[1]);
                    let currentPoiClosing = parseInt(closingAt.split(':')[0]) * 60 + parseInt(closingAt.split(':')[1]);
                    let currentVisitDuration = parseInt(currentAddedPoi.visitDuration.split(':')[0]) * 60
                        + parseInt(currentAddedPoi.visitDuration.split(':')[1]);
                    if(currentPoiClosing < currentPoiOpening)
                    {
                        currentPoiClosing = 1439;
                    }

                    poiWarningMessage = !((currentPoiOpening <= dayOfPoi.dayStart && currentPoiClosing >= dayOfPoi.dayEnd) ?
                        (dayOfPoi.dayEnd - dayOfPoi.dayStart >= currentVisitDuration ? true : false) :
                        (currentPoiOpening >= dayOfPoi.dayStart && currentPoiClosing <= dayOfPoi.dayEnd) ?
                            (currentPoiClosing - currentPoiOpening >= currentVisitDuration ? true : false) :
                            (currentPoiOpening <= dayOfPoi.dayStart && currentPoiClosing <= dayOfPoi.dayEnd) ?
                                (currentPoiClosing - dayOfPoi.dayStart >= currentVisitDuration ? true : false) :
                                (currentPoiOpening >= dayOfPoi.dayStart && currentPoiClosing >= dayOfPoi.dayEnd) ?
                                    (dayOfPoi.dayEnd - currentPoiOpening >= currentVisitDuration ? true : false) : false);
                    let warningDiv = document.getElementById(`poiWarningMessage_${id}`);

                    if(poiWarningMessage)
                    {
                        warningDiv.classList.remove('hidden');
                    }
                    else
                    {
                        warningDiv.classList.add('hidden');
                    }
                }

                let totalDayVisitDurations = 0;
                addedPOIs.forEach(function(addedPOI) {
                    if(('day' in addedPOI) && addedPOI.day === dayOfPoi.id)
                    {
                        let formattedPoiVisitDuration = parseInt(addedPOI.visitDuration.split(':')[0]) * 60
                            + parseInt(addedPOI.visitDuration.split(':')[1]);

                        totalDayVisitDurations += formattedPoiVisitDuration;
                    }

                    if(!('day' in addedPOI))
                    {
                        verifyIntervalAcceptance(addedPOI.poi.id, addedPOI.visitDuration);
                    }
                });

                if(dayOfPoi.dayEnd - dayOfPoi.dayStart < totalDayVisitDurations)
                {
                    document.getElementById(`dayWarningMessage_${dayOfPoi.id}`).classList.remove('hidden');
                }
                else
                {
                    document.getElementById(`dayWarningMessage_${dayOfPoi.id}`).classList.add('hidden');
                }
            }
            else
            {
                verifyIntervalAcceptance(currentAddedPoi.poi.id, currentAddedPoi.visitDuration);
            }
        });
    }
}

function verifyIntervalAcceptance(id, visitDuration)
{
    let el = addedMarkers.find( ({poi}) => poi.id === id);
    let poiWarningMessage = true;

    for(let i = 0; i < addedDays.length; i++)
    {
        let poiHoursInfo = el.details.poiHours.find( ({dayNumber}) => dayNumber === addedDays[i].dayNumber);
        let openingAt = null;
        let closingAt = null;
        let firstCheck = true;

        if(poiHoursInfo)
        {
            openingAt = poiHoursInfo.openingAt.split(':')[0] + ':' + poiHoursInfo.openingAt.split(':')[1];
            closingAt = poiHoursInfo.closingAt.split(':')[0] + ':' + poiHoursInfo.closingAt.split(':')[1];

            let currentPoiOpening = parseInt(openingAt.split(':')[0]) * 60 + parseInt(openingAt.split(':')[1]);
            let currentPoiClosing = parseInt(closingAt.split(':')[0]) * 60 + parseInt(closingAt.split(':')[1]);
            let currentVisitDuration = parseInt(visitDuration.split(':')[0]) * 60 + parseInt(visitDuration.split(':')[1]);
            if(currentPoiClosing < currentPoiOpening)
            {
                currentPoiClosing = 1439;
            }

            firstCheck = !((currentPoiOpening <= addedDays[i].dayStart && currentPoiClosing >= addedDays[i].dayEnd) ?
                (addedDays[i].dayEnd - addedDays[i].dayStart >= currentVisitDuration ? true : false) :
                (currentPoiOpening >= addedDays[i].dayStart && currentPoiClosing <= addedDays[i].dayEnd) ?
                    (currentPoiClosing - currentPoiOpening >= currentVisitDuration ? true : false) :
                    (currentPoiOpening <= addedDays[i].dayStart && currentPoiClosing <= addedDays[i].dayEnd) ?
                        (currentPoiClosing - addedDays[i].dayStart >= currentVisitDuration ? true : false) :
                        (currentPoiOpening >= addedDays[i].dayStart && currentPoiClosing >= addedDays[i].dayEnd) ?
                            (addedDays[i].dayEnd - currentPoiOpening >= currentVisitDuration ? true : false) : false);
        }

        if(!firstCheck)
        {
            let totalDayVisitDurations = parseInt(visitDuration.split(':')[0]) * 60 + parseInt(visitDuration.split(':')[1]);
            addedPOIs.forEach(function(addedPOI) {
                if(('day' in addedPOI) && addedPOI.day === addedDays[i].id)
                {
                    let formattedPoiVisitDuration = parseInt(addedPOI.visitDuration.split(':')[0]) * 60
                        + parseInt(addedPOI.visitDuration.split(':')[1]);

                    totalDayVisitDurations += formattedPoiVisitDuration;
                }
            });

            if(addedDays[i].dayEnd - addedDays[i].dayStart >= totalDayVisitDurations)
            {
                poiWarningMessage = false;
                break;
            }
        }
    }

    let warningDiv = document.getElementById(`poiWarningMessage_${id}`);

    if(poiWarningMessage)
    {
        warningDiv.classList.remove('hidden');
    }
    else
    {
        warningDiv.classList.add('hidden');
    }
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

function removePOI(id)
{
    addLoadingNotSaved();

    if(currentShownPopUp !== null && id === currentShownPopUp.poiId)
    {
        currentShownPopUp.marker._element.style.zIndex = currentShownPopUp.markerZIndex;
        currentShownPopUp.marker._element.classList.add("bring-to-front");
        currentShownPopUp.markerDivEl.innerHTML = '';
        currentShownPopUp.markerDivEl.style.backgroundImage = currentShownPopUp.markerDivElBgImage;
        currentShownPopUp.markerDivEl.classList.remove('scale-125', 'bg-white');
        currentShownPopUp.markerDivEl.classList.add('bg-indigo-400');
        currentShownPopUp.marker.togglePopup();

        currentShownPopUp = null;
    }

    const poi = addedPOIs.find( ({poi}) => poi.id === id);
    const indexOfPoi = addedPOIs.findIndex(function(poi) { return poi.poi.id === id});

    document.getElementById(`poiAdded_${id}`).remove();

    let el = addedMarkers.find( ({poi}) => poi.id === id);
    delete el['colour'];
    el['marker']._element.classList.remove('z-20');
    el['marker']._element.classList.add('z-10');

    recalculateColours(el);

    if('day' in addedPOIs[indexOfPoi])
    {
        let poiContainer = document.getElementById(`poiContainer_${addedPOIs[indexOfPoi]['day']}`);
        let dayOfPoi = addedDays.find( ({id}) => id === addedPOIs[indexOfPoi]['day']);

        if(poiContainer.childNodes.length === 0)
        {
            poiContainer.innerText = 'No locations have been added';
        }

        delete addedPOIs[indexOfPoi].day;

        let totalDayVisitDurations = 0;
        addedPOIs.forEach(function(addedPOI) {
            if(('day' in addedPOI) && addedPOI.day === dayOfPoi.id)
            {
                let formattedPoiVisitDuration = parseInt(addedPOI.visitDuration.split(':')[0]) * 60
                    + parseInt(addedPOI.visitDuration.split(':')[1]);

                totalDayVisitDurations += formattedPoiVisitDuration;
            }

            if(!('day' in addedPOI) && addedPOI.poi.id !== addedPOIs[indexOfPoi].poi.id)
            {
                verifyIntervalAcceptance(addedPOI.poi.id, addedPOI.visitDuration);
            }
        });

        if(dayOfPoi.dayEnd - dayOfPoi.dayStart >= totalDayVisitDurations)
        {
            document.getElementById(`dayWarningMessage_${dayOfPoi.id}`).classList.add('hidden');
        }
    }

    addedPOIs.splice(indexOfPoi, 1);
}

function recalculateColours(el)
{
    if(('colour' in el))
    {
        document.getElementById(`poi_marker_${el.poi.id}`).style.boxShadow = `0 0 0 3px ${el['colour']}`;
    }
    else
    {
        document.getElementById(`poi_marker_${el.poi.id}`).style.boxShadow = '';
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
                addPoiMarker(poi, false);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function addPoiMarker(poi, top)
{
    if(!addedMarkers.some(e => e.poi.id === poi.id))
    {
        let el = document.createElement('div');

        if(top)
        {
            el.className = "z-20 bring-to-front";
        }
        else
        {
            el.className = "z-10 bring-to-front";
        }

        let filterValue = document.getElementById('filterInput').value.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let formattedType = poi.type.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if(!formattedType.includes(filterValue))
        {
            if(!el.classList.contains('hidden'))
            {
                el.classList.add('hidden');
            }
        }

        el.innerHTML = `
            <div style="background-image: url(${poi.iconPrefix}${64}${poi.iconSuffix}); width: 32px; height: 32px; background-size: cover;"
                 class="block bg-indigo-400 shadow-md rounded-full p-0 border-none cursor-pointer transform transition hover:scale-125 duration-500"
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

        if('poiHours' in poi)
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
        let poiId = poi.id;
        let el = addedMarkers.find( ({poi}) => poi.id === poiId);

        if( ('poiHours' in poi) && !('details' in el))
        {
            el['details'] = poi;
        }
    }
}

function addDayElement(id, dayName, date, dayStart, dayEnd, colour)
{
    const div = document.createElement('div');
    document.getElementById("createItineraryButton").classList.remove("hidden");

    div.className = 'relative w-full flex flex-col items-center';
    div.id = 'day_' + id
    div.innerHTML = `
        <div :class="{'hover:border-transparent border-transparent transform scale-100 -translate-y-1 transition ease-out duration-500 bg-white shadow-lg': selected === ${id},
             'transform scale-95 -translate-y-0 transition ease-out duration-500 border-gray-200 hover:border-gray-400': selected !== ${id}}"
             class="w-11/12 z-10 group rounded-xl border-2 bg-gray-50 mt-3 cursor-pointer select-none flex flex-row justify-between">
            <div style="background-color: ${colour};" class="absolute top-1 left-1 rounded-full w-3 h-3"></div>
            <div id="dayWarningMessage_${id}"
                 style="text-shadow: #000 0px 0px 5px; -webkit-font-smoothing: antialiased;"
                 class="absolute top-1.5 right-0.5 text-red-600 bg-gray-50 rounded-full hidden
                        flex flex-row items-center select-none transform animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <button type="button" class="flex-grow min-w-0 p-6 text-left text-gray-500 leading-tight focus:outline-none"
                @click="selected !== ${id} ? selected = ${id} : selected = null;
                selected === ${id} ? currentSelectedDay = addedDays.find( ({id}) => id === ${id}) : currentSelectedDay = null;">
                <p :class="{'text-indigo-400': selected === ${id}}"
                   class="font-bold group-hover:text-indigo-400 truncate">
                    ${dayName}, ${date}
                </p>
                <p class="truncate">
                    ${dayStart} - ${dayEnd}
                </p>
            </button>
            <button x-show="selected !== ${id}"
                onclick="removeDayElement(${id})" 
                class="p-6 text-gray-500 focus:outline-none transform hover:scale-125 hover:text-red-500 transition ease-in-out duration-500">
                <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            <div x-show="selected === ${id}" class="p-6 text-green-400 rounded-xl flex flex-row items-center">
                <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
        <div class="w-10/12 transform z-0 -translate-y-1 items-center relative
             overflow-hidden transition-all max-h-0 ease-in-out duration-500" id="poiContainerParent_${id}"
             x-ref="dayContainer_${id}"
             x-bind:style="selected == ${id} ? 'max-height: ' + $refs.dayContainer_${id}.scrollHeight + 'px' : ''">
            <div class="flex flex-col p-5 bg-white border-l-2 border-r-2 border-b-2 rounded-b-xl items-center"
                 id="poiContainer_${id}" x-data="{selected: null}">
                No locations have been added
            </div>
        </div>
      `;

    let children = document.getElementById("daysPoisContainer").children;
    let toInsertBefore = null;

    for (let i = 0; i < children.length; i++) {
        let child = children[i];

        if(child.id.split("_")[0] === 'poiAdded')
        {
            toInsertBefore = child;
            break;
        }
    }

    if(toInsertBefore !== null)
    {
        document.getElementById('daysPoisContainer').insertBefore(div, toInsertBefore);
    }
    else
    {
        document.getElementById('daysPoisContainer').appendChild(div);
    }

    addedPOIs.forEach(function(addedPOI) {
       if(!('day' in addedPOI))
       {
           verifyIntervalAcceptance(addedPOI.poi.id, addedPOI.visitDuration);
       }
    });
}

function removeDayElement(id)
{
    addLoadingNotSaved();

    for(let i = addedPOIs.length - 1; i >= 0; i--)
    {
        if(('day' in addedPOIs[i]) && addedPOIs[i]['day'] === id)
        {
            removePOI(addedPOIs[i].poi.id);
        }
    }

    const index = addedDays.findIndex(function(day) { return day.id === id});
    let dayRet = addedDays[index];

    document.getElementById('day_' + id).remove();

    if(index > -1)
        addedDays.splice(index, 1);

    if(addedDays.length <= 0)
    {
        document.getElementById("createItineraryButton").classList.add("hidden");
    }

    addedPOIs.forEach(function(addedPOI) {
        if(!('day' in addedPOI))
        {
            verifyIntervalAcceptance(addedPOI.poi.id, addedPOI.visitDuration);
        }
    });
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
            let children = document.getElementById("daysPoisContainer").children;
            let highestId = -1;

            for (let i = 0; i < children.length; i++) {
                let child = children[i];

                if(child.id.split("_")[0] === 'day' && child.id.split("_")[1] > highestId)
                {
                    highestId = child.id.split("_")[1];
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
                colour: colour
            });

            addDayElement(highestId, days[selectedDate.getDay()], dateFormatted[1] + '/' + dateFormatted[2] + "/" + dateFormatted[0],
                displayTimeStart.value, displayTimeEnd.value, colour);
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
    let pathArray = window.location.pathname.split('/');

    const url = `http://localhost:8080/planner/solve/unrestricted/${pathArray[2]}`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleToSend)
    })
        .then(response => response.json())
        .then(data => {
            currentBounds = {
                coords: [[map.getBounds()._ne.lng, map.getBounds()._ne.lat],
                    [map.getBounds()._sw.lng, map.getBounds()._sw.lat]],
                zoom: map.getZoom()
            };
            let filterInput = document.getElementById('filterInput');
            filterInput.classList.add('hidden');
            filterInput.value = '';
            filterInput.dispatchEvent(new Event('keyup'));

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
        let viewConstraintsDiv = document.getElementById("viewConstraintsContainer");
        viewConstraintsDiv.classList.remove("hidden");
        viewConstraintsDiv.__x.$data.constraints = data.constraints;

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

    if(switchTab)
    {
        document.getElementById("tabsContainer").__x.$data.tab = 'itinerary';

        if(currentShownPopUp !== null)
        {
            currentShownPopUp.marker._element.style.zIndex = currentShownPopUp.markerZIndex;
            currentShownPopUp.marker._element.classList.add("bring-to-front");
            currentShownPopUp.markerDivEl.innerHTML = '';
            currentShownPopUp.markerDivEl.style.backgroundImage = currentShownPopUp.markerDivElBgImage;
            currentShownPopUp.markerDivEl.classList.remove('scale-125', 'bg-white');
            currentShownPopUp.markerDivEl.classList.add('bg-indigo-400');
            currentShownPopUp.marker.togglePopup();

            currentShownPopUp = null;
        }
    }
}

function addShareButtons(path)
{
    let div = document.createElement('div');

    div.className = 'flex flex-col border-2 rounded-xl w-11/12 transform scale-95 group hover:border-gray-400 transition ease-out duration-500';
    div.id = 'itineraryShareContainer';
    div.innerHTML = `
        <div class="font-bold leading-tight flex flex-row justify-between items-center">
            <div class="p-3 min-w-0 flex flex-row items-center justify-center text-gray-500 group-hover:text-indigo-400">
                <svg class="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886
                   12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632
                   3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0
                   105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <p class="truncate">
                    Share your itinerary
                </p>
            </div>
            <div class="flex flex-row items-center justify-center p-3">
                <a class="px-1 transform hover:scale-125 transition ease-out duration-500"
                    href="https://facebook.com/sharer/sharer.php?u=http%3A%2F%2Flocalhost%3A8080%2Fitinerary%2F${path}"
                    target="_blank" rel="noopener" aria-label="">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path style="fill: #3c4cdd" d="M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38 12-12S18.62 0
                         12 0zm3.6 11.5h-2.1v7h-3v-7h-2v-2h2V8.34c0-1.1.35-2.82
                         2.65-2.82h2.35v2.3h-1.4c-.25 0-.6.13-.6.66V9.5h2.34l-.24 2z"/>
                    </svg>
                </a>
                <a class="px-1 transform hover:scale-125 transition ease-out duration-500"
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
                <a class="px-1 transform hover:scale-125 transition ease-out duration-500"
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
         focus:outline-none truncate text-center bg-indigo-100 bg-opacity-40 group-hover:bg-opacity-80"
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

function getPhotoData(id)
{
    let el = addedMarkers.find( ({poi}) => poi.id === id);

    return {
        activeSlide: el.details.poiPhotos[0],
        slides: el.details.poiPhotos
    }
}

function addPOIToItinerary(poiInfo, dayId, addInfoToNext, accommodationTimeInfo)
{
    let el = addedMarkers.find( ({poi}) => poi.id === poiInfo.poiId);

    const div = document.createElement('div');

    div.className = 'w-full border border-gray-300 rounded-xl mt-2';
    div.id = `poi_${poiInfo.poiId}_day_${dayId}_itinerary` + (accommodationTimeInfo !== null ? '_' + accommodationTimeInfo[0] : '');
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
            <button type="button"
                    id="poi_${poiInfo.poiId}_day_${dayId}_itineraryPhotoButton${accommodationTimeInfo !== null ? '_' + accommodationTimeInfo[0] : ''}"
                    class="p-4 text-white focus:outline-none transform hover:scale-125 hover:text-green-500
                           transition ${el.details.poiPhotos.length > 0 ? '' : 'hidden'} ease-in-out duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" 
                     viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                     stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <line x1="15" y1="6" x2="15.01" y2="6"></line>
                    <rect x="3" y="3" width="18" height="14" rx="3"></rect>
                    <path d="M3 13l4 -4a3 5 0 0 1 3 0l4 4"></path>
                    <path d="M13 12l2 -2a3 5 0 0 1 3 0l3 3"></path>
                    <line x1="8" y1="21" x2="8.01" y2="21"></line>
                    <line x1="12" y1="21" x2="12.01" y2="21"></line>
                    <line x1="16" y1="21" x2="16.01" y2="21"></line>
                </svg>
            </button>
            <div class="pb-7 pr-7 pt-7 pl-2 text-white rounded-lg ${accommodationTimeInfo !== null ? '' : 'hidden'} flex flex-col justify-center">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1
                   1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </div>
        </div>
    `;

    document.getElementById(`poiContainerItinerary_${dayId}`).appendChild(div);

    const divGallery = document.createElement('div');
    divGallery.innerHTML = `
        <div style="height: 90%;" class="w-full flex flex-col justify-center items-center">
            <div class="w-full h-full p-10 relative"
                 x-data="getPhotoData('${poiInfo.poiId}')">

                <template x-for="slide in slides" :key="slide">
                    <div x-show="activeSlide === slide"
                         class="font-bold text-5xl h-full flex items-center justify-center bg-transparent text-white
                                rounded-lg relative">
                        <img :src="slide.prefix + 'width960' + slide.suffix" class="w-full h-full rounded-2xl object-cover">
                        <div class="absolute top-2 right-2.5 text-lg text-gray-500 font-bold bg-white bg-opacity-80 rounded-xl p-3">
                            <span x-text="(slides.indexOf(slide) + 1) + '/' + (slides.length)"></span>
                        </div>
                    </div>
                </template>
    
                <div class="absolute inset-10 flex">
                    <div class="flex items-center justify-start w-1/2">
                        <button class="bg-indigo-400 text-white font-bold hover:shadow-lg
                                       border-none rounded-full w-12 h-12 -ml-6 flex items-center justify-center focus:outline-none"
                                x-on:click="activeSlide = slides.indexOf(activeSlide) === 0 ? slides[slides.length - 1]:
                                            slides[slides.indexOf(activeSlide) - 1]">
                            <p class="w-full h-full transform duration-500 hover:-translate-x-1
                                      flex items-center justify-center">
                                &#10094;
                            </p>
                        </button>
                    </div>
                    <div class="flex items-center justify-end w-1/2">
                        <button class="bg-indigo-400 text-white font-bold hover:shadow-lg
                                       rounded-full w-12 h-12 -mr-6 flex items-center justify-center focus:outline-none"
                                x-on:click="activeSlide = slides.indexOf(activeSlide) === slides.length - 1 ? slides[0]:
                                            slides[slides.indexOf(activeSlide) + 1]">
                            <p class="w-full h-full transform duration-500 hover:translate-x-1
                                      flex items-center justify-center">
                                &#10095;
                            </p>
                        </button>
                    </div>        
                </div>

                <div class="w-full flex items-center justify-center px-20">
                    <template x-for="slide in slides" :key="slide">
                        <button class="flex-1 w-4 h-2 mt-4 mx-2 mb-0 rounded-full overflow-hidden focus:outline-none
                                       transition-colors duration-200 ease-out hover:bg-indigo-600 hover:shadow-lg"
                                :class="{'bg-indigo-600': activeSlide === slide,
                                         'bg-indigo-300': activeSlide !== slide}" 
                                x-on:click="activeSlide = slide">
                        </button>
                    </template>
                </div>
            </div>
        </div>
    `;

    document.getElementById(`poi_${poiInfo.poiId}_day_${dayId}_itineraryPhotoButton`
        + (accommodationTimeInfo !== null ? '_' + accommodationTimeInfo[0] : ''))
        .addEventListener("click", function () {
            document.getElementById("viewItineraryGalleryElementsContainer").innerHTML = '';
            document.getElementById("viewItineraryGalleryElementsContainer").appendChild(divGallery);
            document.getElementById("viewItineraryGalleryName").innerHTML = '';
            document.getElementById("viewItineraryGalleryName").innerHTML = el['poi'].name + " Gallery";
            document.getElementById("viewItineraryGalleryContainer").__x.$data.open = true;
        });

    if(addInfoToNext)
    {
        const distanceDiv = document.createElement('div');

        distanceDiv.className = 'w-full mt-5 mb-5 border-l-4 border-dotted border-gray-500 ml-5';
        distanceDiv.id = `poi_${poiInfo.poiId}_day_${dayId}_itineraryDistance` + (accommodationTimeInfo !== null ? '_' + accommodationTimeInfo[0] : '');
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

            document.getElementById(`poi_${poiInfo.poiId}_day_${dayId}_itineraryDistance`
                + (accommodationTimeInfo !== null ? '_' + accommodationTimeInfo[0] : '')).appendChild(waitingDiv);
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
        el.classList.add('z-30');
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
            el.classList.remove('z-30');
            if('colour' in el)
            {
                el.classList.add('z-20');
            }
            else
            {
                el.classList.add('z-10');
            }

            let markerDivEl = document.getElementById(`poi_marker_${currentShownRoute[i].id}`);
            markerDivEl.innerHTML = '';
            markerDivEl.style.backgroundImage = currentShownRoute[i].backgroundImage;
            markerDivEl.style.boxShadow = currentShownRoute[i].boxShadow;

            let poi = addedMarkers.find( ({poi}) => poi.id === currentShownRoute[i].id);

            recalculateColours(poi);

            for(let j = 0; j < currentShownRoute[i].arrows.length; j++)
            {
                currentShownRoute[i].arrows[j].remove();
            }
        }

        map.fitBounds(currentBounds.coords);
    }
}

document.getElementById("plannerTabButton").addEventListener("click", function() {
    document.getElementById("itineraryContainer").__x.$data.selected = null;
    document.getElementById('filterInput').classList.remove('hidden');

    if(currentShownPopUp !== null)
    {
        currentShownPopUp.marker._element.style.zIndex = currentShownPopUp.markerZIndex;
        currentShownPopUp.marker._element.classList.add("bring-to-front");
        currentShownPopUp.markerDivEl.innerHTML = '';
        currentShownPopUp.markerDivEl.style.backgroundImage = currentShownPopUp.markerDivElBgImage;
        currentShownPopUp.markerDivEl.classList.remove('scale-125', 'bg-white');
        currentShownPopUp.markerDivEl.classList.add('bg-indigo-400');
        currentShownPopUp.marker.togglePopup();

        currentShownPopUp = null;
    }
});

document.getElementById("itineraryTab").addEventListener("click", function () {
    currentBounds = {
        coords: [[map.getBounds()._ne.lng, map.getBounds()._ne.lat],
            [map.getBounds()._sw.lng, map.getBounds()._sw.lat]],
        zoom: map.getZoom()
    };
    let filterInput = document.getElementById('filterInput');
    filterInput.classList.add('hidden');
    filterInput.value = '';
    filterInput.dispatchEvent(new Event('keyup'));

    if(currentShownPopUp !== null)
    {
        currentShownPopUp.marker._element.style.zIndex = currentShownPopUp.markerZIndex;
        currentShownPopUp.marker._element.classList.add("bring-to-front");
        currentShownPopUp.markerDivEl.innerHTML = '';
        currentShownPopUp.markerDivEl.style.backgroundImage = currentShownPopUp.markerDivElBgImage;
        currentShownPopUp.markerDivEl.classList.remove('scale-125', 'bg-white');
        currentShownPopUp.markerDivEl.classList.add('bg-indigo-400');
        currentShownPopUp.marker.togglePopup();

        currentShownPopUp = null;
    }
})

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
    let pathArray = window.location.pathname.split('/');

    const url = `http://localhost:8080/planner/save/unrestricted/${pathArray[2]}`;
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
        scheduleDays.push({
            dayId: addedDays[i].id,
            dayName: addedDays[i].dayName,
            dayNumber: addedDays[i].dayNumber,
            date: addedDays[i].date,
            colour: addedDays[i].colour,
            dayStart: addedDays[i].dayStart,
            dayEnd: addedDays[i].dayEnd
        });
    }

    scheduleDays.sort(function(a, b)
    {
        return new Date(a.date) - new Date(b.date);
    })

    let schedulePois = [];
    let accommodationId = document.getElementById(`daysPoisContainer`).__x.$data.accommodation;
    let accommodationPoi = null;

    for(let i = 0; i < addedPOIs.length; i++)
    {
        let hours = [];

        for(let j = 0; j < addedPOIs[i].details.poiHours.length; j++)
        {
            let splittedOpeningAt = addedPOIs[i].details.poiHours[j].openingAt.split(":");
            let splittedClosingAt = addedPOIs[i].details.poiHours[j].closingAt.split(":");

            hours.push({
                dayNumber: addedPOIs[i].details.poiHours[j].dayNumber - 1,
                openingAt: splittedOpeningAt[0] + ":" + splittedOpeningAt[1],
                closingAt: splittedClosingAt[0] + ":" + splittedClosingAt[1]
            });
        }

        let poi = {
            poiId:  addedPOIs[i].poi.id,
            lat: addedPOIs[i].poi.lat,
            lng: addedPOIs[i].poi.lng,
            hours: hours,
            visitDuration: addedPOIs[i].visitDuration,
            day: ('day' in addedPOIs[i]) ? addedPOIs[i].day : null
        };

        if(accommodationId !== null && addedPOIs[i].poi.id === accommodationId)
        {
            accommodationPoi = poi;
        }
        else
        {
            schedulePois.push(poi);
        }
    }

    return {
        scheduleDays: scheduleDays,
        schedulePois: schedulePois,
        accommodationPoi: accommodationPoi
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
        <div class="p-3.5">
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

    const urlString = new URL(window.location.href);
    let lat = urlString.searchParams.get("lat") === null ? 0 : urlString.searchParams.get("lat");
    let lng = urlString.searchParams.get("lng") === null ? 0 : urlString.searchParams.get("lng");
    map.on('load', function() {
        initialPoint = [lng, lat];
        map.setCenter(initialPoint);

        let radiusPoint = [map.getBounds()._ne.lng, map.getBounds()._ne.lat];
        let radius = turf.distance([lng, lat], radiusPoint, {units: 'kilometers'});
        addPOIs(lat, lng, radius / 2);

        let filterInput = document.getElementById('filterInput');

        filterInput.addEventListener('keyup', function (e) {
            var value = e.target.value.trim().toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");;

            if(currentShownPopUp !== null)
            {
                currentShownPopUp.marker._element.style.zIndex = currentShownPopUp.markerZIndex;
                currentShownPopUp.marker._element.classList.add("bring-to-front");
                currentShownPopUp.markerDivEl.innerHTML = '';
                currentShownPopUp.markerDivEl.style.backgroundImage = currentShownPopUp.markerDivElBgImage;
                currentShownPopUp.markerDivEl.classList.remove('scale-125', 'bg-white');
                currentShownPopUp.markerDivEl.classList.add('bg-indigo-400');
                currentShownPopUp.marker.togglePopup();

                currentShownPopUp = null;
            }

            addedMarkers.forEach(function (addedMarker) {
                let el = addedMarker.marker.getElement();
                let formattedType = addedMarker.poi.type.trim().toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                if(!formattedType.includes(value))
                {
                    if(!el.classList.contains('hidden'))
                    {
                        el.classList.add('hidden');
                    }
                }
                else
                {
                    if(el.classList.contains('hidden'))
                    {
                        el.classList.remove('hidden');
                    }
                }
            });
        });
    });

    let pathArray = window.location.pathname.split('/');

    fetch(`http://localhost:8080/planner/${pathArray[2]}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(response => response.json())
        .then(data => {

            if(data.scheduleUnrestricted !== null)
            {
                let newDayButton = document.getElementById("addNewDayButton");
                let createItineraryButton = document.getElementById("createItineraryButton");
                newDayButton.disabled = true;
                createItineraryButton.disabled = true;

                let poisIds = [];
                for(let i = 0; i < data.scheduleUnrestricted.schedulePois.length; i++)
                {
                    poisIds.push(data.scheduleUnrestricted.schedulePois[i].poiId);
                }

                if(data.scheduleUnrestricted.accommodationPoi !== null)
                {
                    poisIds.push(data.scheduleUnrestricted.accommodationPoi.poiId);
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
                            addPoiMarker(poiData[i], true);
                        }

                        for(let i = 0; i < data.scheduleUnrestricted.scheduleDays.length; i++)
                        {
                            addedDays.push({id: data.scheduleUnrestricted.scheduleDays[i].dayId,
                                date: data.scheduleUnrestricted.scheduleDays[i].date,
                                dayStart: data.scheduleUnrestricted.scheduleDays[i].dayStart,
                                dayEnd: data.scheduleUnrestricted.scheduleDays[i].dayEnd,
                                dayName: data.scheduleUnrestricted.scheduleDays[i].dayName,
                                dayNumber: data.scheduleUnrestricted.scheduleDays[i].dayNumber,
                                colour: data.scheduleUnrestricted.scheduleDays[i].colour
                            });

                            let dateFormatted = data.scheduleUnrestricted.scheduleDays[i].date.split("-");
                            let dayStart = (Math.floor(data.scheduleUnrestricted.scheduleDays[i].dayStart / 60) < 10 ? '0'
                                + Math.floor(data.scheduleUnrestricted.scheduleDays[i].dayStart / 60) :
                                  Math.floor(data.scheduleUnrestricted.scheduleDays[i].dayStart / 60))
                                + ':' + (data.scheduleUnrestricted.scheduleDays[i].dayStart % 60 < 10 ? '0'
                                + data.scheduleUnrestricted.scheduleDays[i].dayStart % 60 : data.scheduleUnrestricted.scheduleDays[i].dayStart % 60);
                            let dayEnd = (Math.floor(data.scheduleUnrestricted.scheduleDays[i].dayEnd / 60) < 10 ? '0'
                                + Math.floor(data.scheduleUnrestricted.scheduleDays[i].dayEnd / 60) :
                                  Math.floor(data.scheduleUnrestricted.scheduleDays[i].dayEnd / 60))
                                + ':' + (data.scheduleUnrestricted.scheduleDays[i].dayEnd % 60 < 10 ? '0'
                                + data.scheduleUnrestricted.scheduleDays[i].dayEnd % 60 : data.scheduleUnrestricted.scheduleDays[i].dayEnd % 60);

                            addDayElement(data.scheduleUnrestricted.scheduleDays[i].dayId, data.scheduleUnrestricted.scheduleDays[i].dayName,
                                dateFormatted[1] + '/' + dateFormatted[2] + "/" + dateFormatted[0],
                                dayStart, dayEnd, data.scheduleUnrestricted.scheduleDays[i].colour);
                        }

                        if(data.scheduleUnrestricted.accommodationPoi !== null)
                        {
                            document.getElementById("daysPoisContainer").__x.$data.accommodation =
                                data.scheduleUnrestricted.accommodationPoi.poiId;

                            addPOI(data.scheduleUnrestricted.accommodationPoi.poiId,
                                   data.scheduleUnrestricted.accommodationPoi.visitDuration);
                        }

                        for(let i = 0; i < data.scheduleUnrestricted.schedulePois.length; i++)
                        {
                            if(data.scheduleUnrestricted.schedulePois[i].day !== null)
                            {
                                const dayOfPoi = addedDays.find( (day) => day.id === data.scheduleUnrestricted.schedulePois[i].day);
                                if (dayOfPoi)
                                {
                                    currentSelectedDay = dayOfPoi;
                                }
                            }

                            addPOI(data.scheduleUnrestricted.schedulePois[i].poiId,
                                   data.scheduleUnrestricted.schedulePois[i].visitDuration);

                            currentSelectedDay = null;
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