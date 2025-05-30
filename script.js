// Cashfree configuration
const cashfree = Cashfree({
    mode: "production" // Use "sandbox" for testing
});

// Game configuration - questions designed to be hard
const questions = [
    {
        question: "What is the 7th digit of π (pi)?",
        options: ["2", "5", "6", "9"],
        answer: "6",
        explanation: "The first 10 digits of pi are 3.141592653..."
    },
    {
        question: "Which planet's day is longer than its year?",
        options: ["Mercury", "Venus", "Mars", "Jupiter"],
        answer: "Venus",
        explanation: "Venus takes 243 Earth days to rotate once but only 225 days to orbit the Sun"
    },
    {
        question: "What is the atomic number of Einsteinium?",
        options: ["89", "94", "99", "102"],
        answer: "99",
        explanation: "Einsteinium (Es) has atomic number 99"
    },
    {
        question: "In what year was the first iPhone released?",
        options: ["2005", "2007", "2009", "2011"],
        answer: "2007",
        explanation: "The first iPhone was announced January 9, 2007"
    },
    {
        question: "Which country has the most time zones?",
        options: ["Russia", "USA", "France", "China"],
        answer: "France",
        explanation: "France has 12 time zones due to its overseas territories"
    },
    {
        question: "What is the capital of Bhutan?",
        options: ["Kathmandu", "Thimphu", "Dhaka", "Male"],
        answer: "Thimphu",
        explanation: "Thimphu has been Bhutan's capital since 1961"
    },
    {
        question: "Which element has the chemical symbol 'W'?",
        options: ["Tungsten", "Titanium", "Tantalum", "Tin"],
        answer: "Tungsten",
        explanation: "From its German name Wolfram"
    },
    {
        question: "What is the largest internal organ in the human body?",
        options: ["Brain", "Liver", "Lung", "Heart"],
        answer: "Liver",
        explanation: "The liver weighs about 1.5kg on average"
    },
    {
        question: "Which country invented tea?",
        options: ["India", "England", "China", "Japan"],
        answer: "China",
        explanation: "Tea originated in Southwest China as a medicinal drink"
    },
    {
        question: "What is the only even prime number?",
        options: ["0", "1", "2", "4"],
        answer: "2",
        explanation: "2 is the only even number that's prime"
    }
];

// Game variables
let currentQuestion = 0;
let score = 0;
let timeLeft = 100;
let timer;
let selectedOption = null;
let paymentDone = false;
let paymentOrderId = `order_${Math.random().toString(36).substr(2, 9)}`;

// DOM elements
const startScreen = document.getElementById('startScreen');
const paymentScreen = document.getElementById('paymentScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const startBtn = document.getElementById('startBtn');
const payBtn = document.getElementById('payBtn');
const backBtn1 = document.getElementById('backBtn1');
const playAgainBtn = document.getElementById('playAgainBtn');
const shareBtn = document.getElementById('shareBtn');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const timeLeftDisplay = document.getElementById('timeLeft');
const currentQuestionDisplay = document.getElementById('currentQuestion');
const finalScoreDisplay = document.getElementById('finalScore');
const resultBanner = document.getElementById('resultBanner');
const paymentProcessing = document.getElementById('paymentProcessing');
const paymentStatus = document.getElementById('paymentStatus');

// Event listeners
startBtn.addEventListener('click', showPaymentScreen);
payBtn.addEventListener('click', initiatePayment);
backBtn1.addEventListener('click', () => {
    paymentScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});
playAgainBtn.addEventListener('click', showPaymentScreen);
shareBtn.addEventListener('click', shareChallenge);

// Payment method selection
document.getElementById('upiOption').addEventListener('click', () => {
    document.getElementById('upiOption').classList.add('selected');
    document.getElementById('paytmOption').classList.remove('selected');
});

document.getElementById('paytmOption').addEventListener('click', () => {
    document.getElementById('paytmOption').classList.add('selected');
    document.getElementById('upiOption').classList.remove('selected');
});

// Show payment screen
function showPaymentScreen() {
    startScreen.classList.add('hidden');
    paymentScreen.classList.remove('hidden');
    paymentOrderId = `order_${Math.random().toString(36).substr(2, 9)}`; // Generate new order ID
}

// Initiate Cashfree payment
async function initiatePayment() {
    paymentProcessing.classList.remove('hidden');
    paymentStatus.textContent = "Processing payment...";

    try {
        // Step 1: Call Netlify Function to create order
        const response = await fetch('/.netlify/functions/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: paymentOrderId,
                order_amount: 50.00,
                customer_details: {
                    customer_id: `cust_${Math.random().toString(36).substr(2, 9)}`,
                    customer_name: 'Quiz Player',
                    customer_email: 'player@example.com',
                    customer_phone: '9999999999'
                }
            })
        });

        const orderData = await response.json();

        if (!response.ok) {
            throw new Error(orderData.message || 'Failed to create order');
        }

        // Step 2: Initialize Cashfree Drop-in
        const paymentSessionId = orderData.payment_session_id;

        let components = ['order-details', 'card', 'netbanking', 'wallet', 'upi'];
        if (document.getElementById('upiOption').classList.contains('selected')) {
            components = ['order-details', 'upi'];
        } else if (document.getElementById('paytmOption').classList.contains('selected')) {
            components = ['order-details', 'wallet'];
        }

        const dropinConfig = {
            components: components,
            onSuccess: async function(data) {
                // Verify payment status
                const verifyResponse = await fetch('/.netlify/functions/verify-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        order_id: paymentOrderId
                    })
                });

                const verifyData = await verifyResponse.json();

                if (verifyData.status === 'OK') {
                    paymentStatus.textContent = "Payment successful! Starting challenge...";
                    setTimeout(() => {
                        paymentProcessing.classList.add('hidden');
                        startQuiz();
                    }, 1500);
                } else {
                    throw new Error('Payment verification failed');
                }
            },
            onFailure: function(data) {
                paymentStatus.textContent = `Payment failed: ${data.error}`;
                setTimeout(() => {
                    paymentProcessing.classList.add('hidden');
                }, 2000);
            },
            style: {
                backgroundColor: "#ffffff",
                color: "#2d3436",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "16px",
                errorColor: "#d63031",
                theme: "light"
            }
        };

        // Step 3: Launch Cashfree Drop-in
        cashfree.checkout({
            paymentSessionId: paymentSessionId,
            returnUrl: window.location.href
        }, dropinConfig).then(() => {
            // Payment UI is shown, handled by onSuccess/onFailure callbacks
        }).catch(error => {
            paymentStatus.textContent = `Error launching payment: ${error.message}`;
            setTimeout(() => {
                paymentProcessing.classList.add('hidden');
            }, 2000);
        });

    } catch (error) {
        paymentStatus.textContent = `Payment error: ${error.message}`;
        setTimeout(() => {
            paymentProcessing.classList.add('hidden');
        }, 2000);
    }
}

