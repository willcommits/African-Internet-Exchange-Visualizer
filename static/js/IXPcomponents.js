
document.addEventListener('DOMContentLoaded', function () {
    //adds event listener to allow the user to display the main modal on click
    document.getElementById('view-network').addEventListener('click', function () {
        $('#networkModal').modal({
            backdrop: 'static',
            keyboard: false
        });
        document.getElementById('country-info').style.display = 'none';
    });

 
    
    // alerts user their changes won't be saved on exit
    $('#newNetworkModal').on('hide.bs.modal', function (e) {
        if (changesMade) {
            const userConfirmed = window.confirm("You have not saved your changes. Are you sure you want to exit?");
            if (!userConfirmed) {
                e.preventDefault();
            } else {
                changesMade = false; 
            }
        }
    });
});





