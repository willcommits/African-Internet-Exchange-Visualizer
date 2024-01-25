// Flag to track if changes have been made
let changesMade = false;

// prevents more than one toggle to be active at the same time
const toggles = document.querySelectorAll('.toggle');
toggles.forEach(toggle => {
    toggle.addEventListener('change', function () {
        changesMade = true;
        if (this.checked) {
            const currentGroup = this.getAttribute('data-group');
            toggles.forEach(otherToggle => {
                const otherGroup = otherToggle.getAttribute('data-group');
                if (otherToggle !== this && currentGroup === otherGroup) {
                    otherToggle.checked = false;
                }
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    //create event listener for the button to allow to show main modal on click
    document.getElementById('view-network').addEventListener('click', function () {
        $('#networkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
        document.getElementById('country-info').style.display = 'none';
    });

  
});

// add event listeners to my toggles
function toggleFunction1() {
    let switch1 = document.getElementById("toggleSwitch1");
    if (switch1.checked) {
        console.log("Toggle Switch 1 is ON");
    } else {
        console.log("Toggle Switch 1 is OFF");
    }
}
// add event listeners to my toggles
function toggleFunction2() {
    let switch2 = document.getElementById("toggleSwitch2");
    if (switch2.checked) {
        console.log("Toggle Switch 2 is ON");
    } else {
        console.log("Toggle Switch 2 is OFF");
    }
}

// Event listener for add node to show add node modal
$(document).ready(function() {
    $('#addnode').click(function() {
        $('#addNodeModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });
});

// Event listener for add link to show add link modal
$(document).ready(function() {
    $('#addlink').click(function() {
        $('#addLinkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });
});

