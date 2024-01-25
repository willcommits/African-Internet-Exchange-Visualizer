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

// Update Modal event Listener
document.getElementById("update").addEventListener("click", function () {
    $('#updateModal').modal({
        backdrop: 'static',
        keyboard: false
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
  