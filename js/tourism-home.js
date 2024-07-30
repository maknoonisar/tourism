
  // Initialize Mapbox
  mapboxgl.accessToken =
    "pk.eyJ1IjoibmVvYzIwMjMiLCJhIjoiY2x1aTBubHAwMjYzOTJqcGc2cGFhMHU2ciJ9.tFU9_qFCY02qCvfiPMPDUg";
  const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [70, 31],
      zoom: 5,
      pitch: 0,
  });

  

  // Add the control to the map.
  map.addControl(
      new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          countries: 'pk', // Restrict search to Pakistan
      bbox: [60.88, 23.70, 79.84, 37.09] // Bounding box for Pakistan [minLon, minLat, maxLon, maxLat]
      })
  );
// ===================================

let directionsControl = null;

document.getElementById('directions-button').addEventListener('click', function() {
  if (!directionsControl) {
      directionsControl = new MapboxDirections({
          accessToken: mapboxgl.accessToken,
          bbox: [60.88, 23.70, 79.84, 37.09] // Bounding box for Pakistan [minLon, minLat, maxLon, maxLat]
      });
      map.addControl(directionsControl, 'top-left');
  } else {
      map.removeControl(directionsControl);
      directionsControl = null;
  }
});


// ===============================



  // Optional: Add navigation control to the map
  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.ScaleControl());


  map.on("style.load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  });


// ===================  ====================




    //###################### tourist sopts of the specific province  #################
  
  map.on("load", function () {
  console.log("Map loaded.");

  map.addSource("places", {
      type: "geojson",
      data: '{% static "data/tourist_sites-new/tourist_spots.geojson" %}',
  });

  console.log("Source added:", map.getSource("places"));

  map.addLayer({
      id: "clusters",
      type: "circle",
      source: "places",
      filter: ["has", "point_count"],
      paint: {
          "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              100,
              "#f1f075",
              750,
              "#f28cb1",
          ],
          "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
          ],
      },
  });

  console.log("Cluster layer added.");

  map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "places",
      filter: ["!", ["has", "point_count"]],
      paint: {
          "circle-color": "#11b4da",
          "circle-radius": 7,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
      },
  });

  console.log("Unclustered point layer added.");

  function zoomToFeature(coordinates, zoomLevel) {
      console.log("Zooming to feature:", coordinates, "with zoom level:", zoomLevel);
      map.easeTo({
          center: coordinates,
          zoom: zoomLevel,
          pitch: 15,
          bearing: -10,
          duration: 1000,
          essential: true
      });
  }

  map.on("click", "clusters", function (e) {
      console.log("Cluster clicked:", e);
      var features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
      });
      console.log("Rendered features:", features);
      var clusterId = features[0].properties.cluster_id;
      console.log("Cluster ID:", clusterId);
      map.getSource("places").getClusterExpansionZoom(clusterId, function (err, zoom) {
          if (err) {
              console.error("Error getting cluster expansion zoom:", err);
              return;
          }
          console.log("Cluster expansion zoom:", zoom);
          var coordinates = features[0].geometry.coordinates;
          console.log("Cluster coordinates:", coordinates);
          zoomToFeature(coordinates, zoom);
      });
  });

  map.on("click", "unclustered-point", function (e) {
      console.log("Unclustered point clicked:", e);
      var coordinates = e.features[0].geometry.coordinates.slice();
      var properties = e.features[0].properties;
      var spot = properties._key; // Assuming spot name is stored in _key property

      // Fetch images and videos for the spot
      fetchImagesAndVideos(spot);

      // Fetch and display weather for the spot
      fetchAndDisplayWeather(properties.tehsil);

      // Rest of your code for displaying popup, zooming, etc.
      var popupContent = "<h3>" + properties._key + "</h3>";
      if (properties.District) {
          popupContent += "<p><strong>District:</strong> " + properties.District + "</p>";
      }

      popupContent +=
          '<h5 class="card-title" style="color: white; text-decoration: underline;">Location Description</h5>' +
          '<p class="card-text" style="color: black;">' +
          properties.Desc +
          "</p>";

      var popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);

      map.easeTo({
        center: coordinates,
        zoom: 14,
      });
  });

  map.on("mouseenter", "clusters", function () {
      map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", function () {
      map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", "unclustered-point", function () {
      map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "unclustered-point", function () {
      map.getCanvas().style.cursor = "";
  });
});

// Function to fetch images and videos for a spot
function fetchImagesAndVideos(spot) {
  console.log("Fetching images and videos for spot:", spot);
  var folderPath = `../static/data/province-wise-images_videos/kpk/${spot}/`;

  var imageNames = ["1.jpg", "2.jpg", "3.jpg", "4.jpg"];

  var imageRow = document.getElementById("imageRow");
  imageRow.innerHTML = "";

  imageNames.forEach(function (imageName, index) {
      var img = document.createElement("img");
      img.src = folderPath + imageName;
      img.classList.add(
        "card-img-top",
        "img-fluid",
        "clickable-image",
        "zoom-in"
      );
      img.style.height = "200px";
      img.style.width = "290px";

      var card = document.createElement("div");
      card.classList.add("mb-4", "mt-2", "col-lg-3");

      card.appendChild(img);

      imageRow.appendChild(card);
  });

  var videoPlayer = document.getElementById("videoPlayer");
  if (videoPlayer) {
      var videoSource = document.createElement("source");
      videoSource.src = folderPath + "video.mp4";
      videoSource.type = "video/mp4";
      videoPlayer.innerHTML = "";
      videoPlayer.appendChild(videoSource);
  } else {
      console.error("Video player element not found.");
  }
}