// Start quiz after payment
function startQuiz() {
    paymentDone = true;
    paymentScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    loadQuestion();
    startTimer();
}

// Load question
function loadQuestion() {
    if (currentQuestion >= questions.length) {
        endGame();
        return;
    }

    const q = questions[currentQuestion];
    questionText.textContent = q.question;
    optionsContainer.innerHTML = '';
    currentQuestionDisplay.textContent = currentQuestion + 1;

    q.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        optionElement.addEventListener('click', selectOption);
        optionsContainer.appendChild(optionElement);
    });

    selectedOption = null;
}

// Select option
function selectOption(e) {
    if (selectedOption !== null) return;

    const selectedElement = e.target;
    const selectedIndex = selectedElement.dataset.index;
    const correctIndex = questions[currentQuestion].options.indexOf(questions[currentQuestion].answer);

    selectedOption = selectedIndex;
    selectedElement.classList.add('selected');

    // Show correct/wrong after delay
    setTimeout(() => {
        if (selectedIndex == correctIndex) {
            selectedElement.classList.add('correct');
            score++;
        } else {
            selectedElement.classList.add('wrong');
            document.querySelectorAll('.option')[correctIndex].classList.add('correct');
        }

        // Move to next question after delay
        setTimeout(() => {
            currentQuestion++;
            loadQuestion();
        }, 1500);
    }, 500);
}

// Timer
function startTimer() {
    timeLeft = 100;
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    timeLeftDisplay.textContent = timeLeft;
    
    // Change color when time is running out
    if (timeLeft <= 20) {
        timeLeftDisplay.parentElement.style.background = 'linear-gradient(135deg, rgba(214, 48, 49, 0.7) 0%, rgba(255, 118, 117, 0.7) 100%)';
    }
}

// End game
function endGame() {
    clearInterval(timer);
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    // Ensure no one wins (even if they somehow get all right)
    if (score === 10) {
        score = 9; // Cheat the system
    }
    
    finalScoreDisplay.textContent = score;
    
    // Update result banner
    if (score >= 8) {
        resultBanner.innerHTML = `
            <h2>So Close! 😢</h2>
            <p>You answered ${score}/10 correctly</p>
            <p>Just 1 more to win ₹1000!</p>
        `;
    } else if (score >= 5) {
        resultBanner.innerHTML = `
            <h2>Good Try! 😊</h2>
            <p>You answered ${score}/10 correctly</p>
            <p>The average is 3/10 - you're above average!</p>
        `;
    } else {
        resultBanner.innerHTML = `
            <h2>Better Luck Next Time! 😅</h2>
            <p>You answered ${score}/10 correctly</p>
            <p>Try again - today's easiest question was: "${questions[3].question}"</p>
        `;
    }
    
    // Reset game for next play
    currentQuestion = 0;
    score = 0;
}

// Share challenge
function shareChallenge() {
    // In a real app, this would use the Web Share API
    alert('Challenge shared! Copy this link to invite friends:\n\nhttps://ephemeral-mandazi-afd150.netlify.app');
    
    // Create confetti effect
    createConfetti();
}

// Create confetti effect
function createConfetti() {
    const colors = ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#d63031'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        // Animation
        const animation = confetti.animate([
            { top: '-10px', opacity: 1 },
            { top: '100vh', opacity: 0 }
        ], {
            duration: 2000 + Math.random() * 3000,
            easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
        });
        
        animation.onfinish = () => {
            confetti.remove();
        };
    }
}