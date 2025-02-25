
$(document).ready(function() {
    $("#form").submit(function(event) {
      event.preventDefault();
      var input_text = $("#message").val();
      var api_key = $("#api_key").val();
      $("#loading").show();
      $.ajax({
        type: "POST",
        url: "https://openrouter.ai/api/v1/chat/completions",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + api_key
        },
        data: JSON.stringify({
          "model": "meta-llama/llama-3.3-70b-instruct",
          "messages": [
            {
              "role": "user",
              "content": input_text
            }
          ]
        }),
        success: function(data) {
          $("#loading").hide();
          if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            var text = data.choices[0].message.content;
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