function fetchAndDisplayWeather(tehsil) {
  console.log("Fetching weather for tehsil:", tehsil);
  var apiKey = "d1fff595a3d0d52c3beb4372cf19ab2e"; // Replace with your OpenWeatherMap API key
  var currentWeatherUrl = `//api.openweathermap.org/data/2.5/weather?q=${tehsil}&appid=${apiKey}&units=metric`;
  var forecastUrl = `//api.openweathermap.org/data/2.5/forecast?q=${tehsil}&appid=${apiKey}&units=metric`;

  fetch(currentWeatherUrl)
      .then(response => response.json())
      .then(data => {
          console.log("Current Weather Data:", data); // Log the current weather data
          displayCurrentWeather(data);
      })
      .catch(error => {
          console.error('Error fetching current weather data:', error);
      });

  fetchForecast(forecastUrl);
}

function displayCurrentWeather(data) {
  if (data && data.cod !== '404') {
      var cityElement = document.getElementById("city");
      var descriptionElement = document.getElementById("description");
      var dtElement = document.getElementById("dt");
      var windElement = document.getElementById("wind");
      var humidityElement = document.getElementById("humidity");
      var temperatureElement = document.getElementById("temperature");
      var conditionElement = document.getElementById("condition");
      var weatherCard = document.getElementById("weather-card");

      cityElement.textContent = data.name;
      descriptionElement.textContent = titleCase(data.weather[0].description);
      dtElement.textContent = getDateTime(data.dt);
      windElement.textContent = "Wind: " + data.wind.speed + " m/s";
      humidityElement.textContent = "Humidity: " + data.main.humidity + "%";
      temperatureElement.textContent = data.main.temp + "°C";
      conditionElement.className = getWeatherIcon(data.weather[0].icon);

      var weatherCard = document.getElementById("weather-card");
      weatherCard.style.backgroundImage = "url('{% static 'img/weatherimages/' %}" + data.weather[0].icon + ".jpg')";
      weatherCard.style.backgroundRepeat = "no-repeat";
      weatherCard.style.backgroundSize = "cover";
      weatherCard.style.opacity = "0.8";

      weatherCard.style.display = "block";
  } else {
      console.error('Tehsil not found or API request failed:', data.message);
  }
}

function fetchForecast(forecastUrl) {
  fetch(forecastUrl)
      .then(response => response.json())
      .then(data => {
          console.log("Forecast Data:", data); // Log the forecast data
          displayForecast(data);
      })
      .catch(error => {
          console.error('Error fetching forecast data:', error);
      });
}

function displayForecast(data) {
  if (data && data.cod !== '404') {
      var forecasts = data.list.filter((forecast, index) => index % 8 === 0);

      var forecastElement = document.getElementById("forecast");
      forecastElement.innerHTML = "";

      var table = document.createElement("table");
      table.classList.add("forecast-table");

      var headerRow = document.createElement("tr");
      var headerDay = document.createElement("th");
      headerDay.textContent = "Day";
      headerRow.appendChild(headerDay);
      var headerTemperature = document.createElement("th");
      headerTemperature.textContent = "Temperature (°C)";
      headerRow.appendChild(headerTemperature);
      var headerIcon = document.createElement("th");
      headerIcon.textContent = "Weather";
      headerRow.appendChild(headerIcon);
      table.appendChild(headerRow);

      forecasts.forEach(forecast => {
          var forecastDate = new Date(forecast.dt * 1000);
          var forecastDay = forecastDate.toLocaleString('en-US', { weekday: 'long' });
          var forecastTemperature = forecast.main.temp;
          var forecastIcon = getWeatherIcon(forecast.weather[0].icon);

          var row = document.createElement("tr");

          var dayCell = document.createElement("td");
          dayCell.textContent = forecastDay;
          row.appendChild(dayCell);

          var temperatureCell = document.createElement("td");
          temperatureCell.textContent = forecastTemperature + "°C";
          row.appendChild(temperatureCell);

          var iconCell = document.createElement("td");
          var forecastIconElement = document.createElement("i");
          forecastIconElement.classList.add("wi", forecastIcon);
          iconCell.appendChild(forecastIconElement);
          row.appendChild(iconCell);

          table.appendChild(row);
      });

      forecastElement.appendChild(table);
  } else {
      console.error('Forecast data not found or API request failed:', data.message);
  }
}




function titleCase(str) {
  return str.split(" ").map(word => word[0].toUpperCase() + word.substring(1)).join(" ");
}

function getDateTime(unixTimestamp) {
  var date = new Date(unixTimestamp * 1000);
  var options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
  };
  return date.toLocaleString('en-US', options);
}

