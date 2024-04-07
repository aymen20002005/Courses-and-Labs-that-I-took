// Your existing code...

// Add this section for the chatbot
var chatbotContainer = document.createElement('div');
chatbotContainer.id = 'chatbot-container';

var chatbox = document.createElement('div');
chatbox.id = 'chatbox';

var chatLog = document.createElement('div');
chatLog.id = 'chat-log';

var questionList = [
  "How do I read and interpret a stock chart?",
  "What are the main strategies for long-term investment?",
  "What are the main stock market indices and what do they represent?"
];

var questionDropdown = document.createElement('select');
questionDropdown.id = 'question-dropdown';

// Populate the dropdown with questions
questionList.forEach(function (question, index) {
  var option = document.createElement('option');
  option.value = index;
  option.text = question;
  questionDropdown.appendChild(option);
});

var askButton = document.createElement('button');
askButton.textContent = 'Demander';
askButton.addEventListener('click', askQuestion);

var resetButton = document.createElement('button');
resetButton.textContent = 'Réinitialiser';
resetButton.addEventListener('click', resetChat);

chatbox.appendChild(questionDropdown);
chatbox.appendChild(askButton);
chatbox.appendChild(resetButton);
chatbox.appendChild(chatLog);
chatbotContainer.appendChild(chatbox);

// Append the chatbot container to the body
document.body.appendChild(chatbotContainer);

function askQuestion() {
  var selectedQuestionIndex = questionDropdown.value;
  var selectedQuestion = questionList[selectedQuestionIndex];

  // Display the selected question in the chat log
  chatLog.innerHTML += "<div>User: " + selectedQuestion + "</div>";

  // Add your logic to generate the bot's response based on the selected question
  var botResponse = "A stock chart visualizes price movements over time. The x-axis represents time, the y-axis shows prices, and candlesticks or bars depict price changes. Look for trends, support/resistance levels, and consider indicators like volume and technical tools for insights into market movements.";
  chatLog.innerHTML += "<div>" + botResponse + "</div>";
}

//Answer to question 2
" Long-term investment strategies include buy and hold, where investors hold onto assets for an extended period, and dollar-cost averaging, systematically investing fixed amounts over time. Diversification, focusing on a mix of assets, and periodic portfolio rebalancing are also key long-term approaches."
//Answer to question 3
"Major stock market indices include the S&P 500, Dow Jones Industrial Average, and Nasdaq Composite. They represent the performance of a specific group of stocks, providing insights into the overall health and trends of the stock market. For example, the S&P 500 tracks 500 large-cap stocks and is considered a benchmark for the broader U.S. market."

function resetChat() {
  // Clear the chat log
  chatLog.innerHTML = '';
}

// The rest of your existing code...
