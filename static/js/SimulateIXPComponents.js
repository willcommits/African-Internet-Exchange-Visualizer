// Flag to track if changes have been made
let changesMade = false;


// sets event listeners 
document.addEventListener('DOMContentLoaded', function () {
    //adds event listener to view network to show the main modal to allow user to manipulate the data
    document.getElementById('view-network').addEventListener('click', function () {
        $('#newNetworkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
        document.getElementById('country-info').style.display = 'none';
    });

   //alerts user that their changes won't be saved when they exit the page
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



// Add events listener to update button to allow it to view the Update Modal on Click
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

// Event listener for add node to show the add node Modal
$(document).ready(function() {
    $('#addnode').click(function() {
        $('#addNodeModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });
});

// Event listener for add link to show the Add link Modal
$(document).ready(function() {
    $('#addlink').click(function() {
        $('#addLinkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    });
});

//sets event listeners to the close buttons of the (x) exit of the Modal to allow them to close and be directed to the Main Modal
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
  