function getWeatherIcon(iconCode) {
  switch (iconCode) {
      case "01d":
          return "wi-day-sunny";
      case "02d":
          return "wi-day-sunny-overcast";
      case "01n":
          return "wi-night-clear";
      case "02n":
          return "wi-night-partly-cloudy";
      case "03d":
      case "03n":
          return "wi-cloud";
      case "04d":
      case "04n":
          return "wi-cloudy";
      case "09d":
      case "09n":
          return "wi-showers";
      case "10d":
      case "10n":
          return "wi-rain";
      case "11d":
      case "11n":
          return "wi-thunderstorm";
      case "13d":
      case "13n":
          return "wi-snow";
      case "50d":
      case "50n":
          return "wi-fog";
      default:
          return "wi-day-sunny";
  }
}







// ===================  ====================





// =================== ===============

  //================= building' layer in the Mapbox Streets ===============
  // The 'building' layer in the Mapbox Streets
  map.on("style.load", () => {
    // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
      (layer) => layer.type === "symbol" && layer.layout["text-field"]
    ).id;

    // The 'building' layer in the Mapbox Streets
    // vector tileset contains building height data
    // from OpenStreetMap.
    map.addLayer(
      {
        id: "add-3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#aaa",
          // Use an 'interpolate' expression to
          // add a smooth transition effect to
          // the buildings as the user zooms in.
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 1,
        },
      },
      labelLayerId
    );
  });
  



//###################### boundary pakistan start #################
  // Wait for the map to finish loading before adding the data source
  map.on("load", function () {
    map.addSource("national-boundary", {
      type: "geojson",
      data: "/static/data/national_boundary/provincial_boundary.geojson",
    });

    // Add a layer to render the GeoJSON data
    map.addLayer({
      id: "national-boundary-layer",
      type: "line", // Change the type according to the geometry of your GeoJSON features
      source: "national-boundary",
      paint: {
        "line-color": "black", // Adjust the line color as needed
        "line-width": 2, // Adjust the line width as needed
      },
    });
  });
//###################### boundary pakistan end #################








//###################### current hazards start #################

// ---------- flood station starts---------
// Function to format date components (e.g., adding leading zeros)
function formatDate(value) {
  return value < 10 ? `0${value}` : value.toString();
}

// Function to get month name
function getMonthName(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[date.getMonth()];
}

function getAlertImagePath(date) {
  const currentDate = new Date(date.toDateString()); // Remove time component from date
  const formattedDate = formatDate(currentDate); // Format the date
  const monthName = getMonthName(currentDate); // Get month name

  // Check if the current date falls within the range specified in the image name
  if (isDateInRange(currentDate, '2024-05-09', '2024-05-24')) {
      const fileName = `flood_2024-05-09_2024-05-24_May.png`; // Image file name
      const imagePath = `/static/alerts/${fileName}`; // Construct image path
      console.log('Image path:', imagePath);
      return imagePath;
  } else {
      // If the current date is not within the range, return null or an empty string
      return null; // Or return an empty string: return '';
  }
}

// Function to check if the current date falls within the specified range
function isDateInRange(date, startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  return date >= startDate && date <= endDate;
}


// Load GeoJSON data and add layer to the map
map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data from a static file 
  fetch("/static/data/advisorygeojson/flood_01may-08may.geojson")
      .then(response => response.json())
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('advisorygeojsonflood', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map
          map.addLayer({
              id: 'advisorygeojsonflood',
              type: 'fill', // Change type to 'fill' to represent polygons
              source: 'advisorygeojsonflood',
              paint: {
                  'fill-color': 'blue', // Adjust the fill color as needed
                  'fill-opacity': 0.8 // Adjust the fill opacity as needed
              },
              layout: {
                  'visibility': 'none' // Set initial visibility to 'visible'
              }
          });

          console.log('Layer added');
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });
});

// Toggle layer visibility based on checkbox state
const layerToggle = document.getElementById('checkbox11'); // Assuming you have a checkbox with id 'checkbox11'
layerToggle.addEventListener('change', () => {
  if (layerToggle.checked) {
      map.setLayoutProperty('advisorygeojsonflood', 'visibility', 'visible');
      console.log('Layer visibility toggled: visible');
      const imagePath = getAlertImagePath(new Date()); // Pass new Date() to use the current date
      console.log('Image path:', imagePath); // Debug line
      const animatedImage = document.getElementById('animatedImage');
      animatedImage.src = imagePath;
      animatedImage.style.display = 'block'; // Show the image
  } else {
      map.setLayoutProperty('advisorygeojsonflood', 'visibility', 'none');
      console.log('Layer visibility toggled: none');
      const animatedImage = document.getElementById('animatedImage');
      animatedImage.style.display = 'none'; // Hide the image
  }
});

// Add popup on click
map.on('click', 'advisorygeojsonflood', (e) => {
  console.log('Feature clicked:', e.features[0]);
  const properties = e.features[0].properties;
  const coordinates = e.features[0].geometry.coordinates.slice();
  let popupContent = '<h3>' + properties.name + '</h3>';
  new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
});

// Display the alert image
const animatedImage = document.getElementById('animatedImage');

// Add click event listener to the image
animatedImage.addEventListener('click', function() {
  if (!isCentered) {
      centerImage(); // Center the image if not already centered
  } else {
      resetImagePosition(); // Return the image to its original position if already centered
  }
});

