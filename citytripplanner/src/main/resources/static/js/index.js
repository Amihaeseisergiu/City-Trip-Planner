mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2VhbnQyMTciLCJhIjoiY2tsdmFyMHE0MGNubzJvbXdlYWk0MXJ2YyJ9.we4if4fwI21YHCqgBURLzQ';

let geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: 'Starting location',
    limit: 2
});

geocoder.addTo("#geocoder");

geocoder.on('result', function (e) {
    let newPlannerContainer = document.getElementById('newPlannerContainer');
    newPlannerContainer.__x.$data.place = e.result.place_name;
    newPlannerContainer.__x.$data.lng = e.result.center[0];
    newPlannerContainer.__x.$data.lat = e.result.center[1];
});

geocoder.on('clear', function () {
    let newPlannerContainer = document.getElementById('newPlannerContainer');
    newPlannerContainer.__x.$data.place = null;
    newPlannerContainer.__x.$data.lng = null;
    newPlannerContainer.__x.$data.lat = null;
});

document.getElementById('addPlannerButton').addEventListener('click', function () {
    let newPlannerContainer = document.getElementById('newPlannerContainer');
    let addPlannerButton = document.getElementById('addPlannerButton');

    addPlannerButton.classList.add('animate-pulse');
    planner = {
        name: newPlannerContainer.__x.$data.name,
        type: newPlannerContainer.__x.$data.type.toLowerCase(),
        place: newPlannerContainer.__x.$data.place,
        lat: newPlannerContainer.__x.$data.lat,
        lng: newPlannerContainer.__x.$data.lng
    }

    fetch(`http://localhost:8080/planner/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(planner)
    }).then(response => response.json())
    .then(data => {
        addPlannerButton.classList.remove('animate-pulse');
        newPlannerContainer.__x.$data.selected = null;
        newPlannerContainer.__x.$data.name = 'New Planner';
        newPlannerContainer.__x.$data.dropdown = null;
        newPlannerContainer.__x.$data.type = null;
        newPlannerContainer.__x.$data.place = null;
        newPlannerContainer.__x.$data.lng = null;
        newPlannerContainer.__x.$data.lat = null;

        if (data !== null)
        {
            addPlanner(data.id, data.name, data.type, data.place, data.lat, data.lng);
        }
    })
    .catch((error) => {
        addPlannerButton.classList.remove('animate-pulse');
        console.error('Error:', error);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    fetch(`http://localhost:8080/planner`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(response => response.json())
        .then(data => {

            if (data.length > 0)
            {
                for(let i = 0; i < data.length; i++)
                {
                    addPlanner(data[i].id, data[i].name, data[i].type, data[i].place, data[i].lat, data[i].lng);
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
})

function addPlanner(id, name, type, place, lat, lng)
{
    let plannersContainer = document.getElementById('plannersContainer');

    const div = document.createElement('div');
    div.className = 'w-full flex flex-col items-center';
    div.id = `${id}`;
    div.innerHTML = `
        <div class="w-11/12 group rounded-xl border-2 mt-5 cursor-pointer select-none flex flex-row justify-between
                    transform hover:translate-x-3 hover:bg-white hover:shadow-lg bg-gray-50
                    hover:border-transparent transition ease-out duration-700">
            <a href="${type}/${id}?lat=${lat}&lng=${lng}" style="width:calc(100% - 4rem)!important;" class="pl-5 pt-5 pb-5 flex flex-row justify-between items-center">
                <div class="flex-grow min-w-0">
                    <p class="text-gray-500 group-hover:text-indigo-500 font-bold truncate">
                        ${name}
                    </p>
                    <p class="text-gray-500 group-hover:text-gray-600 truncate">
                        Vising ${place}
                    </p>
                    <p class="text-gray-500 group-hover:text-gray-600 truncate">
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </p>
                </div>
                <div class="pl-3 truncate">
                    ${id}
                </div>
            </a>
            <button class="mr-5 transform hover:scale-125 hover:text-red-400 transition ease-in-out
                       duration-500 focus:outline-none border-none text-gray-500" onclick="deletePlanner('${id}')"
                       id="deletePlannerButton_${id}">
                <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        </div>
    `;

    plannersContainer.appendChild(div);
}

function deletePlanner(id)
{
    let deleteButton = document.getElementById(`deletePlannerButton_${id}`);
    deleteButton.classList.add('animate-pulse');

    planner = {
        id: id
    };

    fetch(`http://localhost:8080/planner/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(planner)
    }).then(response => response.json())
    .then(data => {
        deleteButton.classList.remove('animate-pulse');

        if (data !== null)
        {
            let plannerToRemove = document.getElementById(`${id}`);

            if(plannerToRemove)
            {
                plannerToRemove.remove();
            }
        }
    })
    .catch((error) => {
        deleteButton.classList.remove('animate-pulse');
        console.error('Error:', error);
    });
}
