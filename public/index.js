const ws = new WebSocket('ws://localhost:8088');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
let clientId = null;
let userId = null;

ws.onopen = () => {
  console.log('Connected to server');
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('Received message:', data); // Debug log
    const messageElement = document.createElement('div');
    
    if (data.type === 'welcome') {
      clientId = data.clientId;
      userId = data.userId;
      console.log('Assigned clientId:', clientId, 'userId:', userId); // Debug log
      messageElement.className = 'welcome';
      messageElement.textContent = data.message;
    } else if (data.type === 'message') {
      // Ensure clientId and userId are set before rendering
      if (!clientId || !userId) {
        console.warn('clientId or userId not set yet:', { clientId, userId });
        return;
      }
      messageElement.className = data.senderId === clientId ? 'my-message' : 'message';
      console.log('Rendering message:', { text: data.text, senderId: data.senderId, userId: data.userId, myId: clientId, class: messageElement.className }); // Debug log
      
      // Create user ID and message content
      const userIdElement = document.createElement('span');
      userIdElement.className = 'user-id';
      userIdElement.textContent = data.userId + ': ';
      
      const textElement = document.createElement('span');
      textElement.className = 'message-text';
      textElement.textContent = data.text;
      
      messageElement.appendChild(userIdElement);
      messageElement.appendChild(textElement);
    }
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });
  } catch (error) {
    console.error('Error processing message:', error);
  }
};

ws.onclose = () => {
  console.log('Disconnected from server');
  const disconnectMessage = document.createElement('div');
  disconnectMessage.className = 'welcome';
  disconnectMessage.textContent = 'Disconnected from server';
  messagesDiv.appendChild(disconnectMessage);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

function sendMessage() {
  const text = messageInput.value.trim();
  if (text && ws.readyState === WebSocket.OPEN) {
    if (!userId) {
      console.warn('userId not set, cannot send message');
      return;
    }
    console.log('Sending message:', { text, clientId, userId }); // Debug log
    ws.send(JSON.stringify({ text }));
    messageInput.value = '';
  }
}

// Send message on Enter key
messageInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});