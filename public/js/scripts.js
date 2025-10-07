$(document).ready(function() {
  const apiUrl = "/api/goats"; // Your Express API endpoint

  // --- 1. Load all goats on page load ---
  function loadGoats() {
    $.ajax({
      url: apiUrl,
      method: "GET",
      dataType: "json",
      success: function(goats) {
        $("#goat-list").empty();
        goats.forEach(goat => {
          $("#goat-list").append(createGoatCard(goat));
        });
      },
      error: function(err) {
        console.error("Error fetching goats:", err);
      }
    });
  }

  // --- 2. Create a goat card ---
  function createGoatCard(goat) {
    return `
      <div class="col-md-4 mb-4" data-id="${goat._id}">
        <div class="card h-100">
          <img src="${goat.imageURL || 'https://via.placeholder.com/300'}" class="card-img-top" alt="${goat.name}">
          <div class="card-body">
            <h5 class="card-title">${goat.name} (${goat.breed})</h5>
            <p class="card-text">
              Age: ${goat.age} | Weight: ${goat.weight} kg<br>
              Temperament: ${goat.temperament || 'Unknown'}<br>
              Price: ${goat.price ? '$' + goat.price : 'N/A'}<br>
              Available: ${goat.available ? 'Yes' : 'No'}
            </p>
            <button class="btn btn-sm btn-warning edit-goat">Edit</button>
            <button class="btn btn-sm btn-danger delete-goat">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  // --- 3. Handle form submission for Add/Edit ---
  $("#goat-form").submit(function(e) {
    e.preventDefault();

    const goatData = {
      name: $("#name").val(),
      breed: $("#breed").val(),
      age: $("#age").val(),
      weight: $("#weight").val(),
      price: $("#price").val(),
      temperament: $("#temperament").val(),
      imageURL: $("#imageURL").val(),
      available: $("#available").is(":checked")
    };

    const goatId = $(this).data("edit-id");

    if (goatId) {
      // UPDATE existing goat
      $.ajax({
        url: `${apiUrl}/${goatId}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(goatData),
        success: function() {
          loadGoats();
          $("#goat-form")[0].reset();
          $("#goat-form").removeData("edit-id");
        }
      });
    } else {
      // CREATE new goat
      $.ajax({
        url: apiUrl,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(goatData),
        success: function() {
          loadGoats();
          $("#goat-form")[0].reset();
        }
      });
    }
  });

  // --- 4. Edit button click ---
  $(document).on("click", ".edit-goat", function() {
    const card = $(this).closest(".col-md-4");
    const goatId = card.data("id");

    $.ajax({
      url: `${apiUrl}/${goatId}`,
      method: "GET",
      dataType: "json",
      success: function(goat) {
        $("#name").val(goat.name);
        $("#breed").val(goat.breed);
        $("#age").val(goat.age);
        $("#weight").val(goat.weight);
        $("#price").val(goat.price);
        $("#temperament").val(goat.temperament);
        $("#imageURL").val(goat.imageURL);
        $("#available").prop("checked", goat.available);
        $("#goat-form").data("edit-id", goat._id);
      }
    });
  });

  // --- 5. Delete button click ---
  $(document).on("click", ".delete-goat", function() {
    const goatId = $(this).closest(".col-md-4").data("id");

    if (confirm("Are you sure you want to delete this goat?")) {
      $.ajax({
        url: `${apiUrl}/${goatId}`,
        method: "DELETE",
        success: function() {
          loadGoats();
        }
      });
    }
  });

  // --- Initial load ---
  loadGoats();
});
