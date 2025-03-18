let mapData;
let currentCountryIndex = 0;
let drawSpeed = 2;
let countryColors = {};
let countryShapes = [];

function preload() {
  console.log("Chargement des données...");
  let url = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
  mapData = loadJSON(url, () => console.log("GeoJSON chargé"), () => console.error("Erreur de chargement"));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeWeight(1);
  fill('#408982');
  frameRate(60);

  if (mapData && mapData.features) {
    mapData.features.forEach(feature => {
      let countryName = feature.properties.name;
      countryColors[countryName] = color(0); 
    });
  }
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

  if (!mapData || !mapData.features) {
    return;
  }

  countryShapes = [];
  for (let i = 0; i < currentCountryIndex && i < mapData.features.length; i++) {
    drawCountry(mapData.features[i]);
  }

  if (currentCountryIndex < mapData.features.length) {
    currentCountryIndex += drawSpeed;
  } else {
    noLoop();
  }


}

function drawCountry(feature) {
  let geometry = feature.geometry;
  let countryName = feature.properties.name;
  stroke(countryColors[countryName]);

  if (geometry.type === "Polygon") {
    drawPolygon(geometry.coordinates, countryName);
  } else if (geometry.type === "MultiPolygon") {
    for (let coords of geometry.coordinates) {
      drawPolygon(coords, countryName);
    }
  }
}

function drawPolygon(coordinates, countryName) {
  let shape = [];

  beginShape();
  for (let coord of coordinates[0]) {
    let lon = coord[0];
    let lat = coord[1];
    let x = mercatorX(lon);
    let y = mercatorY(lat);
    vertex(x, y);
    shape.push(createVector(x, y));
  }
  endShape(CLOSE);

  countryShapes.push({ name: countryName, shape });
}

function mousePressed() {

  for (let country of countryShapes) {
    if (isPointInsidePolygon(mouseX - width / 2, mouseY - height / 2, country.shape)) {
      fetchCountryData(country.name);
      break;
    }
  }

}

//ray-casting algorithm
function isPointInsidePolygon(px, py, shape) {
  let inside = false;

  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    let xi = shape[i].x, yi = shape[i].y;
    let xj = shape[j].x, yj = shape[j].y;
    
    let intersect = ((yi > py) !== (yj > py)) &&
                    (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function fetchCountryData(country) {
  let apiUrl = `https://restcountries.com/v3.1/name/${country}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      let countryInfo = data[0];
      document.getElementById("countryName").innerText = countryInfo.name.common || "N/A";
      document.getElementById("population").innerText = countryInfo.population.toLocaleString() || "N/A";
      document.getElementById("language").innerText = Object.values(countryInfo.languages || {}).join(", ") || "N/A";
      document.getElementById("flag").src = countryInfo.flags.svg || "";
    })
    .catch(error => console.error("Error fetching country data:", error));
}


// Convertir des coordonnées géographiques (longitude/latitude) en coordonnées écran en utilisant la projection de Mercator

function mercatorX(lon) {
  return map(lon, -180, 180, -width / 2, width / 2);
}

function mercatorY(lat) {
  return map(lat, -90, 90, height / 2, -height / 2);
}
