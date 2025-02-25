$(document).ready(function() {
    $("#form").submit(function(event) {
      event.preventDefault();
      var input_text = $("#message").val();
      var api_key = $("#api_key").val();
      $("#loading").show(); 
      $.ajax({
        type: "POST",
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + api_key,
        contentType: "application/json",
        data: JSON.stringify({
          "contents": [
            {
              "parts": [
                {
                  "text": input_text
                }
              ]
            }
          ]
        }),
        success: function(data) {
          $("#loading").hide(); 
          if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
            var text = data.candidates[0].content.parts[0].text;
            $("#result").append(`
              <div class="box">
                <p>${text}</p>
              </div>
            `);
          } else {
            $("#result").append(`
              <div class="box">
                <p>Not have data Structure</p>
              </div>
            `);
          }
        },
        error: function(xhr, status, error) {
          $("#loading").hide(); 
          $("#result").append(`
            <div class="box">
              <p>ERROR: ${error}</p>
            </div>
          `);
        }
      });
    });
  });
  