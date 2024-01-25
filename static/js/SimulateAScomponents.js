// Flag to track if changes have been made
let changesMade = false;

// Toggle logic
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

// DOMContentLoaded logic
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('view-network').addEventListener('click', function () {
        $('#newNetworkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
        document.getElementById('country-info').style.display = 'none';
    });

    
    // Intercept the modal close event
    $('#newNetworkModal').on('hide.bs.modal', function (e) {
        if (changesMade) {
            const userConfirmed = window.confirm("You have not saved your changes. Are you sure you want to exit?");
            if (!userConfirmed) {
                e.preventDefault();
            } else {
                changesMade = false; // Reset the changesMade flag if the user decides to close
            }
        }
    });
});

// Edit Studio Section Toggle Switches
function toggleFunction1() {
    let switch1 = document.getElementById("toggleSwitch1");
    if (switch1.checked) {
        console.log("Toggle Switch 1 is ON");
    } else {
        console.log("Toggle Switch 1 is OFF");
    }
}

function toggleFunction2() {
    let switch2 = document.getElementById("toggleSwitch2");
    if (switch2.checked) {
        console.log("Toggle Switch 2 is ON");
    } else {
        console.log("Toggle Switch 2 is OFF");
    }
}

// Update logic
document.getElementById("update").addEventListener("click", function () {
    $('#updateModal').modal({
        backdrop: 'static',
        keyboard: false
    });
});

// Event listener for updating node details
document.getElementById("updateForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    if (selectedNode) {
        updateNodeDetails();
    } else {
        alert("No node selected to update!");
    }
});

// Event listener for add node
$(document).ready(function() {
    $('#addnode').click(function() {
        $('#addNodeModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });
});

// Event listener for add link
$(document).ready(function() {
    $('#addlink').click(function() {
        $('#addLinkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // Get the 'removelink' button by its id
    const removeLinkButton = document.getElementById("removelink");
  
    // Add click event listener
    removeLinkButton.addEventListener("click", function() {
      // Hide the 'networkModal' if it's visible
      $('#networkModal').modal('hide');
  
      // Display the 'removeLinkModal'
      $("#removeLinkModal").modal({
        backdrop: 'static',
        keyboard: false
      });
    });
  });
  // Close button functionality
document.getElementById('close-card').addEventListener('click', function() {
    const card = document.getElementById('country-info');
    
    // Fade out the card
    card.style.opacity = 0;
    
    // After the fade-out transition is complete, hide the card completely
    setTimeout(() => card.style.display = 'none', 300); // Assuming a 300ms transition
});



$(document).ready(function() {
    $('#close-updateModal').on('click', function() {
        // Hide the current modal
        $('#updateModal').modal('hide');
    });

    $('#updateModal').on('hidden.bs.modal', function() {
        // Show the newNetworkModal once the updateModal is fully hidden
        $('#newNetworkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });

    $('#close-addNodeModal').on('click', function() {
        $('#addNodeModal').modal('hide');
    });

    $('#addNodeModal').on('hidden.bs.modal', function() {
        $('#newNetworkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });

    // For the addLinkModal
$('#close-addLinkModal').on('click', function() {
    $('#addLinkModal').modal('hide');
});

$('#addLinkModal').on('hidden.bs.modal', function() {
    $('#newNetworkModal').modal({
        backdrop: 'static',
        keyboard: false
    });
});

// Similarly, for the removeLinkModal
$('#close-removeLinkModal').on('click', function() {
    $('#removeLinkModal').modal('hide');
});

$('#removeLinkModal').on('hidden.bs.modal', function() {
    $('#newNetworkModal').modal({
        backdrop: 'static',
        keyboard: false
    });
});




});