// Function to center the image
function centerImage() {
  animatedImage.style.position = 'fixed';
  animatedImage.style.top = '50%';
  animatedImage.style.left = '50%';
  animatedImage.style.transform = 'translate(-50%, -50%)';
  animatedImage.style.zIndex = '9999'; // Ensure it's above other content
  animatedImage.style.height = '900px'; // Adjust as needed
  animatedImage.style.width = '1200px'; // Adjust as needed
  isCentered = true;
}

// Function to return the image to its original position
function resetImagePosition() {
  animatedImage.style.position = 'static';
  animatedImage.style.top = 'auto';
  animatedImage.style.left = 'auto';
  animatedImage.style.transform = 'none';
  animatedImage.style.height = '280px'; // Adjust as needed
  animatedImage.style.width = '350px'; // Adjust as needed
  isCentered = false;
}

// Initialize isCentered variable
let isCentered = false;


// ---------- flood station ends---------





















//$$$$$$$$$$$$$$$$$$$$$ HIstrorical Hazards  $$$$$$$$$$$$$$$$$$$$

//###################### earthquake events area start ############
document.addEventListener('DOMContentLoaded', function () {
  const checkbox = document.getElementById('checkbox1');
  const modal = new bootstrap.Modal(document.getElementById('earthquakeModal'));
  const form = document.getElementById('earthquakeForm');
  const submitButton = document.getElementById('submitEarthquakeForm');

  // Event listener for checkbox change
  checkbox.addEventListener('change', function () {
      if (this.checked) {
          modal.show(); // Show modal if checkbox is checked
      } else {
          // Remove earthquake layer if checkbox is unchecked
          removeEarthquakeLayer();
      }
  });

  // Event listener for form submission
  submitButton.addEventListener('click', function () {
      // Prevent default form submission
      event.preventDefault();

      // Get selected magnitude range from the form
      const magnitudeRange = document.getElementById('earthquakeMagnitude').value;
      const minMagnitude = parseFloat(magnitudeRange.split('-')[0]);
      const maxMagnitude = parseFloat(magnitudeRange.split('-')[1]);

      // Fetch GeoJSON data and filter based on magnitude range
      fetch('{% static "data/earthquake-geojson/eq_data_events.geojson" %}')
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
              const filteredData = data.features.filter(feature => {
                  const magnitude = parseFloat(feature.properties.Magnitude);
                  return magnitude >= minMagnitude && magnitude <= maxMagnitude;
              });

              // Add filtered data to the map
              addEarthquakeLayer(filteredData);
          })
          .catch(error => console.error('Error fetching data:', error));

      // Close the modal after form submission
      modal.hide();
  });

  // Function to add earthquake layer to the map
  function addEarthquakeLayer(filteredData) {
      // Implement code to add filtered data to the map
      // Ensure that the map variable is accessible here
      // Example:
      map.addSource('earthquakes', {
          type: 'geojson',
          data: {
              type: 'FeatureCollection',
              features: filteredData
          }
      });

      // Load the earthquake icon image
      map.loadImage('{% static "img\mapbox-icons\gdacs\Red-EQ.png" %}', function (error, image) {
          if (error) throw error;
          
          // Add the image to the map
          map.addImage("earthquake-icon", image);

          // Add the earthquake layer
          map.addLayer({
              id: 'earthquakes-point',
              type: 'symbol',
              source: 'earthquakes',
              layout: {
                  'icon-image': 'earthquake-icon', // Name of the loaded image
                  'icon-size': 0.5, // Adjust the size of the image markers
                  'icon-allow-overlap': false, // Allow icons to overlap
                  'icon-anchor': 'bottom', // Anchor point of the icon
              },
          });
      });
  }

  // Event listener for when the map is loaded
  map.on('load', function () {
      // When an earthquake point is clicked, display its properties
      map.on("click", "earthquakes-point", function (e) {
          console.log("Clicked on earthquake point");
          var features = e.features;
          if (!features || !features.length) return;

          var properties = features[0].properties;
          var coordinates = e.lngLat; // Get the coordinates of the clicked point
          console.log("Earthquake properties:", properties);
          displayEarthquakeData(properties, coordinates); // Pass coordinates to the function
      });

      // Change the cursor to a pointer when hovering over the earthquake points
      map.on("mouseenter", "earthquakes-point", function () {
          map.getCanvas().style.cursor = "pointer";
      });

      // Change it back to the default cursor when the mouse leaves the earthquake points
      map.on("mouseleave", "earthquakes-point", function () {
          map.getCanvas().style.cursor = "";
      });
  });

  // Function to display earthquake data in a table inside the popup
  function displayEarthquakeData(properties, coordinates) {
      console.log("Displaying earthquake data:", properties);
      // Create HTML content for the table
      var tableHTML = '<table>';
      Object.keys(properties).forEach((property) => {
          tableHTML += '<tr><td>' + property + '</td><td>' + properties[property] + '</td></tr>';
      });
      tableHTML += '</table>';

      // Create a new Popup object
      var popup = new mapboxgl.Popup()
          .setLngLat(coordinates) // Set coordinates for the popup
          .setHTML(tableHTML)
          .addTo(map);
  }

  // Get the checkbox element
  const earthquakeCheckbox = document.getElementById("checkbox1");

  // Event listener to toggle the layer visibility when the checkbox is clicked
  earthquakeCheckbox.addEventListener("change", function () {
      if (this.checked) {
          // If the checkbox is checked, show the layer
          map.setLayoutProperty("earthquakes-point", "visibility", "visible");
      } else {
          // If the checkbox is unchecked, hide the layer
          map.setLayoutProperty("earthquakes-point", "visibility", "none");
      }
  });
});

