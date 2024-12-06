document.getElementById('open-chatbot').addEventListener('click', function() {
    document.getElementById('chatbot-container').style.display = 'flex';
    document.getElementById('open-chatbot').style.display = 'none';
});

document.getElementById('close-chatbot').addEventListener('click', function() {
    document.getElementById('chatbot-container').style.display = 'none';
    document.getElementById('open-chatbot').style.display = 'block';
});

document.getElementById('send-message').addEventListener('click', function() {
    const userInput = document.getElementById('user-input').value;
    if (userInput) {
        const messageContainer = document.createElement('div');
        messageContainer.innerText = userInput;
        document.getElementById('messages').appendChild(messageContainer);

        // Call your Node.js server or OpenAI API to get the response
        fetch('/getResponse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        })
        .then(response => response.json())
        .then(data => {
            const botMessageContainer = document.createElement('div');
            botMessageContainer.innerText = data.response;
            document.getElementById('messages').appendChild(botMessageContainer);
        });

        document.getElementById('user-input').value = '';
    }
});
