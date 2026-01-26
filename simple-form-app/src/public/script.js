document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('simpleForm');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // Optionally, handle success (e.g., show a message to the user)
        })
        .catch((error) => {
            console.error('Error:', error);
            // Optionally, handle error (e.g., show an error message)
        });
    });
});