// Function to remove earthquake layer from the map
function removeEarthquakeLayer() {
  // Implement code to remove earthquake layer from the map
  // Example:
  if (map.getLayer('earthquakes-point')) {
      map.removeLayer('earthquakes-point');
  }
  if (map.getSource('earthquakes')) {
      map.removeSource('earthquakes');
  }
}


  //###################### earthquake events area ends ############





//###################### flood start  #################

document.addEventListener('DOMContentLoaded', function() {
  const floodCheckbox = document.getElementById("checkbox2");
  
  // Event listener to show the modal when the checkbox is checked
  floodCheckbox.addEventListener('change', function() {
      if (this.checked) {
          // If the checkbox is checked, show the modal
          $('#floodmodal').modal('show');
      } else {
          // If the checkbox is unchecked, hide the modal and the layer
          $('#floodmodal').modal('hide');
          hideLayer("flood");
      }
  });

  // Event listener to submit the flood form
  const submitFloodFormBtn = document.getElementById("submitFloodForm");
  submitFloodFormBtn.addEventListener('click', function() {
      // Handle form submission logic here
      // For example, you can retrieve form data and perform an action
      const selectedYear = document.getElementById("floodYear").value;
      console.log("Selected Year:", selectedYear);
      // You can add further logic to submit the form data
      
      // Display the layer on the map
      displayLayer("flood", selectedYear);

      // Hide the modal after form submission
      $('#floodmodal').modal('hide');
  });

  // Initialize the modal manually
  var floodModal = new bootstrap.Modal(document.getElementById('floodmodal'));
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function displayLayer(layer, year) {
  console.log("Displaying layer:", layer);
  console.log("Selected year:", year);

  // Capitalize the layer name
  const capitalizedLayer = capitalize(layer);
  console.log("Capitalized layer:", capitalizedLayer);

  // Construct the URL for the GeoJSON data based on the selected layer and year
  const sourceUrl = `/static/data/${layer}-geojson/${capitalizedLayer} Extent_${year}.geojson`;
  console.log("Source URL:", sourceUrl);

  // Check if a source with the same ID already exists, and remove it if so
  if (map.getSource(layer)) {
      map.removeSource(layer);
      console.log("Existing source removed:", layer);
  }

  // Add the source to the map
  map.addSource(layer, {
      type: "geojson",
      data: sourceUrl,
  });
  console.log("Source added to map:", layer);

  // Check if a layer with the same ID already exists, and remove it if so
  if (map.getLayer(`${layer}-polygon`)) {
      map.removeLayer(`${layer}-polygon`);
      console.log("Existing layer removed:", `${layer}-polygon`);
  }

  // Add the layer to the map
  map.addLayer({
      id: `${layer}-polygon`,
      type: "fill",
      source: layer,
      paint: {
          "fill-color": "#0047AB",
          "fill-opacity": 0.5,
      },
      layout: {
          visibility: "visible", // Show the layer by default
      },
  });
  console.log("Layer added to map:", `${layer}-polygon`);
}

function hideLayer(layer) {
  // Check if the layer exists before removing it
  if (map.getLayer(`${layer}-polygon`)) {
      map.removeLayer(`${layer}-polygon`);
  }

  // Check if the source exists before removing it
  if (map.getSource(layer)) {
      map.removeSource(layer);
  }
}

//###################### flood ends  #################  


//==================GLOF starts==============

/// Function to add GLOF layer
function addGlofLayer() {
  // Add GLOF GeoJSON data source
  map.addSource("glof-sites", {
      type: "geojson",
      data: '{% static "data/Geojeson_GLOF/GLOF_sites.geojson" %}',
  });

  // Add image to the map
  map.loadImage('{% static "img\mapbox-icons\gdacs\Orange-FL.png" %}', function (error, image) {
      if (error) throw error;
      map.addImage("glacier", image); // Add the loaded image with the name "glacier"
      
      // Add GLOF layer
      map.addLayer({
          id: "glof-sites",
          type: "symbol", // Change layer type to symbol for using an image
          source: "glof-sites",
          layout: {
              "icon-image": "glacier", // Image name without file extension
              'icon-size': 1.3, // Adjust the size of the image markers
              'icon-allow-overlap': false, // Allow icons to overlap
              'icon-anchor': 'bottom', // Anchor point of the icon
          },
      });

      // Start blinking spots
      // blinkSpots();
  });
}

// Function to remove GLOF layer
function removeGlofLayer() {
  // Remove GLOF layer
  map.removeLayer("glof-sites");
  map.removeSource("glof-sites");
}

// Function to toggle GLOF layer visibility based on checkbox state
function toggleGlofLayer() {
  var checkbox = document.getElementById("checkbox4");
  if (checkbox.checked) {
      // If checkbox is checked, show the GLOF layer
      addGlofLayer();
  } else {
      // If checkbox is unchecked, hide the GLOF layer
      removeGlofLayer();
  }
}

// Event listener for checkbox state change
document.getElementById("checkbox4").addEventListener("change", toggleGlofLayer);

//================== Glof Ends ================

//================== landslides start ================

map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data
  fetch("/static/data/landslide/landslide_points.geojson")
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json();
      })
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('landslide_points', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map with initial visibility set to 'none'
          map.addLayer({
              id: 'landslide_points',
              type: 'circle',
              source: 'landslide_points',
              paint: {
                  'circle-radius': 8,
                  'circle-color': '#FF0000', // Red color for the points
                  'circle-opacity': 0.8
              },
              layout: {
                  'visibility': 'none' // Set initial visibility to 'none'
              }
          });

          console.log('Layer added');

          // Event listener to toggle layer visibility based on checkbox state
          const layerToggle = document.getElementById('checkbox3');
          layerToggle.addEventListener('change', () => {
              if (layerToggle.checked) {
                  console.log('Toggling layer visibility: visible');
                  map.setLayoutProperty('landslide_points', 'visibility', 'visible');
              } else {
                  console.log('Toggling layer visibility: none');
                  map.setLayoutProperty('landslide_points', 'visibility', 'none');
              }
          });

          // Event listener for displaying popup on click
          map.on('click', 'landslide_points', (e) => {
              console.log('Feature clicked:', e.features[0]);

              const properties = e.features[0].properties;
              const coordinates = e.features[0].geometry.coordinates.slice();

              // Format the coordinates to display in the popup
              const formattedCoordinates = coordinates.map(coord => coord.toFixed(6)).join(', ');

              let popupContent = '<h3>' + properties.Name + '</h3>'; // Assuming 'Name' is the property containing the name of the location
              popupContent += '<p>Coordinates: ' + formattedCoordinates + '</p>';

              new mapboxgl.Popup()
                  .setLngLat(coordinates)
                  .setHTML(popupContent)
                  .addTo(map);
          });
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });

  console.log('Event listeners added');
});

