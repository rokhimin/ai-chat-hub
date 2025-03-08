
// Shared global variables for API functions
let makeGeminiRequest;
let makeOpenRouterRequest;
let formatResponse;

$(document).ready(function() {
  // Model definitions
  const modelOptions = {
    gemini: [
      { id: "gemini-2.0-flash", name: "gemini 2.0 flash", supportsImages: true },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", supportsImages: true },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", supportsImages: true }
    ],
    openrouter: [
      // OpenAI models
      { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", supportsImages: false },
      { id: "openai/gpt-4", name: "GPT-4", supportsImages: true },
      { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", supportsImages: true },
      { id: "openai/gpt-4-vision", name: "GPT-4 Vision", supportsImages: true },
      // Anthropic models
      { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", supportsImages: true },
      { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet", supportsImages: true },
      { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", supportsImages: true },
      // DeepSeek models
      { id: "deepseek/deepseek-chat", name: "DeepSeek Chat", supportsImages: false },
      { id: "deepseek/deepseek-coder", name: "DeepSeek Coder", supportsImages: false },
      { id: "deepseek/deepseek-r1-distill-qwen-1.5b", name: "DeepSeek R1 Distill Qwen 1.5B", supportsImages: false },
      // Mistral models
      { id: "mistral/mistral-7b-instruct", name: "Mistral 7B Instruct", supportsImages: false },
      { id: "mistral/mixtral-8x7b-instruct", name: "Mixtral 8x7B Instruct", supportsImages: false },
      { id: "mistral/mistral-large", name: "Mistral Large", supportsImages: false },
      // Meta models
      { id: "meta/llama-3-8b-instruct", name: "Llama 3 8B Instruct", supportsImages: false },
      { id: "meta/llama-3-70b-instruct", name: "Llama 3 70B Instruct", supportsImages: false }
    ]
  };
  
  let currentApiProvider = "gemini";
  let currentModel = "gemini-1.5-flash";
  let uploadedImage = null;
  let chatHistory = [];
  
  // API Key storage keys
  const apiKeyStorageKeys = {
    gemini: "gemini_api_key",
    openrouter: "openrouter_api_key"
  };
  
  // Initialize the chat
  function initChat() {
    $("#chat-container").html(`
      <p><strong>AI Assistant:</strong> Hello! I'm ready to help. How can I assist you today?</p>
    `);
  }
  
  // Populate model selector
  function populateModelSelector() {
    const $selector = $("#model-selector");
    $selector.empty();
    
    const models = modelOptions[currentApiProvider];
    models.forEach(model => {
      $selector.append(`<option value="${model.id}">${model.name}${model.supportsImages ? " (supports images)" : ""}</option>`);
    });
    
    // Set default model
    currentModel = models[0].id;
    $selector.val(currentModel);
    
    // Update image upload availability
    updateImageUploadAvailability();
  }
  
  // Update API key helper text
  function updateApiKeyHelper() {
    let helperText = "";
    
    if (currentApiProvider === "gemini") {
      helperText = "Enter your Google Gemini API key";
    } else if (currentApiProvider === "openrouter") {
      helperText = "Enter your OpenRouter API key";
    }
    
    $("#api-key-help").text(helperText);
  }
  
  // Update image upload availability
  function updateImageUploadAvailability() {
    const models = modelOptions[currentApiProvider];
    const selectedModel = models.find(model => model.id === currentModel);
    
    if (selectedModel && selectedModel.supportsImages) {
      $("#image-upload").closest(".file").show();
    } else {
      $("#image-upload").closest(".file").hide();
      // Clear any uploaded image if model doesn't support images
      if (uploadedImage) {
        uploadedImage = null;
        $("#image-preview").attr("src", "");
        $("#image-preview-container").hide();
        $("#image-upload").val("");
      }
    }
  }
  
  // Load API key from localStorage
  function loadApiKey() {
    const storageKey = apiKeyStorageKeys[currentApiProvider];
    if (localStorage.getItem(storageKey)) {
      $("#api_key").val(localStorage.getItem(storageKey));
    } else {
      $("#api_key").val("");
    }
  }
  
  // Initialize page
  initChat();
  populateModelSelector();
  updateApiKeyHelper();
  loadApiKey();
  
  // API provider change handler
  $("#api-provider-selector").change(function() {
    currentApiProvider = $(this).val();
    populateModelSelector();
    updateApiKeyHelper();
    loadApiKey();
  });
  
  // Model change handler
  $("#model-selector").change(function() {
    currentModel = $(this).val();
    updateImageUploadAvailability();
  });
  
  // Toggle visibility of API key
  $("#toggle-visibility").click(function() {
    const apiKeyInput = $("#api_key");
    const icon = $(this).find("i");
    
    if (apiKeyInput.attr("type") === "password") {
      apiKeyInput.attr("type", "text");
      icon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      apiKeyInput.attr("type", "password");
      icon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  });
  
  // Image upload handler
  $("#image-upload").change(function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        uploadedImage = e.target.result;
        $("#image-preview").attr("src", uploadedImage);
        $("#image-preview-container").show();
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Remove image handler
  $("#remove-image").click(function() {
    uploadedImage = null;
    $("#image-preview").attr("src", "");
    $("#image-preview-container").hide();
    $("#image-upload").val("");
  });
  
  // Format AI response - Make this available globally
  formatResponse = function(text) {
    // Handle code blocks
    text = text.replace(/```([\s\S]*?)```/g, function(match, code) {
      return `<pre style="background-color: #121212; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>${code}</code></pre>`;
    });
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code style="background-color: #121212; padding: 2px 4px; border-radius: 2px;">$1</code>');
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  };
  
  // Get MIME type from dataURL
  function getMimeType(dataURL) {
    return dataURL.split(',')[0].split(':')[1].split(';')[0];
  }
  
  // Make request to OpenRouter API - Make this available globally
  makeOpenRouterRequest = function(inputText, apiKey, callback) {
    const messages = [];
    
    // Add chat history for context
    chatHistory.forEach(msg => {
      messages.push(msg);
    });
    
    // Create the new message
    const newMessage = {
      role: "user",
      content: []
    };
    
    // Add text content
    if (inputText) {
      newMessage.content.push({
        type: "text",
        text: inputText
      });
    }
    
    // Add image if available and model supports it
    if (uploadedImage) {
      const models = modelOptions[currentApiProvider];
      const selectedModel = models.find(model => model.id === currentModel);
      
      if (selectedModel && selectedModel.supportsImages) {
        // Extract base64 data
        const base64Data = uploadedImage.split(',')[1];
        const mimeType = getMimeType(uploadedImage);
        
        newMessage.content.push({
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`
          }
        });
      }
    }
    
    // Simplify content if it's just text
    if (newMessage.content.length === 1 && newMessage.content[0].type === "text") {
      newMessage.content = newMessage.content[0].text;
    }
    
    // Add message to array
    messages.push(newMessage);
    
    // Store latest user message in history
    chatHistory.push(newMessage);
    
    $.ajax({
      type: "POST",
      url: "https://openrouter.ai/api/v1/chat/completions",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "HTTP-Referer": window.location.href, // Required by OpenRouter
        "X-Title": "AI Chat Hub" // Optional but recommended
      },
      data: JSON.stringify({
        model: currentModel,
        messages: messages
      }),
      success: function(data) {
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          const aiMessage = data.choices[0].message;
          
          // Store AI response in history
          chatHistory.push({
            role: "assistant",
            content: aiMessage.content
          });
          
          // If history gets too long, trim it
          if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(chatHistory.length - 10);
          }
          
          callback(null, aiMessage.content);
        } else {
          callback("Failed to parse response", null);
        }
      },
      error: function(xhr, status, error) {
        let errorMessage = "Request failed";
        
        if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage = xhr.responseJSON.error.message || errorMessage;
        }
        
        callback(errorMessage, null);
      }
    });
  };
  
  // Make request to Google Gemini API - Make this available globally
  makeGeminiRequest = function(inputText, apiKey, callback) {
    // Prepare request data
    const requestData = {
      contents: [{
        parts: []
      }]
    };
    
    // Add text if available
    if (inputText) {
      requestData.contents[0].parts.push({
        text: inputText
      });
    }
    
    // Add image if available
    if (uploadedImage) {
      // Extract base64 data
      const base64Data = uploadedImage.split(',')[1];
      
      requestData.contents[0].parts.push({
        inline_data: {
          data: base64Data,
          mime_type: getMimeType(uploadedImage)
        }
      });
    }
    
    $.ajax({
      type: "POST",
      url: `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
      contentType: "application/json",
      data: JSON.stringify(requestData),
      success: function(data) {
        if (data && data.candidates && data.candidates[0] && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
          const text = data.candidates[0].content.parts[0].text;
          callback(null, text);
        } else {
          callback("Failed to parse response", null);
        }
      },
      error: function(xhr, status, error) {
        let errorMessage = "Request failed";
        
        if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage = xhr.responseJSON.error.message || errorMessage;
        }
        
        callback(errorMessage, null);
      }
    });
  };
  
  // Form submit handler
  $("#form").submit(function(event) {
    event.preventDefault();
    
    const inputText = $("#message").val().trim();
    const apiKey = $("#api_key").val().trim();
    
    // Validate input
    if ((!inputText && !uploadedImage) || !apiKey) {
      return;
    }
    
    // Save API key to localStorage
    const storageKey = apiKeyStorageKeys[currentApiProvider];
    localStorage.setItem(storageKey, apiKey);
    
    // Display user message
    let userMessageHtml = `<p class="mb-3"><strong>You:</strong> `;
    
    if (inputText) {
      userMessageHtml += inputText;
    }
    
    if (uploadedImage) {
      userMessageHtml += `<br><img src="${uploadedImage}" style="max-height: 200px; max-width: 100%; margin-top: 10px; border-radius: 4px;">`;
    }
    
    userMessageHtml += `</p>`;
    $("#chat-container").append(userMessageHtml);
    
    // Clear input
    $("#message").val("");
    
    // Show loading indicator
    $("#chat-container").append(`
      <p id="loading" class="mb-3"><strong>AI Assistant:</strong> <i>Thinking...</i></p>
    `);
    
    // Scroll to bottom
    $("#chat-container").scrollTop($("#chat-container")[0].scrollHeight);
    
    // Make API request based on provider
    if (currentApiProvider === "gemini") {
      makeGeminiRequest(inputText, apiKey, handleApiResponse);
    } else if (currentApiProvider === "openrouter") {
      makeOpenRouterRequest(inputText, apiKey, handleApiResponse);
    }
    
    // Clear uploaded image
    uploadedImage = null;
    $("#image-preview-container").hide();
    $("#image-upload").val("");
  });
  
  // Handle API response
  function handleApiResponse(error, response) {
    // Remove loading indicator
    $("#loading").remove();
    
    if (error) {
      // Display error message
      $("#chat-container").append(`
        <p class="mb-3"><strong>Error:</strong> ${error}</p>
      `);
    } else {
      // Display AI response
      $("#chat-container").append(`
        <p class="mb-3"><strong>AI Assistant:</strong> ${formatResponse(response)}</p>
      `);
    }
    
    // Scroll to bottom
    $("#chat-container").scrollTop($("#chat-container")[0].scrollHeight);
  }
});

// Speech to AI Implementation - Fixed version
document.addEventListener('DOMContentLoaded', function() {
  // Speech recognition & synthesis variables
  let recognition = null;
  let isListening = false;
  let isSpeaking = false;
  let speechTimeout;
  let transcript = '';
  let micPermissionGranted = false;
  
  // DOM Elements - Initialize references after the document is fully loaded
  const startVoiceBtn = document.getElementById('startVoiceBtn');
  const stopVoiceBtn = document.getElementById('stopVoiceBtn');
  const voiceStatus = document.getElementById('voiceStatus');
  const speechTranscript = document.getElementById('speechTranscript');
  
  // Check if elements exist
  if (!startVoiceBtn || !stopVoiceBtn || !voiceStatus || !speechTranscript) {
    console.error('Voice elements not found in DOM');
    return; // Exit if elements don't exist
  }
  
  // Request microphone permission
  async function requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Close the stream once we have permission
      stream.getTracks().forEach(track => track.stop());
      
      micPermissionGranted = true;
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      if (voiceStatus) {
        voiceStatus.textContent = 'Error: Microphone permission denied';
      }
      return false;
    }
  }
  
  // Initialize speech recognition
  async function initSpeechRecognition() {
    // Ensure we have microphone permission
    if (!micPermissionGranted) {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        return false;
      }
    }
    
    // Check browser support
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
      if (voiceStatus) {
        voiceStatus.textContent = 'Error: Speech recognition not supported in this browser';
      }
      return false;
    }
    
    // Create new recognition instance
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; // Indonesian language - change as needed
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      isListening = true;
      if (voiceStatus) {
        voiceStatus.innerHTML = '<i class="fas fa-circle text-danger mr-1"></i> Listening...';
      }
      if (startVoiceBtn) startVoiceBtn.disabled = true;
      if (stopVoiceBtn) stopVoiceBtn.disabled = false;
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscriptSegment = '';
      
      // Clear timeout whenever we get new speech
      clearTimeout(speechTimeout);
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptSegment = result[0].transcript;
          transcript += finalTranscriptSegment + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      if (speechTranscript) {
        speechTranscript.innerHTML = transcript + '<i class="has-text-grey">' + interimTranscript + '</i>';
      }
      
      // If we have a final transcript segment, start the speech pause timer
      if (finalTranscriptSegment) {
        speechTimeout = setTimeout(() => {
          // Only send to AI if we're not already speaking a response
          if (!isSpeaking && transcript.trim() !== '') {
            sendToAI(transcript.trim());
          }
        }, 1500); // Wait 1.5 seconds of silence before sending
      }
    };
    
    recognition.onerror = (event) => {
      if (voiceStatus) {
        voiceStatus.textContent = `Error: ${event.error}`;
      }
      
      // Restart recognition if it's not a fatal error
      if (event.error !== 'aborted' && event.error !== 'not-allowed' && isListening) {
        setTimeout(() => {
          if (isListening && recognition) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 1000);
      } else {
        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;
        isListening = false;
      }
    };
    
    recognition.onend = () => {
      // Restart recognition if we're still supposed to be listening
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          isListening = false;
          if (startVoiceBtn) startVoiceBtn.disabled = false;
          if (stopVoiceBtn) stopVoiceBtn.disabled = true;
          if (voiceStatus) {
            voiceStatus.textContent = 'Speech recognition error. Please try again.';
          }
        }
      } else {
        if (voiceStatus) {
          voiceStatus.textContent = 'Speech recognition stopped';
        }
        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;
      }
    };
    
    return true;
  }
  
  // Send recognized speech to AI
  function sendToAI(text) {
    if (!text) return;
    
    // Get current model and API key from the main app
    const apiKey = document.getElementById('api_key').value.trim();
    const currentApiProvider = document.getElementById('api-provider-selector').value;
    const currentModel = document.getElementById('model-selector').value;
    
    if (!apiKey) {
      appendAIMessage("Error: API key is required");
      return;
    }
    
    if (voiceStatus) {
      voiceStatus.innerHTML = '<i class="fas fa-sync fa-spin mr-1"></i> Sending to AI...';
    }
    
    // Pause listening while processing
    pauseListening();
    
    // FIX: Instead of appending user message and calling form submission
    // Just use the API directly
    appendUserMessage(text);
    
    // Use the globally defined API request functions
    if (currentApiProvider === "gemini") {
      if (typeof makeGeminiRequest === 'function') {
        makeGeminiRequest(text, apiKey, handleVoiceResponse);
      } else {
        handleVoiceResponse("Error: Gemini API function not available", null);
      }
    } else if (currentApiProvider === "openrouter") {
      if (typeof makeOpenRouterRequest === 'function') {
        makeOpenRouterRequest(text, apiKey, handleVoiceResponse);
      } else {
        handleVoiceResponse("Error: OpenRouter API function not available", null);
      }
    }
    
    // Reset transcript for next conversation
    transcript = '';
    if (speechTranscript) {
      speechTranscript.textContent = '';
    }
  }
  
  // Handle AI response for voice
  function handleVoiceResponse(error, response) {
    if (error) {
      if (voiceStatus) {
        voiceStatus.textContent = `Error: ${error}`;
      }
      resumeListening();
      return;
    }
    
    // Add the AI response to the chat
    appendAIMessage(response);
    
    // Clean text for speech synthesis
    const cleanedResponse = cleanTextForSpeech(response);
    
    // Speak the response
    speakResponse(cleanedResponse);
  }
  
  // Clean text for speech synthesis
  function cleanTextForSpeech(text) {
    // Remove special characters that cause poor speech synthesis
    return text.replace(/[*#$%^&\\|<>{}\[\]~`]/g, '')
              .replace(/\+/g, ' plus ')
              .replace(/=/g, ' equals ')
              .replace(/\-/g, ' ')  // Replace dash with space
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks
              .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
              .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }
  
  // Speak response using speech synthesis
  function speakResponse(text) {
    if (!text) return;
    
    if (!window.speechSynthesis) {
      if (voiceStatus) {
        voiceStatus.textContent = 'Error: Text-to-speech not supported in this browser';
      }
      resumeListening();
      return;
    }
    
    if (voiceStatus) {
      voiceStatus.innerHTML = '<i class="fas fa-volume-up mr-1"></i> Speaking...';
    }
    isSpeaking = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID'; // Indonesian language - change as needed
    
    utterance.onend = () => {
      if (voiceStatus) {
        voiceStatus.innerHTML = '<i class="fas fa-check mr-1"></i> Done speaking. Listening again...';
      }
      isSpeaking = false;
      
      // Resume listening after speaking
      if (isListening) {
        resumeListening();
      }
    };
    
    utterance.onerror = () => {
      if (voiceStatus) {
        voiceStatus.textContent = 'Error: Speech synthesis error';
      }
      isSpeaking = false;
      
      // Resume listening after error
      if (isListening) {
        resumeListening();
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }
  
  // Helper function to append user message to chat
  function appendUserMessage(text) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    chatContainer.innerHTML += `<p class="mb-3"><strong>You:</strong> ${text}</p>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Also update the message input to show the sent message
    const messageInput = document.getElementById('message');
    if (messageInput) {
      messageInput.value = text;
    }
    
    // FIX: No longer trigger form submission to avoid duplication
  }
  
  // Helper function to append AI message to chat
  function appendAIMessage(text) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    // Format the response using the existing formatResponse function
    // If it doesn't exist or is not accessible, use a simple version
    const formattedText = typeof formatResponse === 'function' 
      ? formatResponse(text) 
      : text.replace(/\n/g, '<br>');
    
    chatContainer.innerHTML += `<p class="mb-3"><strong>AI Assistant:</strong> ${formattedText}</p>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  // Pause listening
  function pauseListening() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  }
  
  // Resume listening
  function resumeListening() {
    if (recognition && isListening) {
      try {
        setTimeout(() => {
          recognition.start();
        }, 100);
      } catch (e) {
        console.error('Error starting recognition:', e);
        isListening = false;
        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;
      }
    }
  }
  
  // Start voice conversation
  async function startVoiceConversation() {
    // Reset states
    transcript = '';
    if (speechTranscript) {
      speechTranscript.textContent = '';
    }
    
    // Make sure we stop any existing recognition
    if (recognition) {
      try {
        recognition.stop();
        recognition = null;
      } catch (e) {
        console.error('Error stopping existing recognition:', e);
      }
    }
    
    // Set listening flag before initializing
    isListening = true;
    
    // Initialize a fresh recognition instance
    const success = await initSpeechRecognition();
    
    if (success && recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        isListening = false;
        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;
        if (voiceStatus) {
          voiceStatus.textContent = 'Failed to start speech recognition. Please try again.';
        }
      }
    }
  }
  
  // Stop voice conversation
  function stopVoiceConversation() {
    isListening = false;
    
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    isSpeaking = false;
    clearTimeout(speechTimeout);
    
    if (voiceStatus) {
      voiceStatus.textContent = 'Voice chat stopped';
    }
    
    if (startVoiceBtn) startVoiceBtn.disabled = false;
    if (stopVoiceBtn) stopVoiceBtn.disabled = true;
  }
  
  // Event listeners
  if (startVoiceBtn) {
    startVoiceBtn.addEventListener('click', startVoiceConversation);
  }
  
  if (stopVoiceBtn) {
    stopVoiceBtn.addEventListener('click', stopVoiceConversation);
  }
});