var json;
var interactions;
var type;
var data = {};
var motion;

// Se cargan las interacciones
function preload() {
    var path = "../interactions/hotspot_test.json";
    json = loadJSON(path, determinarInteracciones);
}

function determinarInteracciones() {
    // Propiedades
    var interactions = json.data.shift;
    var numShift = interactions.length;
    var coordenadas = interactions[0].motion[0].position;
    
}

// Funciones para crear elementos

function crearEllipse(coordenadas, ancho, alto) {
    var x = coordenadas.x;
    var y = coordenadas.y;
    stroke(255, 204, 0);
    strokeWeight(4);
    ellipse(x, y, ancho, alto);
}

function draw() {
    crearEllipse({"x": 20, "y": 20}, 20, 20);
}