//================== landslides Ends ================


// $$$$$$$$$$$$$$$$$$ infrastructure layer $$$$$$$$$$$

// ---------------rescue stations-----------
map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data from a static file
  fetch("/static/data/Infrastructure/rescue_stations.geojson")
      .then(response => response.json())
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('rescue_stations', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map with initial visibility set to 'none'
          map.addLayer({
              id: 'rescue_stations',
              type: 'symbol',
              source: 'rescue_stations',
              layout: {
                  'icon-image': 'hospital',
                  'icon-allow-overlap': false,
                  'visibility': 'none', // Set initial visibility to 'none
                  'icon-size': 1.4,
              },
              
          });

          console.log('Layer added');
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });

  // Toggle layer visibility based on checkbox state
  const layerToggle = document.getElementById('checkbox6');
  layerToggle.addEventListener('change', () => {
      if (layerToggle.checked) {
          map.setLayoutProperty('rescue_stations', 'visibility', 'visible');
          console.log('Layer visibility toggled: visible');
      } else {
          map.setLayoutProperty('rescue_stations', 'visibility', 'none');
          console.log('Layer visibility toggled: none');
      }
  });


  // Add popup on click
  map.on('click', 'rescue_stations', (e) => {
    console.log('Feature clicked:', e.features[0]);

    const properties = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    let popupContent = '<h3>' + properties.Name + '</h3>';
    popupContent += '<p>District: ' + properties.District + '</p>';
    popupContent += '<p>Province: ' + properties.Province + '</p>';
    popupContent += '<p>Country: ' + properties.Country + '</p>';
    popupContent += '<p>Address: ' + properties.Address + '</p>';
    popupContent += '<p>Category: ' + properties.Category + '</p>';

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
  });

  // Change the cursor to a pointer when hovering over the layer.
  map.on('mouseenter', 'rescue_stations', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'rescue_stations', () => {
    map.getCanvas().style.cursor = '';
  });

  console.log('Event listeners added');
});
 // ---------------rescue stations end-----------

 // --------------health facilities-----------
 map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data from a static file
  fetch("/static/data/Infrastructure/health_facilities.geojson")
      .then(response => response.json())
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('health_facilities', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map with initial visibility set to 'none'
          map.addLayer({
              id: 'health_facilities',
              type: 'symbol',
              source: 'health_facilities',
              layout: {
                  'icon-image': 'doctor',
                  'icon-allow-overlap': false,
                  'visibility': 'none',// Set initial visibility to 'none'
                  'icon-size': 1.4,
              }
          });

          console.log('Layer added');
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });

  // Toggle layer visibility based on checkbox state
  const layerToggle = document.getElementById('checkbox7');
  layerToggle.addEventListener('change', () => {
      if (layerToggle.checked) {
          map.setLayoutProperty('health_facilities', 'visibility', 'visible');
          console.log('Layer visibility toggled: visible');
      } else {
          map.setLayoutProperty('health_facilities', 'visibility', 'none');
          console.log('Layer visibility toggled: none');
      }
  });

  // Add popup on click
  map.on('click', 'health_facilities', (e) => {
      console.log('Feature clicked:', e.features[0]);

      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();

      let popupContent = '<h3>' + properties.Name + '</h3>';
      popupContent += '<p>Category: ' + properties.Category + '</p>';
      popupContent += '<p>Sub-Category: ' + properties.Sub_Cat + '</p>';
      popupContent += '<p>Gov/Private: ' + properties.Gov_Pvt + '</p>';
      popupContent += '<p>Tehsil: ' + properties.Tehsil + '</p>';
      popupContent += '<p>District: ' + properties.District + '</p>';
      popupContent += '<p>Province: ' + properties.Province + '</p>';

      new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
  });

  console.log('Event listeners added');
});
// --------------health facilities end-----------

