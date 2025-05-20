/**
 * Roth Davies Law Firm Chatbot
 * A modular, performance-optimized implementation
 */
(function() {
  // Configuration module - centralized settings
  
  // Get site-specific config if provided
  const siteConfig = window.LawChatbotConfig || {};

  const Config = {
    // API keys - merged with defaults
    docsbot: {
      teamId: siteConfig.docsbot?.teamId || "",
      botId: siteConfig.docsbot?.botId || "",
      apiKey: siteConfig.docsbot?.apiKey || "",
      defaultLanguage: siteConfig.docsbot?.defaultLanguage || "en-US"
    },
    twilio: {
    accountSid: siteConfig.twilio?.accountSid || "",
    authToken: siteConfig.twilio?.authToken || "", 
    fromNumber: siteConfig.twilio?.fromNumber || "+19133956075",
    toNumber: siteConfig.twilio?.toNumber || "+19134753876"
    },
    videos: {
    default: siteConfig.videos?.default || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/welcome.mp4',
    'personal-injury': siteConfig.videos?.['personal-injury'] || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/personal-injury.mp4',
    'criminal-defense': siteConfig.videos?.['criminal-defense'] || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/criminal-defense.mp4',
    'divorce': siteConfig.videos?.['divorce'] || 'https://camrenhall.github.io/ai-chatbot-for-law/videos/family-law.mp4'
    },
    timing: {
    minTypingDelay: siteConfig.timing?.minTypingDelay || 1500,
    maxTypingDelay: siteConfig.timing?.maxTypingDelay || 2500,
    notificationDelay: siteConfig.timing?.notificationDelay || 2000
    },
    cssSelector: {
      container: '.law-chat-widget',
      messages: '.law-chat-messages',
      input: '.law-chat-input',
      send: '.law-chat-send',
      bubble: '.law-chat-bubble',
      window: '.law-chat-window',
      close: '.law-chat-close',
      typing: '.law-chat-typing',
      notification: '.law-chat-notification'
    }
  };

  // DOM Module - handles all DOM-related operations
  const DOM = {
    elements: {},
    
    initialize() {
      // Attach styles
      this.addStyles();
      
      // Create DOM structure
      this.createElements();
      
      // Save references to elements for easy access
      this.cacheElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      return this;
    },
    
    addStyles() {
      const style = document.createElement('style');
      style.textContent = this.getChatbotStyles();
      document.head.appendChild(style);
      
      // Add recommendation-specific styles
      const recStyles = document.createElement('style');
      recStyles.textContent = this.getRecommendationStyles();
      document.head.appendChild(recStyles);
    },
    
    createElements() {
      // Create main container
      const chatContainer = document.createElement('div');
      chatContainer.className = 'law-chat-widget';
      
      // Chat bubble with icon
      const chatBubble = document.createElement('div');
      chatBubble.className = 'law-chat-bubble';
      chatBubble.innerHTML = '<div class="law-chat-bubble-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10.5H16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14H13.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
      
      // Add notification badge
      const notificationBadge = document.createElement('div');
      notificationBadge.className = 'law-chat-notification';
      notificationBadge.textContent = '1';
      notificationBadge.style.display = 'none';
      chatBubble.appendChild(notificationBadge);
      
      // Chat window
      const chatWindow = document.createElement('div');
      chatWindow.className = 'law-chat-window';
      
      // Chat header
      const chatHeader = document.createElement('div');
      chatHeader.className = 'law-chat-header';
      chatHeader.innerHTML = `
        <h3 class="law-chat-title">
          <span class="law-chat-title-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1.5L1.5 6.5L12 11.5L22.5 6.5L12 1.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 17.5L12 22.5L22.5 17.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 12L12 17L22.5 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg></span>
          Roth Davies Assistant
        </h3>
        <button class="law-chat-close">×</button>
      `;
      
      // Chat messages container
      const messagesContainer = document.createElement('div');
      messagesContainer.className = 'law-chat-messages';
      
      // Typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'law-chat-typing';
      typingIndicator.innerHTML = `
        <div class="law-chat-typing-dots">
          <div class="law-chat-dot"></div>
          <div class="law-chat-dot"></div>
          <div class="law-chat-dot"></div>
        </div>
      `;
      
      // Input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'law-chat-input-container';
      inputContainer.innerHTML = `
        <textarea class="law-chat-input" placeholder="Type your question here..." rows="1"></textarea>
        <button class="law-chat-send" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
      
      // Assemble chat window
      chatWindow.appendChild(chatHeader);
      chatWindow.appendChild(messagesContainer);
      chatWindow.appendChild(typingIndicator);
      chatWindow.appendChild(inputContainer);
      
      // Append elements to container and then to body
      chatContainer.appendChild(chatBubble);
      chatContainer.appendChild(chatWindow);
      document.body.appendChild(chatContainer);
    },
    
    cacheElements() {
  // Save references to frequently accessed elements for better performance
  const selectors = Config.cssSelector;
  this.elements = {
    container: document.querySelector(selectors.container),
    messages: document.querySelector(selectors.messages),
    input: document.querySelector(selectors.input),
    send: document.querySelector(selectors.send),
    bubble: document.querySelector(selectors.bubble),
    window: document.querySelector(selectors.window),
    close: document.querySelector(selectors.close),
    typing: document.querySelector(selectors.typing),
    notification: document.querySelector(selectors.notification)
  };
  
this.elements.input.addEventListener('input', () => {
  // Store current text
  const text = this.elements.input.value;
  
  // For empty text, reset to single line height
  if (!text) {
    this.elements.input.style.height = '24px';
    return;
  }
  
  // Save the original height
  const originalHeight = this.elements.input.style.height || '24px';
  
  // Reset to measure how much space is actually needed
  this.elements.input.style.height = '24px';
  
  // Check if content overflows the single line
  const hasOverflow = this.elements.input.scrollHeight > this.elements.input.clientHeight;
  
  if (hasOverflow) {
    // Text doesn't fit in one line
    
    // Count actual newlines
    const newlineCount = (text.match(/\n/g) || []).length;
    
    // Calculate height based on newlines (plus 1 for the first line)
    const lineHeight = 24;
    const neededRows = newlineCount + 1;
    const calculatedHeight = Math.min(120, neededRows * lineHeight);
    
    // Set exact height for needed lines
    this.elements.input.style.height = `${calculatedHeight}px`;
    
    // Check again for overflow after setting to calculated height
    // This handles the case where a line is longer than the width
    if (this.elements.input.scrollHeight > this.elements.input.clientHeight) {
      this.elements.input.style.height = `${Math.min(120, this.elements.input.scrollHeight)}px`;
    }
  } else {
    // Content fits in one line, keep it at one line
    this.elements.input.style.height = '24px';
  }
  
  // Scroll chat to bottom
  this.scrollToBottom();
});
},
    
    setupEventListeners() {
      // Chat toggle event listeners
      this.elements.bubble.addEventListener('click', () => {
        UI.openChat();
      });
      
      this.elements.close.addEventListener('click', () => {
        UI.closeChat();
      });
      
      // Input event listeners for send button state
      this.elements.input.addEventListener('input', () => {
        // Enable/disable send button based on input content
        this.elements.send.disabled = !this.elements.input.value.trim();
        
        // Add recommendations indicator if appropriate
        if (ChatFlow.stage === 'qualified' && this.elements.input.value.length > 15) {
          this.checkForLegalTerms(this.elements.input.value);
        }
      });
      
      // Send message on Enter (without shift)
      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!this.elements.send.disabled) {
            this.elements.send.click();
          }
        }
      });
      
      // Send button click handler
      this.elements.send.addEventListener('click', () => {
        const message = this.elements.input.value.trim();
        if (message) {
          // Clear input
          this.elements.input.value = '';
          this.elements.input.style.height = '24px';
          this.elements.send.disabled = true;
          
          // Process message
          ChatFlow.handleUserMessage(message);
        }
      });
      
      // Handle window load for initial notification
      window.addEventListener('load', () => {
        setTimeout(() => {
          UI.showNotification();
        }, Config.timing.notificationDelay);
      });
    },
    
    checkForLegalTerms(text) {
      const legalQuestionIndicators = [
        'how', 'what', 'when', 'why', 'can', 'should', 'is it', 'do i', 
        'accident', 'injury', 'compensation', 'settlement', 'court', 
        'insurance', 'medical', 'police', 'charges', 'rights'
      ];
      
      const lowercaseText = text.toLowerCase();
      const mightNeedResources = legalQuestionIndicators.some(term => 
        lowercaseText.includes(term)
      );
      
      if (mightNeedResources) {
        this.elements.send.classList.add('law-chat-send-with-recommendations');
      } else {
        this.elements.send.classList.remove('law-chat-send-with-recommendations');
      }
    },
    
    scrollToBottom() {
      if (this.elements.messages) {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      }
    },
    
    getChatbotStyles() {
      // Return CSS styles for chatbot
      return `
        /* Chatbot Container Styles */
        .law-chat-widget {
          font-family: 'Arial', sans-serif;
          position: fixed;
          z-index: 9999;
        }

        /* Typing effect animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .law-chat-bubble-content {
          animation: fadeIn 0.3s ease-in-out;
        }

        .law-chat-typing {
          transition: opacity 0.3s ease-in-out;
        }

        /* Typing effect styles */
        .law-chat-typed-word {
          display: inline;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }

        .law-chat-bubble-content {
          line-height: 1.5;
        }
        
        /* Chat Bubble - Enhanced with glowing effect and text */
        .law-chat-bubble {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background-color: #1a365d;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 9999;
          animation: pulse 2s infinite;
        }
        
        /* Pulsing animation for the chat bubble */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(26, 54, 93, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(26, 54, 93, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(26, 54, 93, 0);
          }
        }
        
        /* Text Us label for the chat bubble */
        .law-chat-bubble::before {
          content: "Text Us!";
          position: absolute;
          top: -40px;
          background-color: #1a365d;
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          white-space: nowrap;
          animation: float 3s ease-in-out infinite;
        }

        /* Notification Thing */
        .law-chat-notification {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 20px;
          height: 20px;
          background-color: #e74c3c;
          border-radius: 50%;
          color: white;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          animation: bounce 1s infinite alternate;
          z-index: 10000;
        }

        @keyframes bounce {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.2);
          }
        }
        
        /* Floating animation for the "Text Us" label */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .law-chat-bubble:hover {
          transform: scale(1.1);
        }
        
        .law-chat-bubble-icon {
          color: white;
          font-size: 24px;
        }
        
        /* Chat Window */
        .law-chat-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 380px;
          height: 580px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.3);
          overflow: hidden;
          display: none;
          flex-direction: column;
          z-index: 9998;
          transition: all 0.3s ease;
          border: none;
        }
        
        /* Chat Header */
        .law-chat-header {
          background: linear-gradient(135deg, #1a365d 0%, #0d2b4e 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .law-chat-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          letter-spacing: 0.5px;
        }
        
        .law-chat-title-icon {
          margin-right: 12px;
          font-size: 20px;
        }
        
        .law-chat-close {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          font-size: 18px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
        .law-chat-close:hover {
          opacity: 1;
          background: rgba(255,255,255,0.2);
          transform: rotate(90deg);
        }
        
        /* Chat Messages Area */
        .law-chat-messages {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: #f8f9fa;
          scroll-behavior: smooth;
        }
        
        .law-chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .law-chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .law-chat-messages::-webkit-scrollbar-thumb {
          background: #c5cfd9;
          border-radius: 3px;
        }

        /* Name Input Form - Updated Styling */
        .law-chat-name-form {
          margin-top: 12px;
          width: 100%;
        }

        .law-chat-name-input-container {
          display: flex;
          align-items: center;
          background-color: #f7f9fc;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 8px;
          box-sizing: border-box; /* Ensure padding is included in width */
          max-width: 100%; /* Ensure container doesn't exceed its parent */
          flex-wrap: nowrap; /* Prevent wrapping */
        }

        .law-chat-name-input {
          flex: 1;
          min-width: 0; /* Allow input to shrink below default min-width */
          border: none;
          background: transparent;
          font-size: 16px;
          padding: 8px;
          margin-right: 10px; /* Add space between input and button */
          outline: none;
          color: #1a365d;
          box-sizing: border-box; /* Ensure padding is included */
          overflow: hidden; /* Prevent overflow */
          text-overflow: ellipsis; /* Add ellipsis for text overflow */
        }

        .law-chat-name-input:focus {
          background-color: rgba(26, 54, 93, 0.05);
          border-radius: 4px;
        }

        .law-chat-name-submit {
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 14px; /* Slightly reduce font size */
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0; /* Prevent button from shrinking */
          align-self: center; /* Center vertically */
          white-space: nowrap; /* Prevent text wrapping */
          max-width: 80px; /* Limit button width */
          overflow: hidden; /* Prevent overflow */
          text-overflow: ellipsis; /* Add ellipsis for text overflow */
        }

        .law-chat-name-submit:hover:not(:disabled) {
          background-color: #12293f;
          transform: translateY(-1px);
        }

        .law-chat-name-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .law-chat-name-submit:disabled {
          background-color: #cbd5e0;
          cursor: not-allowed;
        }
        
        /* Video as part of a message */
        .law-chat-video {
          width: 100%;
          height: auto;
          max-width: 100%;
          border-radius: 8px;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        
        /* Message Bubbles */
        .law-chat-message {
          margin-bottom: 14px;
          max-width: 85%;
          display: flex;
          flex-direction: column;
        }
        
        .law-chat-message-user {
          align-self: flex-end;
        }
        
        .law-chat-message-bot {
          align-self: flex-start;
        }
        
        .law-chat-bubble-content {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.5;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .law-chat-message-user .law-chat-bubble-content {
          background-color: #dbe9ff;
          color: #1a365d;
          border-bottom-right-radius: 4px;
        }
        
        .law-chat-message-bot .law-chat-bubble-content {
          background-color: white;
          color: #333;
          border: 1px solid #e1e5e9;
          border-bottom-left-radius: 4px;
        }
        
        /* Option Bubbles */
        .law-chat-options {
          display: flex;
          flex-wrap: wrap;
          margin-top: 10px;
          gap: 8px;
        }
        
        /* Updated Option Styles */
        .law-chat-option {
          background-color: #f0f4f8;
          border: 1px solid #c5cfd9;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500; /* Make all options same weight from the start */
          color: #1a365d;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          box-sizing: border-box; /* Ensures padding is included in width calculations */
        }

        .law-chat-option:hover {
          background-color: #e4ecf7;
          border-color: #1a365d;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .law-chat-option:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .law-chat-option.selected {
          background-color: #1a365d; /* Use background color change instead of bold */
          color: white; /* White text for better contrast */
          border-color: #1a365d;
          /* Remove font-weight change to prevent size changes */
          box-shadow: none;
          /* No transform to prevent layout shifts */
          transform: none;
        }

        .law-chat-option.completed {
          background-color: #e2e8f0;
          color: #4a5568;
          border-color: #cbd5e0;
          cursor: default;
          pointer-events: none; /* Disable interactions */
          box-shadow: none;
          /* No transform to prevent layout shifts */
          transform: none;
        }
        
        .law-chat-time {
          font-size: 11px;
          color: #9aa5b1;
          margin-top: 4px;
          margin-left: 6px;
          margin-right: 6px;
        }
        
        /* Typing Indicator */
        .law-chat-typing {
          display: none;
          margin: 10px 0 14px 20px; /* Added left margin to align with other messages */
        }
        
        .law-chat-typing-dots {
          display: flex;
          align-items: center;
        }
        
        .law-chat-dot {
          width: 8px;
          height: 8px;
          background-color: #9aa5b1;
          border-radius: 50%;
          margin: 0 4px;
          animation: law-chat-typing 1.4s infinite ease-in-out;
        }
        
        .law-chat-dot:nth-child(1) { animation-delay: 0s; }
        .law-chat-dot:nth-child(2) { animation-delay: 0.2s; }
        .law-chat-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes law-chat-typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        /* Phone Collection Form */
        .law-chat-phone-form {
          margin-top: 12px;
          width: 100%;
        }
        
        .law-chat-phone-input-container {
          display: flex;
          align-items: center;
          background-color: #f7f9fc;
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 8px;
        }
        
        .law-chat-phone-prefix,
        .law-chat-phone-separator {
          color: #4a5568;
          font-size: 16px;
          font-weight: 500;
        }
        
        .law-chat-phone-input {
          border: none;
          background: transparent;
          font-size: 16px;
          padding: 4px;
          text-align: center;
          width: auto;
          outline: none;
          color: #1a365d;
          font-weight: 500;
        }
        
        .law-chat-phone-input.area-code {
          width: 40px;
        }
        
        .law-chat-phone-input.prefix {
          width: 40px;
        }
        
        .law-chat-phone-input.line {
          width: 50px;
        }
        
        .law-chat-phone-input:focus {
          background-color: rgba(26, 54, 93, 0.05);
          border-radius: 4px;
        }
        
        .law-chat-phone-submit {
          margin-left: auto;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .law-chat-phone-submit:hover:not(:disabled) {
          background-color: #12293f;
          transform: translateY(-1px);
        }
        
        .law-chat-phone-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .law-chat-phone-submit:disabled {
          background-color: #cbd5e0;
          cursor: not-allowed;
        }
        
        .law-chat-phone-privacy {
          font-size: 11px;
          color: #718096;
          text-align: center;
        }
        
        /* Input Area */
        .law-chat-input-container {
          padding: 15px;
          background-color: white;
          border-top: 1px solid #e1e5e9;
          display: flex;
          align-items: center;
        }
        
        .law-chat-input {
          flex-grow: 1;
          padding: 12px 16px;
          border: 1px solid #dfe3e8;
          border-radius: 24px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          resize: none;
          overflow: hidden;
          height: 24px; /* Exact height for a single line of text */
          max-height: 120px;
          line-height: 24px; /* Match height for single line text */
          white-space: pre-wrap; /* Preserve whitespace but allow wrapping */
          word-break: break-word; /* Break long words if needed */
          box-sizing: content-box; /* Make sure padding doesn't affect height calculation */
        }
        
        .law-chat-input:focus {
          border-color: #1a365d;
          box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.15);
        }
        
        .law-chat-send {
          margin-left: 10px;
          width: 44px;
          height: 44px;
          background-color: #1a365d;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(26, 54, 93, 0.2);
        }
        
        .law-chat-send:hover {
          background-color: #10243d;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(26, 54, 93, 0.3);
        }
        
        .law-chat-send:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(26, 54, 93, 0.2);
        }
        
        .law-chat-send:disabled {
          background-color: #e1e5e9;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .law-chat-send-icon {
          font-size: 18px;
        }

        /* Enhanced send button for when recommendations might be available */
        .law-chat-send-with-recommendations {
          background-color: #0f4c81; /* Slightly different color */
          box-shadow: 0 2px 8px rgba(26, 54, 93, 0.4);
        }

        .law-chat-send-with-recommendations:after {
          content: '';
          position: absolute;
          top: -3px;
          right: -3px;
          width: 8px;
          height: 8px;
          background-color: #4299e1;
          border-radius: 50%;
        }

        /* Play Button Overlay */
        .law-chat-video-play {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 8px;
        }
        
        .law-chat-video-play-button {
          width: 50px;
          height: 50px;
          background-color: rgba(255,255,255,0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        /* Mobile Responsive */
        @media (max-width: 480px) {
          .law-chat-window {
            width: 90%;
            height: 80%;
            bottom: 80px;
            right: 5%;
            left: 5%;
          }
        }
      `;
    },
    
    getRecommendationStyles() {
      return `
        /* Recommendations container */
        .law-chat-recommendations {
          margin: 8px 0 12px;
          padding: 10px 12px;
          background-color: #f0f7ff;
          border-radius: 8px;
          border-left: 3px solid #1a365d;
          font-size: 14px;
        }
        
        /* Heading */
        .law-chat-recommendations h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #1a365d;
          font-weight: 600;
        }
        
        /* List styling */
        .law-chat-recommendation-list {
          margin: 0;
          padding-left: 18px;
          list-style-type: disc;
        }
        
        /* List items */
        .law-chat-recommendation-list li {
          margin-bottom: 6px;
        }
        
        /* Link styling */
        .law-chat-recommendation-link {
          color: #1a365d;
          text-decoration: none;
          border-bottom: 1px dotted #1a365d;
          transition: all 0.2s ease;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .law-chat-recommendation-link:hover {
          color: #0d2b4e;
          border-bottom: 1px solid #0d2b4e;
        }
        
        /* Make sure the content after recommendations has proper spacing */
        .law-chat-recommendations + .law-chat-bubble-content {
          margin-top: 10px;
        }
      `;
    }
  };
  
  // UI Module - handles display logic and user interface interactions
  const UI = {
    videoAdded: false,
    apiLatency: 0,
    transitionMessageSent: false,
    recommendationsShown: false,
    
    showTypingIndicator() {
      DOM.elements.typing.style.display = 'flex';
      DOM.scrollToBottom();
    },
    
    hideTypingIndicator() {
      DOM.elements.typing.style.display = 'none';
    },
    
    showNotification() {
      DOM.elements.notification.style.display = 'flex';
    },
    
    hideNotification() {
      DOM.elements.notification.style.display = 'none';
    },
    
    openChat() {
      DOM.elements.window.style.display = 'flex';
      DOM.elements.bubble.style.display = 'none';
      
      this.hideNotification();
      
      // Start qualification flow if it's the first time opening
      if (ChatFlow.history.length === 0) {
        if (!this.videoAdded) {
          // Add welcome video
          const videoMessage = this.createVideoMessage();
          DOM.elements.messages.appendChild(videoMessage);
          this.videoAdded = true;
          // Initial message will be triggered by video end event
        }
      }
    },
    
    closeChat() {
      DOM.elements.window.style.display = 'none';
      DOM.elements.bubble.style.display = 'flex';
      
      // Pause any playing videos
      const videos = DOM.elements.messages.querySelectorAll('video');
      videos.forEach(video => video.pause());
    },
    
    formatTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    getRandomDelay(min = Config.timing.minTypingDelay, max = Config.timing.maxTypingDelay) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    calculateTypingDelay(message, minDelay = 2000, maxDelay = 5000, apiLatency = 0) {
      // Base time proportional to message length
      const charCount = message.length;
      const baseDelay = Math.min(maxDelay, Math.max(minDelay, charCount * 15));
      
      // Adjust for API latency with minimum floor
      const adjustedDelay = Math.max(minDelay / 2, baseDelay - apiLatency);
      
      // Add randomness (±15%)
      const randomFactor = 1 + ((Math.random() * 0.3) - 0.15);
      return Math.round(adjustedDelay * randomFactor);
    },
    
    createVideoMessage() {
      const videoUrl = this.getVideoUrl();
      
      // Create message container
      const videoMessage = document.createElement('div');
      videoMessage.className = 'law-chat-message law-chat-message-bot';
      
      // Create message content container
      let messageContent = document.createElement('div');
      messageContent.className = 'law-chat-bubble-content';
      
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.className = 'law-chat-video';
      videoElement.controls = true;
      videoElement.autoplay = true;
      videoElement.muted = false;
      videoElement.playsInline = true;
      videoElement.src = videoUrl;
      
      // Set up video completion event
      this.addInitialMessageAfterVideo(videoElement);
      
      // Handle video errors
      videoElement.onerror = () => {
        console.log("Error loading video from primary source, trying alternate...");
        
        // Try alternate URL format as fallback
        const alternateUrl = videoUrl.replace('/raw/refs/heads/main/', '/main/');
        videoElement.src = alternateUrl;
        
        videoElement.onerror = () => {
          // Last resort - show error message instead
          this.handleVideoLoadError(messageContent, videoElement);
        };
      };
      
      // Assemble the message
      messageContent.appendChild(videoElement);
      videoMessage.appendChild(messageContent);
      
      // Add time stamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = this.formatTime();
      videoMessage.appendChild(timeStamp);
      
      return videoMessage;
    },
    
    getVideoUrl() {
      const currentPath = window.location.pathname.toLowerCase();
      let videoUrl = Config.videos.default;
      
      if (currentPath.includes('personal-injury')) {
        videoUrl = Config.videos['personal-injury'];
      } else if (currentPath.includes('criminal') || currentPath.includes('defense')) {
        videoUrl = Config.videos['criminal-defense'];
      } else if (currentPath.includes('divorce') || currentPath.includes('family')) {
        videoUrl = Config.videos.divorce;
      }
      
      return videoUrl;
    },
    
    handleVideoLoadError(container, videoElement) {
      // Remove video element if it exists in the container
      if (videoElement.parentNode === container) {
        container.removeChild(videoElement);
      }
      
      // Display error message
      const errorMessage = document.createElement('div');
      errorMessage.innerHTML = `
        <p style="margin-bottom: 10px;">Unable to load the introduction video. This could be due to network issues or because the video is unavailable.</p>
        <p>Let's continue with your consultation.</p>
      `;
      container.appendChild(errorMessage);
      
      // Proceed with initial message
      setTimeout(() => {
        this.showTypingIndicator();
        
        setTimeout(() => {
          this.hideTypingIndicator();
          Messages.addMessage("Hi there! I'm the virtual assistant here at Roth Davies. What type of case do you need help with?", false, [
            { value: 'personal-injury', text: 'Personal Injury' },
            { value: 'criminal-defense', text: 'Criminal Defense' },
            { value: 'divorce', text: 'Divorce' }
          ]);
        }, this.getRandomDelay());
      }, 2000);
    },
    
    addInitialMessageAfterVideo(videoElement) {
      // Add event listener for video completion
      videoElement.addEventListener('ended', () => {
        this.showTypingIndicator();
        
        setTimeout(() => {
          this.hideTypingIndicator();
          Messages.addMessage("Hi there! I'm the virtual assistant here at Roth Davies. What type of case do you need help with?", false, [
            { value: 'personal-injury', text: 'Personal Injury' },
            { value: 'criminal-defense', text: 'Criminal Defense' },
            { value: 'divorce', text: 'Divorce' }
          ]);
        }, this.getRandomDelay());
      });
      
      // Also handle video errors
      videoElement.addEventListener('error', () => {
        setTimeout(() => {
          this.showTypingIndicator();
          
          setTimeout(() => {
            this.hideTypingIndicator();
            Messages.addMessage("Hi there! I'm the virtual assistant here at Roth Davies. What type of case do you need help with?", false, [
              { value: 'personal-injury', text: 'Personal Injury' },
              { value: 'criminal-defense', text: 'Criminal Defense' },
              { value: 'divorce', text: 'Divorce' }
            ]);
          }, this.getRandomDelay());
        }, 1000);
      });
    }
  };
  
  // Messages Module - handles message creation, display, and user interactions
  const Messages = {

    // Add this method to the Messages module
// Add this method to the Messages module
// Updated typing effect method with fade-in
// Updated typing effect method with slower speed and fixed duplication issue
addMessageWithTypingEffect(content, isUser) {
  // For user messages, add immediately without typing effect
  if (isUser) {
    this.addMessage(content, true);
    return;
  }
  
  UI.showTypingIndicator();
  
  // Create a short delay before starting the typing effect
  setTimeout(() => {
    UI.hideTypingIndicator();
    
    // Create the message element
    const messageElement = document.createElement('div');
    messageElement.className = 'law-chat-message law-chat-message-bot';
    
    // Create message content container
    const messageContent = document.createElement('div');
    messageContent.className = 'law-chat-bubble-content';
    messageContent.innerHTML = ''; // Start empty
    messageElement.appendChild(messageContent);
    
    // Add timestamp
    const timeStamp = document.createElement('div');
    timeStamp.className = 'law-chat-time';
    timeStamp.textContent = UI.formatTime();
    messageElement.appendChild(timeStamp);
    
    // Add to chat
    DOM.elements.messages.appendChild(messageElement);
    DOM.scrollToBottom();
    
    // Calculate a much slower typing speed
    const totalChars = content.length;
    const minDuration = 4000; // Minimum 4 seconds for very short messages
    const maxDuration = 12000; // Maximum 12 seconds for very long messages
    
    // Scale duration based on content length
    const targetDuration = Math.min(maxDuration, 
      minDuration + (totalChars / 10) * 50); // Much slower scaling
    
    // Divide content into words for more natural typing
    const words = content.split(/\s+/);
    const totalWords = words.length;
    
    // Calculate time per word to achieve target duration
    const timePerWord = targetDuration / totalWords;
    
    let displayedWords = 0;
    
    const typeNextWord = () => {
      if (displayedWords >= totalWords) {
        // Typing complete
        // IMPORTANT: Only update the chat history here, don't add another message
        ChatFlow.history.push({
          role: "assistant",
          content: content
        });
        return;
      }
      
      // Create a container for the new word with fade-in effect
      const wordSpan = document.createElement('span');
      wordSpan.className = 'law-chat-typed-word';
      
      // Add proper spacing between words
      if (displayedWords > 0) {
        wordSpan.textContent = ' ' + words[displayedWords];
      } else {
        wordSpan.textContent = words[displayedWords];
      }
      
      wordSpan.style.opacity = '0';
      
      // Append the word to the message
      messageContent.appendChild(wordSpan);
      
      // Trigger the fade-in effect
      setTimeout(() => {
        wordSpan.style.opacity = '1';
      }, 10);
      
      // Move to next word
      displayedWords++;
      
      // Schedule the next word with more variation for natural effect
      // Base timing is slower, plus 20-100% random variation
      const baseDelay = timePerWord;
      const randomFactor = 0.2 + (Math.random() * 0.8); // 20-100% variation
      setTimeout(typeNextWord, baseDelay * randomFactor);
      
      DOM.scrollToBottom();
    };
    
    // Start the typing effect
    setTimeout(typeNextWord, 200);
  }, 300);
},

// Add this method to the Messages module
addOnlyRecommendationsWithCustomHeading(recommendations, headingText) {
  UI.hideTypingIndicator();
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = 'law-chat-message law-chat-message-bot';
  
  // Create recommendations container
  const recommendationsDiv = document.createElement('div');
  recommendationsDiv.className = 'law-chat-recommendations';
  
  // Add custom heading
  const heading = document.createElement('h4');
  heading.textContent = headingText || 'Our attorneys wrote these resources for you:';
  recommendationsDiv.appendChild(heading);
  
  // Create list for recommendations
  const linkList = document.createElement('ul');
  linkList.className = 'law-chat-recommendation-list';
  
  // Add each recommendation
  recommendations.forEach(rec => {
    let cleanTitle = rec.title || 'Resource';
    if (cleanTitle.includes('|')) {
      cleanTitle = cleanTitle.split('|')[0].trim();
    }
    
    const listItem = document.createElement('li');
    
    const link = document.createElement('a');
    link.className = 'law-chat-recommendation-link';
    link.href = rec.url || '#';
    link.textContent = cleanTitle;
    link.target = '_blank';
    
    listItem.appendChild(link);
    linkList.appendChild(listItem);
  });
  
  recommendationsDiv.appendChild(linkList);
  messageElement.appendChild(recommendationsDiv);
  
  // Add timestamp
  const timeStamp = document.createElement('div');
  timeStamp.className = 'law-chat-time';
  timeStamp.textContent = UI.formatTime();
  messageElement.appendChild(timeStamp);
  
  // Add to chat
  DOM.elements.messages.appendChild(messageElement);
  DOM.scrollToBottom();
},


      // Add this method to the Messages module to handle sources from DocsBots
      addMessageWithSources(content, sources) {
        UI.hideTypingIndicator();
        
        // Create the message element
        const messageElement = document.createElement('div');
        messageElement.className = 'law-chat-message law-chat-message-bot';
        
        // Add content
        let messageContent = document.createElement('div');
        messageContent.className = 'law-chat-bubble-content';
        messageContent.innerHTML = content;
        messageElement.appendChild(messageContent);
        
        // Create sources container if we have sources
        if (sources && sources.length > 0) {
          const sourcesDiv = document.createElement('div');
          sourcesDiv.className = 'law-chat-recommendations';
          
          // Add heading
          const heading = document.createElement('h4');
          heading.textContent = 'Sources:';
          sourcesDiv.appendChild(heading);
          
          // Create list for sources
          const sourceList = document.createElement('ul');
          sourceList.className = 'law-chat-recommendation-list';
          
          // Add each source as a list item
          sources.slice(0, 3).forEach(source => {
            const listItem = document.createElement('li');
            
            if (source.url) {
              const link = document.createElement('a');
              link.className = 'law-chat-recommendation-link';
              link.href = source.url;
              link.textContent = source.title || 'Source';
              link.target = '_blank';
              listItem.appendChild(link);
            } else {
              listItem.textContent = source.title || 'Source';
            }
            
            sourceList.appendChild(listItem);
          });
          
          sourcesDiv.appendChild(sourceList);
          messageElement.appendChild(sourcesDiv);
        }
        
        // Add timestamp
        const timeStamp = document.createElement('div');
        timeStamp.className = 'law-chat-time';
        timeStamp.textContent = UI.formatTime();
        messageElement.appendChild(timeStamp);
        
        // Add to chat
        DOM.elements.messages.appendChild(messageElement);
        DOM.scrollToBottom();
        
        // Update chat history
        ChatFlow.history.push({
          role: "assistant",
          content: content
        });
      },
    // Add a message to the chat
    addMessage(content, isUser, options = null) {
      // For user messages, add immediately
      if (isUser) {
        const messageClass = 'law-chat-message-user';
        const messageTime = UI.formatTime();
        
        const messageElement = document.createElement('div');
        messageElement.className = `law-chat-message ${messageClass}`;
        
        let messageContent = `<div class="law-chat-bubble-content">${content}</div>`;
        messageContent += `<div class="law-chat-time">${messageTime}</div>`;
        messageElement.innerHTML = messageContent;
        
        DOM.elements.messages.appendChild(messageElement);
        DOM.scrollToBottom();
        
        // Update chat history
        ChatFlow.history.push({
          role: "user",
          content: content
        });
        return;
      }
      
      // For bot messages, show typing and delay (keep the existing code for non-API responses)
      UI.showTypingIndicator();
      
      // Calculate appropriate delay - Note: We're keeping this for non-API messages
      const delay = options ? 
        UI.getRandomDelay() : 
        UI.calculateTypingDelay(content, 2000, 5000, UI.apiLatency);
      
      // Create timer for delay
      setTimeout(() => {
        UI.hideTypingIndicator();
        
        const messageClass = 'law-chat-message-bot';
        const messageTime = UI.formatTime();
        
        const messageElement = document.createElement('div');
        messageElement.className = `law-chat-message ${messageClass}`;
        
        let messageHTML = `<div class="law-chat-bubble-content">${content}</div>`;
        
        // Add options if provided
        if (options) {
          messageHTML += `
            <div class="law-chat-options">
              ${options.map(option => 
                `<div class="law-chat-option" data-value="${option.value}">${option.text}</div>`
              ).join('')}
            </div>
          `;
        }
        
        messageHTML += `<div class="law-chat-time">${messageTime}</div>`;
        messageElement.innerHTML = messageHTML;
        
        DOM.elements.messages.appendChild(messageElement);
        DOM.scrollToBottom();
        
        // Add click event listeners to options
        if (options) {
          const optionElements = messageElement.querySelectorAll('.law-chat-option');
          optionElements.forEach(optionElement => {
            optionElement.addEventListener('click', function() {
              const selectedValue = this.getAttribute('data-value');
              const selectedText = this.textContent;
              ChatFlow.handleOptionSelection(selectedValue, selectedText);
            });
          });
        }
        
        // Update chat history for non-option messages
        if (!options) {
          ChatFlow.history.push({
            role: "assistant",
            content: content
          });
        }
      }, delay);

      if (!isUser && !options) {
        // Use a longer timeout to ensure all DOM updates and animations are complete
        setTimeout(() => {
          this.disableCompletedOptions();
        }, 500);
      }
    },
    
    // Add recommendations with content
    addMessageWithRecommendations(content, recommendations) {
      UI.hideTypingIndicator();
      
      // Create the message element
      const messageElement = document.createElement('div');
      messageElement.className = 'law-chat-message law-chat-message-bot';
      
      // Create the recommendations container
      const recommendationsDiv = document.createElement('div');
      recommendationsDiv.className = 'law-chat-recommendations';
      
      // Add heading
      const heading = document.createElement('h4');
      heading.textContent = 'Resources our attorneys have written for your case:';
      recommendationsDiv.appendChild(heading);
      
      // Create list for recommendations
      const linkList = document.createElement('ul');
      linkList.className = 'law-chat-recommendation-list';
      
      // Add each recommendation as a list item
      recommendations.forEach(rec => {
        // Clean the title (remove suffix after | character)
        let cleanTitle = rec.title || 'Resource';
        if (cleanTitle.includes('|')) {
          cleanTitle = cleanTitle.split('|')[0].trim();
        }
        
        // Create list item with link
        const listItem = document.createElement('li');
        
        const link = document.createElement('a');
        link.className = 'law-chat-recommendation-link';
        link.href = rec.url || '#';
        link.textContent = cleanTitle;
        link.target = '_blank'; // Open in new tab
        
        listItem.appendChild(link);
        linkList.appendChild(listItem);
      });
      
      // Add the list to recommendations div
      recommendationsDiv.appendChild(linkList);
      
      // Add the recommendations to the message element
      messageElement.appendChild(recommendationsDiv);
      
      // Add content if provided
      if (content && content.trim() !== "") {
        let messageContent = document.createElement('div');
        messageContent.className = 'law-chat-bubble-content';
        messageContent.innerHTML = content;
        messageElement.appendChild(messageContent);
      }
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      messageElement.appendChild(timeStamp);
      
      // Add to chat
      DOM.elements.messages.appendChild(messageElement);
      DOM.scrollToBottom();
      
      // Update chat history if content provided
      if (content && content.trim() !== "") {
        ChatFlow.history.push({
          role: "assistant",
          content: content
        });
      }
    },
    
    // Add only recommendations without content
    // Make sure the Messages.addOnlyRecommendations method looks like this:
addOnlyRecommendations(recommendations) {
  UI.hideTypingIndicator();
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = 'law-chat-message law-chat-message-bot';
  
  // Create recommendations container
  const recommendationsDiv = document.createElement('div');
  recommendationsDiv.className = 'law-chat-recommendations';
  
  // Add heading
  const heading = document.createElement('h4');
  heading.textContent = 'Our attorneys wrote these resources for you:';
  recommendationsDiv.appendChild(heading);
  
  // Create list for recommendations
  const linkList = document.createElement('ul');
  linkList.className = 'law-chat-recommendation-list';
  
  // Add each recommendation
  recommendations.forEach(rec => {
    let cleanTitle = rec.title || 'Resource';
    if (cleanTitle.includes('|')) {
      cleanTitle = cleanTitle.split('|')[0].trim();
    }
    
    const listItem = document.createElement('li');
    
    const link = document.createElement('a');
    link.className = 'law-chat-recommendation-link';
    link.href = rec.url || '#';
    link.textContent = cleanTitle;
    link.target = '_blank';
    
    listItem.appendChild(link);
    linkList.appendChild(listItem);
  });
  
  recommendationsDiv.appendChild(linkList);
  messageElement.appendChild(recommendationsDiv);
  
  // Add timestamp
  const timeStamp = document.createElement('div');
  timeStamp.className = 'law-chat-time';
  timeStamp.textContent = UI.formatTime();
  messageElement.appendChild(timeStamp);
  
  // Add to chat
  DOM.elements.messages.appendChild(messageElement);
  DOM.scrollToBottom();
},

    // Add to Messages module
    addDisclaimerMessage() {
      const message = "Utilizing this chat service does not create an attorney-client relationship. Because there is not an attorney-client relationship, the chat service is not confidential or privileged. Any information communicated in this chat is not legal advice. Some of the responses may utilize AI based on the content of our website. Do you agree?";
      
      Messages.addMessage(message, false, [
        { value: 'agree', text: 'I Agree' },
        { value: 'decline', text: 'I Do Not Agree' }
      ]);
    },

    // Disable options and inputs for completed steps
    // Revise this method in the Messages module
    disableCompletedOptions() {
      // Only disable options from previous conversation stages
      const currentStage = ChatFlow.stage;
      
      // Case type options should be disabled if we're past that stage
      if (currentStage !== 'initial') {
        const caseTypeOptions = document.querySelectorAll('.law-chat-option[data-value="personal-injury"], .law-chat-option[data-value="criminal-defense"], .law-chat-option[data-value="divorce"]');
        caseTypeOptions.forEach(option => {
          if (option.dataset.selected === 'true') {
            option.classList.add('selected');
          } else {
            option.classList.add('completed');
          }
          option.style.pointerEvents = 'none'; // Disable interactions
        });
      }
      
      // Location options should be disabled if we're past that stage
      if (currentStage !== 'initial' && currentStage !== 'caseType') {
        const locationOptions = document.querySelectorAll('.law-chat-option[data-value="kansas"], .law-chat-option[data-value="missouri"], .law-chat-option[data-value="other"]');
        locationOptions.forEach(option => {
          if (option.dataset.selected === 'true') {
            option.classList.add('selected');
          } else {
            option.classList.add('completed');
          }
          option.style.pointerEvents = 'none'; // Disable interactions
        });
      }
      
      // Referral options should be disabled if we're past that stage
      if (currentStage !== 'initial' && currentStage !== 'caseType' && currentStage !== 'location') {
        const referralOptions = document.querySelectorAll('.law-chat-option[data-value="yes-referral"], .law-chat-option[data-value="no-thanks"]');
        referralOptions.forEach(option => {
          if (option.dataset.selected === 'true') {
            option.classList.add('selected');
          } else {
            option.classList.add('completed');
          }
          option.style.pointerEvents = 'none'; // Disable interactions
        });
      }
      
      // Disclaimer options should be disabled if we're qualified
      if (currentStage === 'qualified') {
        const disclaimerOptions = document.querySelectorAll('.law-chat-option[data-value="agree"], .law-chat-option[data-value="decline"]');
        disclaimerOptions.forEach(option => {
          if (option.dataset.selected === 'true') {
            option.classList.add('selected');
          } else {
            option.classList.add('completed');
          }
          option.style.pointerEvents = 'none'; // Disable interactions
        });
      }
      
      // Disable name inputs if we're past the name stage
      if (currentStage !== 'name-collection' && ChatFlow.userName) {
        const nameInputs = document.querySelectorAll('.law-chat-name-input');
        const nameSubmits = document.querySelectorAll('.law-chat-name-submit');
        
        nameInputs.forEach(input => {
          input.classList.add('completed');
          input.disabled = true;
        });
        
        nameSubmits.forEach(button => {
          button.classList.add('completed');
          button.disabled = true;
        });
      }
      
      // Disable phone inputs if we're past the phone stage
      if (currentStage !== 'phone-collection' && 
        (currentStage === 'disclaimer' || currentStage === 'qualified')) {
        const phoneInputs = document.querySelectorAll('.law-chat-phone-input');
        const phoneSubmits = document.querySelectorAll('.law-chat-phone-submit');
        
        phoneInputs.forEach(input => {
          input.classList.add('completed');
          input.disabled = true;
        });
        
        phoneSubmits.forEach(button => {
          button.classList.add('completed');
          button.disabled = true;
        });
      }
    },

    createNameInputForm(isReferral = false) {
      // Create the message
      const nameMessage = document.createElement('div');
      nameMessage.className = 'law-chat-message law-chat-message-bot';
      
      // Create content
      const nameContent = document.createElement('div');
      nameContent.className = 'law-chat-bubble-content';
      
      // Different text based on if it's a referral
      if (isReferral) {
        nameContent.innerHTML = `
          <p>We'd be happy to refer you to an attorney in your area.</p>
          <p>First, could you please tell me your name?</p>
        `;
      } else {
        nameContent.innerHTML = `
          <p>Great! I'd be happy to discuss your ${ChatFlow.userCaseType} case in ${ChatFlow.getLocationDisplay()}.</p>
          <p>First, could you please tell me your name?</p>
        `;
      }
      
      // Add name form
      const nameForm = document.createElement('div');
      nameForm.className = 'law-chat-name-form';
      nameForm.innerHTML = `
        <div class="law-chat-name-input-container">
          <input type="text" class="law-chat-name-input" placeholder="Your name">
          <button class="law-chat-name-submit" disabled>Submit</button>
        </div>
      `;
      
      nameContent.appendChild(nameForm);
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      
      // Assemble everything
      nameMessage.appendChild(nameContent);
      nameMessage.appendChild(timeStamp);
      
      DOM.elements.messages.appendChild(nameMessage);
      DOM.scrollToBottom();
      
      // Add event listeners for the name input
      setTimeout(() => {
        // Get name input field and submit button
        const nameInput = document.querySelector('.law-chat-name-input');
        const submitButton = document.querySelector('.law-chat-name-submit');
        
        // Focus input
        nameInput.focus();
        
        // Validate input function
        const validateName = () => {
          submitButton.disabled = nameInput.value.trim().length === 0;
        };
        
        // Add input handler
        nameInput.addEventListener('input', validateName);
        
        // Handle enter key press
        nameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !submitButton.disabled) {
            submitButton.click();
          }
        });
        
        // Handle form submission
        // Update the name input form submission handler
      // Update in the createNameInputForm method
      submitButton.addEventListener('click', () => {
        const name = nameInput.value.trim();
        
        // Store name
        ChatFlow.userName = name;
        
        // Disable the name input and button
        nameInput.disabled = true;
        nameInput.classList.add('completed');
        submitButton.disabled = true;
        submitButton.classList.add('completed');
        
        // Add as user message
        this.addMessage(`My name is ${name}`, true);
        
        // Update flow state to phone collection
        ChatFlow.stage = 'phone-collection';
        
        // Show typing indicator before showing phone form
        UI.showTypingIndicator();
        
        // Use setTimeout to simulate typing delay
        setTimeout(() => {
          // Hide typing indicator
          UI.hideTypingIndicator();
          
          // Show phone collection form
          const isReferral = ChatFlow.userLocation === 'other';
          this.createPhoneInputForm(isReferral);
        }, UI.getRandomDelay()); // Use a random delay from the UI module for consistency
      });
      }, 100);
    },
    
    // Creates phone input form
    createPhoneInputForm(isReferral = false) {
      // Make sure typing indicator is hidden before creating the form
      UI.hideTypingIndicator();

      // Create the message
      const phoneMessage = document.createElement('div');
      phoneMessage.className = 'law-chat-message law-chat-message-bot';
      
      // Create content
      const phoneContent = document.createElement('div');
      phoneContent.className = 'law-chat-bubble-content';
      
      // Different text based on if it's a referral
      if (isReferral) {
        phoneContent.innerHTML = `
          <p>We'd be happy to refer you to an attorney in your area.</p>
          <p>Please provide your phone number so we can contact you:</p>
        `;
      } else {
        phoneContent.innerHTML = `
          <p>Great! I'd be happy to discuss your ${ChatFlow.userCaseType} case in ${ChatFlow.getLocationDisplay()}.</p>
          <p>To connect you with the right attorney, could you provide your phone number?</p>
        `;
      }
      
      // Add phone form
      const phoneForm = document.createElement('div');
      phoneForm.className = 'law-chat-phone-form';
      phoneForm.innerHTML = `
        <div class="law-chat-phone-input-container">
          <div class="law-chat-phone-prefix">(</div>
          <input type="tel" class="law-chat-phone-input area-code" maxlength="3" placeholder="000">
          <div class="law-chat-phone-separator">)</div>
          <input type="tel" class="law-chat-phone-input prefix" maxlength="3" placeholder="000">
          <div class="law-chat-phone-separator">-</div>
          <input type="tel" class="law-chat-phone-input line" maxlength="4" placeholder="0000">
          <button class="law-chat-phone-submit" disabled>Submit</button>
        </div>
        <div class="law-chat-phone-privacy">Your information is secure and will not be shared with third parties.</div>
      `;
      
      phoneContent.appendChild(phoneForm);
      
      // Add timestamp
      const timeStamp = document.createElement('div');
      timeStamp.className = 'law-chat-time';
      timeStamp.textContent = UI.formatTime();
      
      // Assemble everything
      phoneMessage.appendChild(phoneContent);
      phoneMessage.appendChild(timeStamp);
      
      DOM.elements.messages.appendChild(phoneMessage);
      DOM.scrollToBottom();
      
      // Add event listeners for the phone input
      setTimeout(() => {
        // Get phone input fields
        const areaCodeInput = document.querySelector('.law-chat-phone-input.area-code');
        const prefixInput = document.querySelector('.law-chat-phone-input.prefix');
        const lineInput = document.querySelector('.law-chat-phone-input.line');
        const submitButton = document.querySelector('.law-chat-phone-submit');
        
        // Focus first input
        areaCodeInput.focus();
        
        // Validate phone function
        const validatePhone = () => {
          const areaCode = areaCodeInput.value;
          const prefix = prefixInput.value;
          const line = lineInput.value;
          
          // Enable submit only when all fields are correctly filled
          submitButton.disabled = !(
            areaCode.length === 3 && 
            prefix.length === 3 && 
            line.length === 4 &&
            /^[0-9]+$/.test(areaCode) &&
            /^[0-9]+$/.test(prefix) &&
            /^[0-9]+$/.test(line)
          );
        };
        
        // Add input handlers
        [areaCodeInput, prefixInput, lineInput].forEach(input => {
          // Allow only numbers
          input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            validatePhone();
            
            // Auto-advance to next field when current is full
            if (e.target.value.length === parseInt(e.target.getAttribute('maxlength'))) {
              if (e.target === areaCodeInput) prefixInput.focus();
              if (e.target === prefixInput) lineInput.focus();
            }
          });
          
          // Handle backspace to go to previous field
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0) {
              if (e.target === lineInput) prefixInput.focus();
              if (e.target === prefixInput) areaCodeInput.focus();
            }
          });
        });
        
        // Handle form submission
        // Inside the createPhoneInputForm method, modify the submit button event listener:
        // Update the phone form submission handler
        // Update in the createPhoneInputForm method, in the submit button event listener
        submitButton.addEventListener('click', () => {
          const phoneNumber = `(${areaCodeInput.value}) ${prefixInput.value}-${lineInput.value}`;
          
          // Disable all phone inputs and button
          document.querySelectorAll('.law-chat-phone-input').forEach(input => {
            input.disabled = true;
            input.classList.add('completed');
          });
          submitButton.disabled = true;
          submitButton.classList.add('completed');
          
          // Submit phone to server
          API.submitPhoneNumber(phoneNumber, isReferral);
          
          // Add as user message
          this.addMessage(`My phone number is ${phoneNumber}`, true);
          
          // Update flow state to show disclaimer
          ChatFlow.stage = 'disclaimer';
          
          // Show typing indicator before showing disclaimer
          UI.showTypingIndicator();
          
          // Use setTimeout to simulate typing delay
          setTimeout(() => {
            // Hide typing indicator
            UI.hideTypingIndicator();
            
            // Show disclaimer message
            this.addDisclaimerMessage();
          }, UI.getRandomDelay()); // Use a random delay from the UI module
          
          // Ensure send button is enabled
          setTimeout(() => {
            DOM.elements.send.disabled = false;
          }, 500);
        });
      }, 100);
    }
  };
  
  // ChatFlow module - handles chat flow, user states, and qualification
  const ChatFlow = {
    stage: 'initial', // initial, caseType, location, phone-collection, qualified
    userCaseType: null,
    userLocation: null,
    userName: null,
    history: [],
    conversationId: null,
    caseDetailsProvided: false,

    disablePreviousOptions(selectedOption) {
      if (!selectedOption) return;
      
      // Mark the selected option
      selectedOption.classList.add('selected');
      
      // Disable all other options in this group
      const optionsGroup = selectedOption.closest('.law-chat-options');
      if (optionsGroup) {
        const siblingOptions = optionsGroup.querySelectorAll('.law-chat-option:not([data-selected="true"])');
        siblingOptions.forEach(option => {
          option.classList.add('completed');
          option.style.pointerEvents = 'none'; // Disable interactions
        });
      }
    },
    

// ChatFlow.handleUserMessage modification
handleUserMessage(message) {
  console.log("Handling user message:", message, "Stage:", this.stage);
  
  // Add message to UI
  Messages.addMessage(message, true);
  
  // Process based on current stage
  if (this.stage === 'qualified') {
    console.log("User is qualified, handling message");
    
    // Check if this is the first message after qualification (case description)
    if (!this.caseDetailsProvided) {
      console.log("First case details - sending directly to DocsBots API");
      this.caseDetailsProvided = true;
      
      // Send directly to DocsBots API instead of showing static recommendations
      API.sendMessageToDocsBot(message);
    } else {
      console.log("Regular conversation - sending to DocsBots");
      // For all subsequent messages, use the API
      API.sendMessageToDocsBot(message);
    }
  } else if (this.stage === 'initial') {
    // User hasn't selected case type yet
    Messages.addMessage("I understand you may have specific questions. To better assist you, please select the type of case you need help with from the options below:", false, [
      { value: 'personal-injury', text: 'Personal Injury' },
      { value: 'criminal-defense', text: 'Criminal Defense' },
      { value: 'divorce', text: 'Divorce' }
    ]);
  } else if (this.stage === 'caseType') {
    // User hasn't selected location yet
    Messages.addMessage("Thank you. Before we continue, please let me know if your case is in Kansas or Missouri:", false, [
      { value: 'kansas', text: 'Kansas' },
      { value: 'missouri', text: 'Missouri' },
      { value: 'other', text: 'Other State' }
    ]);
  }
},
    
    // Process option button selection
    // Modify the handleOptionSelection method
    handleOptionSelection(value, text) {
      // Store the selected option without disabling anything yet
      const selectedOption = event?.target || document.querySelector(`.law-chat-option[data-value="${value}"]`);
      if (selectedOption) {
        selectedOption.dataset.selected = 'true';
      }
      
      // Create natural-sounding response based on selection
      let naturalMessage = this.createNaturalResponse(value, text);
      
      // Add as user message
      Messages.addMessage(naturalMessage, true);
      
      // Process based on current stage (keep the existing logic)
      if (this.stage === 'initial') {
        this.userCaseType = value;
        this.stage = 'caseType';
        
        // Ask for location
        Messages.addMessage("Thank you. Is your case in Kansas or Missouri?", false, [
          { value: 'kansas', text: 'Kansas' },
          { value: 'missouri', text: 'Missouri' },
          { value: 'other', text: 'Other State' }
        ]);
        
        // Only now disable the previous options
        setTimeout(() => {
          this.disablePreviousOptions(selectedOption);
        }, 100);
      } else if (this.stage === 'caseType') {
        this.userLocation = value;
        this.stage = 'location';
        
        if (value === 'kansas') {
          // Kansas handles all case types
          this.stage = 'name-collection';
          Messages.createNameInputForm();
        } else if (value === 'missouri' && this.userCaseType === 'personal-injury') {
          // Missouri only handles personal injury cases
          this.stage = 'name-collection';
          Messages.createNameInputForm();
        } else if (value === 'missouri' && 
                  (this.userCaseType === 'criminal-defense' || this.userCaseType === 'divorce')) {
          // Not qualified for Missouri criminal defense or divorce
          Messages.addMessage(`I'm sorry, but our firm only handles ${this.getCaseTypeDisplay()} cases in Kansas, not Missouri. Would you like to speak with one of our attorneys anyway to see if we can refer you to someone in Missouri?`, false, [
            { value: 'yes-referral', text: 'Yes, I\'d like a referral' },
            { value: 'no-thanks', text: 'No, thank you' }
          ]);
        } else {
          // Not qualified - in a state other than KS or MO
          Messages.addMessage("I'm sorry, but our firm only handles cases in Kansas and Missouri. Would you like to speak with one of our attorneys anyway to see if we can refer you to someone in your area?", false, [
            { value: 'yes-referral', text: 'Yes, I\'d like a referral' },
            { value: 'no-thanks', text: 'No, thank you' }
          ]);
        }
        
        // Only now disable the previous options
        setTimeout(() => {
          this.disablePreviousOptions(selectedOption);
        }, 100);
      } else if (this.stage === 'location' && (value === 'yes-referral' || value === 'no-thanks')) {
        if (value === 'yes-referral') {
          // Ask for name first
          this.stage = 'name-collection';
          Messages.createNameInputForm(true);
        } else {
          Messages.addMessage("I understand. If you have any other questions or change your mind, please feel free to ask. Is there anything else I can help with?", false);
          // Set as qualified so they can chat if they want
          this.stage = 'qualified';
        }
        
        // Only now disable the previous options
        setTimeout(() => {
          this.disablePreviousOptions(selectedOption);
        }, 100);
      } // Update this part in ChatFlow.handleOptionSelection
      else if (this.stage === 'disclaimer') {
        if (value === 'agree') {
          // User agreed to disclaimer, now they're qualified
          this.stage = 'qualified';
          this.caseDetailsProvided = false; // Reset this flag for the new conversation
          Messages.addMessage("Thank you. Could you tell me a little bit about your case?", false);
        } else {
          // User did not agree
          Messages.addMessage("I understand. Without your agreement, I cannot continue helping you. If you change your mind or have other questions, please feel free to chat with us again.", false);
          // Leave at disclaimer stage
        }
        
        // Only now disable the previous options
        setTimeout(() => {
          this.disablePreviousOptions(selectedOption);
        }, 100);
      }
    },
    
    // Create a natural-sounding message based on option selection
    // Add this to the createNaturalResponse method in ChatFlow
    createNaturalResponse(value, text) {
      if (this.stage === 'initial') {
        return `I need help with a ${text} case.`;
      } else if (this.stage === 'caseType') {
        return `My case is in ${text}.`;
      } else if (this.stage === 'location') {
        if (value === 'yes-referral') {
          return "Yes, I'd like to get a referral to an attorney in my area.";
        } else {
          return "No thanks, I don't need a referral at this time.";
        }
      } else if (this.stage === 'disclaimer') {
        if (value === 'agree') {
          return "I agree to the terms.";
        } else {
          return "I do not agree.";
        }
      }
      
      return text; // Default fallback
    },
    
    // Get formatted location text for display
    getLocationDisplay() {
      if (this.userLocation === 'kansas') return 'Kansas';
      if (this.userLocation === 'missouri') return 'Missouri';
      if (this.userLocation === 'other') return 'your area';
      return this.userLocation || 'your area';
    },
    
    // Get formatted case type for display
    getCaseTypeDisplay() {
      if (this.userCaseType === 'personal-injury') return 'Personal Injury';
      if (this.userCaseType === 'criminal-defense') return 'Criminal Defense';
      if (this.userCaseType === 'divorce') return 'Divorce';
      return this.userCaseType || 'Legal';
    }
  };
  
  // API Module - handles all API calls to external services
