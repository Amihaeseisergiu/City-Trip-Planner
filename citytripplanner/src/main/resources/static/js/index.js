document.getElementById('addPlannerButton').addEventListener('click', function () {
    let newPlannerContainer = document.getElementById('newPlannerContainer');
    let addPlannerButton = document.getElementById('addPlannerButton');

    addPlannerButton.classList.add('animate-pulse');
    planner = {
        name: newPlannerContainer.__x.$data.name,
        type: newPlannerContainer.__x.$data.type.toLowerCase()
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

        if (data !== null)
        {
            addPlanner(data.id, data.name, data.type);
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
                    addPlanner(data[i].id, data[i].name, data[i].type);
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
})

function addPlanner(id, name, type)
{
    let plannersContainer = document.getElementById('plannersContainer');

    const div = document.createElement('div');
    div.className = 'w-full flex flex-col items-center';
    div.id = `${id}`;
    div.innerHTML = `
        <div class="w-11/12 group rounded-xl border-2 mt-5 cursor-pointer select-none flex flex-row justify-between
                    transform hover:translate-x-3 hover:bg-white hover:shadow-lg bg-gray-50
                    hover:border-transparent transition ease-out duration-700">
            <a href="${type}/${id}" style="width:calc(100% - 4rem)!important;" class="flex flex-row justify-between items-center p-5">
                <div class="flex flex-col">
                    <p class="text-gray-500 group-hover:text-indigo-500 font-bold">
                        ${name}
                    </p>
                    <p class="text-gray-500 group-hover:text-gray-600">
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </p>
                </div>
                <div class="pl-3">
                    ${id}
                </div>
            </a>
            <button class="transform hover:scale-125 hover:text-red-400 transition ease-in-out p-5
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