// --------------police station start-----------
map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data from a static file
  fetch("/static/data/Infrastructure/police_stations.geojson")
      .then(response => response.json())
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('police_stations', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map with initial visibility set to 'none'
          map.addLayer({
              id: 'police_stations',
              type: 'symbol',
              source: 'police_stations',
              layout: {
                  'icon-image': 'police',
                  'icon-allow-overlap': false,
                  'visibility': 'none', // Set initial visibility to 'none'
                  'icon-size': 1.4,
              }
          });

          console.log('Layer added');
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });

  // Toggle layer visibility based on checkbox state
  const layerToggle = document.getElementById('checkbox8');
  layerToggle.addEventListener('change', () => {
      if (layerToggle.checked) {
          map.setLayoutProperty('police_stations', 'visibility', 'visible');
          console.log('Layer visibility toggled: visible');
      } else {
          map.setLayoutProperty('police_stations', 'visibility', 'none');
          console.log('Layer visibility toggled: none');
      }
  });

  // Add popup on click
  map.on('click', 'police_stations', (e) => {
      console.log('Feature clicked:', e.features[0]);

      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();

      let popupContent = '<h3>' + properties.Name + '</h3>';
      popupContent += '<p>District: ' + properties.District + '</p>';
      popupContent += '<p>Province: ' + properties.Province + '</p>';
      popupContent += '<p>Country: ' + properties.Country + '</p>';

      new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
  });

  console.log('Event listeners added');
});

// --------------police station end-----------

// ---------- bus station  start--------
map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data from a static file
  fetch("/static/data/Infrastructure/bus_stations.geojson")
      .then(response => response.json())
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('bus_stations', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map with initial visibility set to 'none'
          map.addLayer({
              id: 'bus_stations',
              type: 'symbol',
              source: 'bus_stations',
              layout: {
                  'icon-image': 'bus', // Assuming you have an icon named 'bus-15'
                  'icon-allow-overlap': false,
                  'visibility': 'none', // Set initial visibility to 'none'
                  'icon-size': 1.4,
              }
          });

          console.log('Layer added');
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });

  // Toggle layer visibility based on checkbox state
  const layerToggle = document.getElementById('checkbox9'); // Assuming you have a checkbox with id 'checkbox10'
  layerToggle.addEventListener('change', () => {
      if (layerToggle.checked) {
          map.setLayoutProperty('bus_stations', 'visibility', 'visible');
          console.log('Layer visibility toggled: visible');
      } else {
          map.setLayoutProperty('bus_stations', 'visibility', 'none');
          console.log('Layer visibility toggled: none');
      }
  });

  // Add popup on click
  map.on('click', 'bus_stations', (e) => {
      console.log('Feature clicked:', e.features[0]);

      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();

      let popupContent = '<h3>' + properties.name + '</h3>';
      popupContent += '<p>District: ' + properties.District + '</p>';
      popupContent += '<p>Province: ' + properties.Province + '</p>';
      popupContent += '<p>Country: ' + properties.Country + '</p>';

      new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
  });

  console.log('Event listeners added');
});

// ---------- bus station ends---------


// ---------- fuel station starts---------
map.on('load', () => {
  console.log('Map loaded');

  // Load GeoJSON data from a static file
  fetch("/static/data/Infrastructure/Fuel_stations.geojson")
      .then(response => response.json())
      .then(data => {
          console.log('GeoJSON data loaded:', data);

          // Add the GeoJSON data as a source to the map
          map.addSource('fuel_stations', {
              type: 'geojson',
              data: data
          });

          // Add a layer to the map with initial visibility set to 'none'
          map.addLayer({
              id: 'fuel_stations',
              type: 'symbol',
              source: 'fuel_stations',
              layout: {
                  'icon-image': 'fuel', // Assuming you have an icon named 'fuel-15'
                  'icon-allow-overlap': false,
                  'visibility': 'none', // Set initial visibility to 'none'
                  'icon-size': 1.4,
              }
          });

          console.log('Layer added');
      })
      .catch(error => {
          console.error('Error loading GeoJSON:', error);
      });

  // Toggle layer visibility based on checkbox state
  const layerToggle = document.getElementById('checkbox10'); // Assuming you have a checkbox with id 'checkbox11'
  layerToggle.addEventListener('change', () => {
      if (layerToggle.checked) {
          map.setLayoutProperty('fuel_stations', 'visibility', 'visible');
          console.log('Layer visibility toggled: visible');
      } else {
          map.setLayoutProperty('fuel_stations', 'visibility', 'none');
          console.log('Layer visibility toggled: none');
      }
  });

  // Add popup on click
  map.on('click', 'fuel_stations', (e) => {
      console.log('Feature clicked:', e.features[0]);

      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();

      let popupContent = '<h3>' + properties.name + '</h3>';

      new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
  });

  console.log('Event listeners added');
});

