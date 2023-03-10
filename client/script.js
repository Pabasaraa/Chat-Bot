import bot from '/assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

// Indicate that the bot is typing while waiting for the response
function loader(element){
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if(element.textContent === '....'){
      element.textContent = '';
    }
  }, 300)
}

// The bot is typing the answer one letter at a time
function typeText(element, text){
  let i = 0;

  const typeInterval = setInterval(() => {
    element.textContent += text[i];
    i++;

    if(i === text.length){
      clearInterval(typeInterval);
    }
  }, 20)
}

function generateUniqueId(){
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

// Text to speech function to read the response
function speak(text) {
  // Check if the browser supports the SpeechSynthesis API
  if ('speechSynthesis' in window) {
    // Get the first available voice
    const voice = window.speechSynthesis.getVoices()[0];

    // Create a new SpeechSynthesisUtterance object
    const utterance = new SpeechSynthesisUtterance();

    // Set the text and voice of the utterance
    utterance.text = text;
    utterance.voice = voice;

    // Queue the utterance for synthesis
    window.speechSynthesis.speak(utterance);
  }else{
    console.log('Your browser does not support the SpeechSynthesis API');
  }
}


function chatStripe (isAi, value, uniqueId) {
  return (
    `
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img
              src="${isAi ? bot : user}"
              alt="${isAi ? 'bot' : 'user'}"
            />
          </div>
          <div class="message" id=${uniqueId}>${value}</div>
          </div>
        </div>
      </div>
    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // User's chat stripes
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  form.reset();

  //bot's chat stripes
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  // Fetch the response from the server
  const response = await fetch('http://localhost:5000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if(response.ok){
    const data = await response.json();
    const parsedData = data.bot.trim();

    typeText(messageDiv, parsedData);
    speak(parsedData);
    console.log({parsedData})
  }else {
    const err = await response.text();

    messageDiv.innerHTML = "something went wrong"

    alert(err);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if(e.key === 'Enter'){
    handleSubmit(e);
  }
});