// Replace the previous API implementation with these methods
const API = {
  shownSourceUrls: new Set(),
  firstRecommendationShown: false,
  // Method to get resources for the first case description
  async getResourcesForCase(message) {
  UI.showTypingIndicator();
  const startTime = Date.now();
  
  try {
    // Generate a conversationId if not exists
    if (!ChatFlow.conversationId) {
      ChatFlow.conversationId = this.generateUUID();
    }
    
    // DocsBots API Request for resources
    const requestBody = {
      conversationId: ChatFlow.conversationId,
      question: message,
      metadata: { 
        name: ChatFlow.userName || "Visitor", 
        caseType: ChatFlow.userCaseType || "",
        location: ChatFlow.userLocation || "" 
      },
      context_items: 5,
      human_escalation: false,
      followup_rating: false,
      document_retriever: true,
      full_source: true, // Get full source content
      stream: false // Don't stream for resource lookup
    };
    
    // Make the API request to DocsBots
    const response = await fetch(`https://api.docsbot.ai/teams/${Config.docsbot.teamId}/bots/${Config.docsbot.botId}/chat-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Config.docsbot.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`DocsBots API error: ${response.status}`);
    }
    
    const responseData = await response.json();
    UI.hideTypingIndicator();
    
    // Extract sources from the response - handle both array and object response formats
    let sources = [];
    if (Array.isArray(responseData)) {
      // If responseData is an array, iterate through it
      for (const event of responseData) {
        if (event.event === 'lookup_answer' && event.data && event.data.sources) {
          sources = event.data.sources;
          break;
        }
      }
    } else if (typeof responseData === 'object' && responseData !== null) {
      // If responseData is an object, check if it has a data property with sources
      if (responseData.data && responseData.data.sources) {
        sources = responseData.data.sources;
      } else if (responseData.sources) {
        sources = responseData.sources;
      }
    }
    
    // Convert sources to recommendations format
    if (sources && sources.length > 0) {
      const recommendations = sources.slice(0, 3).map(source => ({
        title: source.title || "Resource",
        url: source.url || "#",
        snippet: source.content ? source.content.substring(0, 100) + "..." : "Additional resource",
        category: ChatFlow.userCaseType || "Legal"
      }));
      
      // Display recommendations
      if (recommendations.length > 0) {
        Messages.addOnlyRecommendations(recommendations);
        UI.recommendationsShown = true;
      }
    } else {
      // Fallback to dummy recommendations if no sources
      const fallbackRecommendations = this.getDummyRecommendations(message);
      if (fallbackRecommendations.length > 0) {
        Messages.addOnlyRecommendations(fallbackRecommendations);
        UI.recommendationsShown = true;
      }
    }
    
    // Add transition message after showing resources
    setTimeout(() => {
      const transitionMessage = "Thanks for sharing details about your case. Above are some resources we've written that might be helpful. It's always best to talk with one of our attorneys who can give advice tailored to your specific situation. We'd be happy to give you a call to discuss this further. In the meantime, feel free to ask me any questions, and I'll answer them!";
      Messages.addMessage(transitionMessage, false);
      
      // Update history with user message and transition message
      ChatFlow.history.push({ role: "user", content: message });
      ChatFlow.history.push({ role: "assistant", content: transitionMessage });
    }, 1000);
    
    UI.apiLatency = Date.now() - startTime;
  } catch (error) {
    console.error("Error fetching resources:", error);
    UI.apiLatency = Date.now() - startTime;
    UI.hideTypingIndicator();
    
    // Fallback to dummy recommendations
    const fallbackRecommendations = this.getDummyRecommendations(message);
    if (fallbackRecommendations.length > 0) {
      Messages.addOnlyRecommendations(fallbackRecommendations);
    }
    
    // Add transition message
    setTimeout(() => {
      const transitionMessage = "Thanks for sharing details about your case. I've included some resources that might be helpful. Feel free to ask me any questions, and I'll do my best to assist you.";
      Messages.addMessage(transitionMessage, false);
      
      // Update history
      ChatFlow.history.push({ role: "user", content: message });
      ChatFlow.history.push({ role: "assistant", content: transitionMessage });
    }, 1000);
  }
},
  
  // Method to handle normal conversation with DocsBots
// Completely replace the API.sendMessageToDocsBot method with this basic implementation
async sendMessageToDocsBot(message) {
  console.log("Sending message to DocsBots:", message);
  UI.showTypingIndicator();
  
  try {
    // Generate a conversationId if not exists
    if (!ChatFlow.conversationId) {
      ChatFlow.conversationId = this.generateUUID();
      console.log("Generated new conversation ID:", ChatFlow.conversationId);
    }
    
    // Check if this is the first message after qualification
    const isFirstMessage = ChatFlow.caseDetailsProvided && 
                         (!ChatFlow.history.some(item => item.role === "assistant" && 
                                               item.content !== "Thank you. Could you tell me a little bit about your case?"));
    
    // Prepare conversation history for the API in the format it expects
    // Most LLM APIs expect a messages array with role and content
    const conversationHistory = ChatFlow.history.map(item => ({
      role: item.role,
      content: item.content
    }));
    
    // Enhance metadata for better context
    const enhancedMetadata = { 
      name: ChatFlow.userName || "Visitor",
      caseType: ChatFlow.userCaseType || "",
      location: ChatFlow.userLocation || "",
      isFirstContact: isFirstMessage
    };
    
    console.log("Is first detailed message:", isFirstMessage);
    console.log("Sending conversation history of length:", conversationHistory.length);
    
    // DocsBots API Request
    const requestBody = {
      conversationId: ChatFlow.conversationId,
      question: message,
      conversation_history: conversationHistory,  // Add full conversation history
      metadata: enhancedMetadata,
      context_items: isFirstMessage ? 5 : 3, // Retrieve more context for first message
      human_escalation: false,
      followup_rating: false,
      document_retriever: true,
      full_source: true,
      stream: false
    };
    
    console.log("DocsBots request payload:", requestBody);
    
    // Make the API request to DocsBots
    const response = await fetch(`https://api.docsbot.ai/teams/${Config.docsbot.teamId}/bots/${Config.docsbot.botId}/chat-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Config.docsbot.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log("DocsBots response status:", response.status);
    
    // If response is not OK, fall back
    if (!response.ok) {
      console.error("DocsBots API error:", response.status, response.statusText);
      throw new Error(`DocsBots API error: ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log("DocsBots raw response:", responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse DocsBots response as JSON:", e);
      throw new Error("Invalid response format");
    }
    
    console.log("DocsBots parsed response:", responseData);
    
    UI.hideTypingIndicator();
    
    // Extract answer and sources from response
let answer = null;
let sources = [];

// Try multiple approaches to find the answer and sources in the response
if (Array.isArray(responseData)) {
  console.log("Processing array response");
  // Find the lookup_answer event
  for (const event of responseData) {
    console.log("Processing event:", event);
    if (event && event.event === 'lookup_answer' && event.data) {
      if (event.data.answer) {
        answer = event.data.answer;
        console.log("Found answer in lookup_answer event:", answer);
      }
      
      // Extract sources from the response
      if (event.data.sources && Array.isArray(event.data.sources)) {
        sources = event.data.sources;
        console.log("Found sources in lookup_answer event:", sources);
      }
    }
  }
} else if (responseData && typeof responseData === 'object') {
  console.log("Processing object response");
  // Look for answer in various places
  if (responseData.data && responseData.data.answer) {
    answer = responseData.data.answer;
    console.log("Found answer in responseData.data.answer:", answer);
    
    // Also check for sources here
    if (responseData.data.sources && Array.isArray(responseData.data.sources)) {
      sources = responseData.data.sources;
      console.log("Found sources in responseData.data.sources:", sources);
    }
  } else if (responseData.answer) {
    answer = responseData.answer;
    console.log("Found answer in responseData.answer:", answer);
    
    // Also check for sources here
    if (responseData.sources && Array.isArray(responseData.sources)) {
      sources = responseData.sources;
      console.log("Found sources in responseData.sources:", sources);
    }
  }
}
    
    // If no answer found, use generic fallback
    if (!answer) {
      console.warn("No answer found in DocsBots response");
      answer = "I'm sorry, but I don't have enough information to answer that question specifically. Our attorneys would be happy to discuss this during a consultation. Please call us at (913) 451-9500.";
    }
    
    console.log("Final answer to display:", answer);
console.log("Sources found:", sources ? sources.length : 0);

// Process and deduplicate sources
let uniqueSources = [];
let allSourcesAlreadyShown = true; // Flag to track if all sources have been shown before

if (sources && sources.length > 0) {
  // Create a map to track seen URLs to help with deduplication for this response
  const seenUrls = new Map();
  
  // Process each source
  sources.forEach(source => {
    const url = source.url || "";
    // Skip if we've seen this URL before in this response or if it's empty
    if (!seenUrls.has(url) && url && url.trim() !== "") {
      seenUrls.set(url, true);
      
      // Check if this source has been shown to the user before
      const isNewSource = !API.shownSourceUrls.has(url);
      if (isNewSource) {
        allSourcesAlreadyShown = false; // At least one new source
      }
      
      uniqueSources.push({
        title: source.title || "Resource",
        url: url,
        snippet: source.content ? source.content.substring(0, 100) + "..." : "Additional resource",
        category: ChatFlow.userCaseType || "Legal",
        isNew: isNewSource
      });
    }
  });
  
  // Filter to only include new sources if there are any
  const newSources = uniqueSources.filter(source => source.isNew);
  
  // If we have new sources, use those, otherwise keep all (up to 2)
  uniqueSources = newSources.length > 0 ? newSources : uniqueSources;
  
  // Limit to top 2 unique sources
  uniqueSources = uniqueSources.slice(0, 2);
  
  // Mark these sources as shown for future reference
  uniqueSources.forEach(source => {
    API.shownSourceUrls.add(source.url);
  });
  
  console.log("Unique sources to display:", uniqueSources);
}

if (uniqueSources && uniqueSources.length > 0 && !allSourcesAlreadyShown) {
  console.log("Adding recommendations bubble with sources:", uniqueSources);
  
  // Determine the appropriate heading
  let headingText;
  if (!API.firstRecommendationShown) {
    headingText = "Our attorneys wrote these resources for you:";
    API.firstRecommendationShown = true;
  } else {
    headingText = "Based on the conversation, this resource may be tailored to you too:";
  }
  
  // Add the recommendations immediately
  Messages.addOnlyRecommendationsWithCustomHeading(uniqueSources, headingText);
  
  // Short delay before starting the typing effect of the main response
  setTimeout(() => {
    // Add the answer to the chat with typing effect
    Messages.addMessageWithTypingEffect(answer, false);
  }, 300);
} else {
  // No recommendations to show, just add the answer with typing effect
  Messages.addMessageWithTypingEffect(answer, false);
}

// Only update user message in chat history, the bot response is updated in the typing effect
ChatFlow.history.push({ role: "user", content: message });
    
  } catch (error) {
    console.error("Error in sendMessageToDocsBot:", error);
    UI.hideTypingIndicator();
    
    // Simple fallback
    const fallback = "I apologize, but I'm having trouble connecting to our knowledge base at the moment. For immediate assistance, please call our office at (913) 451-9500.";
    Messages.addMessage(fallback, false);
    
    // Update conversation history
    ChatFlow.history.push({ role: "user", content: message });
    ChatFlow.history.push({ role: "assistant", content: fallback });
  }
},
  
  // Streaming response container implementation
  createStreamingResponseContainer() {
  UI.hideTypingIndicator();
  
  // Create the message element
  const messageElement = document.createElement('div');
  messageElement.className = 'law-chat-message law-chat-message-bot';
  
  // Create message content container
  const messageContent = document.createElement('div');
  messageContent.className = 'law-chat-bubble-content';
  messageContent.textContent = 'Thinking...'; // Start with a placeholder
  
  // Add timestamp
  const timeStamp = document.createElement('div');
  timeStamp.className = 'law-chat-time';
  timeStamp.textContent = UI.formatTime();
  
  // Assemble the message
  messageElement.appendChild(messageContent);
  messageElement.appendChild(timeStamp);
  
  // Add to chat
  DOM.elements.messages.appendChild(messageElement);
  DOM.scrollToBottom();
  
  return {
    // Update content as chunks arrive
    updateContent: (text) => {
      if (!text || !text.trim()) {
        text = "I'm processing your question...";
      }
      
      // Convert markdown to HTML if needed
      try {
        // Simple markdown to HTML conversion for basic formatting
        const formattedText = text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n/g, '<br>');
        
        messageContent.innerHTML = formattedText;
      } catch (e) {
        // Fallback to plain text if markdown conversion fails
        messageContent.textContent = text;
      }
      DOM.scrollToBottom();
    },
    
    // Finalize message when done
    finalize: () => {
      // Check if the content is still empty or just the placeholder
      if (!messageContent.textContent.trim() || 
          messageContent.textContent === 'Thinking...' ||
          messageContent.textContent === "I'm processing your question...") {
        messageContent.innerHTML = "I'm sorry, but I couldn't find specific information about that in our knowledge base. For questions about criminal charges, it's best to speak directly with one of our attorneys. Please call us at (913) 451-9500 for a confidential consultation.";
      }
      DOM.scrollToBottom();
    },
    
    // Remove the container entirely
    remove: () => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }
  };
},
  
  // UUID generator
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  // Fallback recommendations
  getDummyRecommendations(message) {
    const lowercaseMessage = message.toLowerCase();
    
    // Base set of recommendations that might be relevant
    const recommendations = [
      {
        title: "Car Accident Claims Guide",
        url: "/car-accident-claims-guide",
        snippet: "Learn about the steps to take after a car accident and how to maximize your compensation.",
        category: "Personal Injury"
      },
      {
        title: "Kansas Personal Injury Statute of Limitations",
        url: "/personal-injury-statute-of-limitations",
        snippet: "Important time limits for filing personal injury claims in Kansas.",
        category: "Personal Injury"
      },
      {
        title: "Drunk Driving Accidents: Victim's Rights",
        url: "/drunk-driving-victim-rights",
        snippet: "Information about your legal rights when injured by an intoxicated driver.",
        category: "Personal Injury"
      }
    ];
    
    // Return a subset of recommendations based on keywords
    const keywordMap = {
      "drunk": 2, // Index of drunk driving article
      "hit": 0,   // Index of car accident guide
      "accident": 0,
      "compensation": 0,
      "time": 1,   // Index of statute of limitations
      "deadline": 1,
      "kansas": 1,
      "missouri": 1
    };
    
    // Check for keywords in the message
    const matchedIndices = new Set();
    Object.keys(keywordMap).forEach(keyword => {
      if (lowercaseMessage.includes(keyword)) {
        matchedIndices.add(keywordMap[keyword]);
      }
    });
    
    // If specific keywords were found, return those recommendations
    if (matchedIndices.size > 0) {
      return Array.from(matchedIndices).map(index => recommendations[index]);
    }
    
    // If no specific keywords matched, return random 1-2 recommendations
    return recommendations.slice(0, Math.floor(Math.random() * 2) + 1);
  },
  
  // Process fallback response when API call fails
  processFallbackResponse(message) {
  UI.showTypingIndicator();
  
  // Default fallback
  let response = "Thank you for your question. Our team would be happy to provide more specific information during a free consultation. Would you like us to contact you to schedule a time to talk? You can reach us at (913) 451-9500.";
  
  // Check message against fallback dictionary
  const fallbackResponses = {
    "accident": "If you've been in an accident, your health is the first priority. Seek medical attention right away, even if you feel fine - some injuries aren't immediately apparent. Then, document everything you can about the accident and call us at (913) 451-9500 for a free consultation to discuss your legal options.",
    "worth": "Every personal injury case is unique. The value depends on factors like medical expenses, lost wages, pain and suffering, and long-term impacts. We offer a free consultation to evaluate your specific situation and give you a better understanding of what compensation you might expect.",
    "settlement": "Most personal injury cases settle before trial, but we prepare every case as if it will go to court. This approach often leads to better settlement offers. The timeline varies from a few months to over a year depending on case complexity and the extent of your injuries.",
    "fault": "Kansas follows a modified comparative negligence rule, meaning you can still recover damages even if you were partially at fault, as long as your fault is less than 50%. Your compensation may be reduced by your percentage of fault. We can evaluate your situation during a free consultation.",
    "fees": "We work on a contingency fee basis, which means you pay nothing upfront, and we only get paid if we win your case. Our fee is typically a percentage of your settlement or verdict. This arrangement allows anyone to access quality legal representation regardless of their financial situation.",
    "consultation": "We offer a free 30-minute consultation to discuss your case. You can schedule by calling (913) 451-9500. We also offer virtual consultations if that's more convenient for you.",
    "evidence": "Important evidence in personal injury cases includes medical records, accident reports, witness statements, photographs, video footage, and documentation of lost wages. The sooner you contact us, the better we can help preserve crucial evidence for your case.",
    "timeline": "Most personal injury cases resolve within 3-12 months, though complex cases can take longer. We work efficiently to reach a resolution while still pursuing maximum compensation for your injuries.",
    "drug": "Drug charges can have serious consequences, including potential jail time, fines, and a permanent criminal record that may affect your future employment and housing opportunities. The severity depends on the type and quantity of drugs involved, as well as your prior record. We recommend scheduling a confidential consultation with one of our criminal defense attorneys at (913) 451-9500 to discuss your specific situation.",
    "coke": "Drug possession charges can have serious consequences, even for first-time offenders. The penalties depend on the amount, your prior record, and other factors. Every case is unique, and it's important to get personalized legal advice. Our criminal defense attorneys can evaluate your situation and explain your options during a confidential consultation. Please call us at (913) 451-9500 to discuss your case."
  };
  
  // Check for keywords in the message
  const lowercaseMessage = message.toLowerCase();
  Object.keys(fallbackResponses).forEach(key => {
    if (lowercaseMessage.includes(key)) {
      response = fallbackResponses[key];
    }
  });
  
  // Special handling for sensitive criminal matters or drug references
  if (lowercaseMessage.includes("drugs") || 
      lowercaseMessage.includes("caught") || 
      lowercaseMessage.includes("arrest") || 
      lowercaseMessage.includes("trouble") ||
      lowercaseMessage.includes("jail") ||
      lowercaseMessage.includes("prison")) {
    response = "I understand your concern. Criminal charges can be serious, and the consequences vary based on many factors specific to your situation. For legal issues of this nature, it's best to speak directly with one of our attorneys who can provide confidential guidance. Please call us at (913) 451-9500 to schedule a consultation where we can discuss your case in detail.";
  }
  
  // Add fallback response after delay
  setTimeout(() => {
    Messages.addMessage(response, false);
    
    // Update conversation history
    ChatFlow.history.push({ role: "user", content: message });
    ChatFlow.history.push({ role: "assistant", content: response });
  }, UI.getRandomDelay(800, 1200));
},
  
// Submit phone number to server/SMS
submitPhoneNumber(phoneNumber, isReferral = false) {
  console.log(`Submitting phone number: ${phoneNumber}, Referral: ${isReferral}`);
  
  // Format case type and location for SMS
  const caseTypeText = ChatFlow.getCaseTypeDisplay();
  const locationText = ChatFlow.getLocationDisplay();
  const nameText = ChatFlow.userName || "Unknown"; // Get the user's name, default to "Unknown" if not available
  
  // Create message body for SMS with name included
  const messageBody = `Roth Davies Chatbot - New Incoming Client: ${nameText} - ${caseTypeText} case in ${locationText}. Phone: ${phoneNumber}`;
  
  // Send SMS via Twilio API
  fetch(`https://api.twilio.com/2010-04-01/Accounts/${Config.twilio.accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${Config.twilio.accountSid}:${Config.twilio.authToken}`)
    },
    body: new URLSearchParams({
      'To': Config.twilio.toNumber,
      'From': Config.twilio.fromNumber,
      'Body': messageBody
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Twilio SMS sent successfully:', data);
  })
  .catch(error => {
    console.error('Error sending Twilio SMS:', error);
    // Continue flow even if SMS fails
  });
  
  // Ensure send button is enabled after submission
  setTimeout(() => {
    DOM.elements.send.disabled = false;
  }, 500);
}};
  
  // Initialize the application
  DOM.initialize();

})();