// ---------- fuel station ends---------



// ------------ geology---------
map.on("style.load", function () {
///////////////////////////////barages/////////////////////////
map.addSource("Barrages", {
  type: "vector",
  scheme: "tms",
  tiles: [
    `http://172.18.1.4:8080/geoserver/gwc/service/tms/1.0.0/abdul_sattar:Barrages@EPSG:900913@pbf/{z}/{x}/{y}.pbf`,
  ],
});

map.addLayer({
  id: "Barrages",
  type: "circle",
  source: "Barrages",
  "source-layer": "Barrages",
  layout: {
    visibility: "none",
  },
  paint: {
    "circle-color": "pink",
    "circle-opacity": 1,
    "circle-radius": 10,
    'icon-allow-overlap': false, // Allow icons to overlap
  },
});

///////////////////////////////headworks/////////////////////////
map.addSource("headworks", {
  type: "vector",
  scheme: "tms",
  tiles: [
    `http://172.18.1.4:8080/geoserver/gwc/service/tms/1.0.0/abdul_sattar:headworks@EPSG:900913@pbf/{z}/{x}/{y}.pbf`,
  ],
});

map.addLayer({
  id: "headworks",
  type: "circle",
  source: "headworks",
  "source-layer": "headworks",
  layout: {
    visibility: "none",
  },
  paint: {
    "circle-color": "black",
    "circle-opacity": 1,
    "circle-radius": 10,
    'icon-allow-overlap': false, // Allow icons to overlap
  },
});

///////////////////////////////Vulnerable_Glacial_Lakes/////////////////////////
map.addSource("Vulnerable_Glacial_Lakes", {
  type: "vector",
  scheme: "tms",
  tiles: [
    `http://172.18.1.4:8080/geoserver/gwc/service/tms/1.0.0/abdul_sattar:Vulnerable_Glacial_Lakes@EPSG:900913@pbf/{z}/{x}/{y}.pbf`,
  ],
});

map.addLayer({
  id: "Vulnerable_Glacial_Lakes",
  type: "circle",
  source: "Vulnerable_Glacial_Lakes",
  "source-layer": "Vulnerable_Glacial_Lakes",
  layout: {
    visibility: "none",
  },
  paint: {
    "circle-color": "purple",
    "circle-opacity": 1,
    "circle-radius": 10,
    'icon-allow-overlap': false, // Allow icons to overlap
  },
});

///////////////////////////////Waterways_Polygons_Pakistan/////////////////////////
map.addSource("Waterways_Polygons_Pakistan", {
  type: "vector",
  scheme: "tms",
  tiles: [
    `http://172.18.1.4:8080/geoserver/gwc/service/tms/1.0.0/abdul_sattar:Waterways_Polygons_Pakistan@EPSG:900913@pbf/{z}/{x}/{y}.pbf`,
  ],
});

map.addLayer({
  id: "Waterways_Polygons_Pakistan",
  type: "fill",
  source: "Waterways_Polygons_Pakistan",
  "source-layer": "Waterways_Polygons_Pakistan",
  layout: {
    visibility: "none",
  },
  paint: {
    "fill-color": "blue",
    "fill-opacity": 1,
    'circle-opacity': 0.8,
    
  },
});

///////////////////////////////GlaciedAreas/////////////////////////
map.addSource("GlaciedAreas", {
  type: "vector",
  scheme: "tms",
  tiles: [
    `http://172.18.1.4:8080/geoserver/gwc/service/tms/1.0.0/abdul_sattar:Glaciated_Areas@EPSG:900913@pbf/{z}/{x}/{y}.pbf`,
  ],
});

map.addLayer({
  id: "GlaciedAreas",
  type: "fill",
  source: "GlaciedAreas",
  "source-layer": "Glaciated_Areas",
  layout: {
    visibility: "none",
  },
  paint: {
    "fill-color": "white",
    "fill-opacity": 1,
    
  },
});



});

document.addEventListener("DOMContentLoaded", function () {
var layerIds = [
  "Barrages",
  "headworks",
  "Vulnerable_Glacial_Lakes",
  "Waterways_Polygons_Pakistan",
  "GlaciedAreas",
];

var buttons = document.querySelectorAll(".map-overlay-items button");
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    var clickedLayerId = this.id;
    toggleLayerVisibility(clickedLayerId);
  });
});

function toggleLayerVisibility(clickedLayerId) {
  layerIds.forEach(function (layerId) {
    var layer = map.getLayer(layerId);
    if (layer) {
      var visibility = map.getLayoutProperty(layerId, "visibility");
      if (layerId === clickedLayerId && visibility === "visible") {
        map.setLayoutProperty(layerId, "visibility", "none");
      } else if (layerId === clickedLayerId && visibility === "none") {
        map.setLayoutProperty(layerId, "visibility", "visible");
      } else {
        // For other layers, hide them
        map.setLayoutProperty(layerId, "visibility", "none");
      }
    }
  });
}
});

