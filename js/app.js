/*------------------------------------

    Servidor y comunicación player-servidor

------------------------------------*/

var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var five = require("johnny-five");

server.listen(3000);

var tiempoActual = 0;


/*------------------------------------

    Funciones para cada acción

------------------------------------*/

function crearViento(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual >= transform.start_time && tiempoActual < fin) {
        console.log("SÍ VIENTO");
        encenderLED(13);
    } else {
        console.log("NO VIENTO");
        apagarLED(13);
    }
}

function crearAgua(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ AGUA");
        encenderLED(13);
    } else {
        console.log("NO AGUA");
        apagarLED(13);
    }
}

function crearLuz(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ LUZ");
        encenderLED(13);
    } else {
        console.log("NO LUZ");
        apagarLED(13);
    }
}

function crearHumo(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ HUMO");
        encenderLED(13);
    } else {
        console.log("NO HUMO");
        apagarLED(13);
    }
}

function crearTemp(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ TEMP");
        encenderLED(13);
    } else {
        console.log("NO TEMP");
        apagarLED(13);
    }
}

function encenderLED(pin) {
    var led = new five.Led(pin);
    led.on();
}

function apagarLED(pin) {
    var led = new five.Led(pin);
    led.off();
}



/*------------------------------------

    Determina las interacciones SENSE respectivas

------------------------------------*/

function determinarInteracciones(interacciones, tiempoActual) {
    for (var i = 0; i < interacciones.length; i++) {
        var interaccion = interacciones[i];
        for (var j = 0; j < interaccion.type.data.shift.length; j++) {
            var shift = interaccion.type.data.shift[j];
            for (var k = 0; k < shift.transform.length; k++) {
                switch (shift.type) {
                    case "WIND":
                        crearViento(shift.transform[k], tiempoActual);
                        break;
                    case "WATER":
                        crearAgua(shift.transform[k], tiempoActual);
                        break;
                    case "LIGHT":
                        crearLuz(shift.transform[k], tiempoActual);
                        break;
                    case "TEMP":
                        crearTemp(shift.transform[k], tiempoActual);
                        break;
                    case "SMOKE":
                        crearHumo(shift.transform[k], tiempoActual);
                        break;
                }
            }
        }
    }
}



/*------------------------------------

    Configuración de Johnny Five

------------------------------------*/

var board = new five.Board();

var interacciones = [];

board.on("ready", function() {

    /*------------------------------------

    Conexión con el Player

    ------------------------------------*/

    io.on("connect", function (socket) {
        console.log("PlateaPlayer conectado!");

        // Lee la información de interacciones desde el JSON (Sólo se ejecuta una vez por interacción)
        socket.on("sense", function (datos) {
            var string = JSON.stringify(datos);
            var sense = JSON.parse(string);
            interacciones.push(sense);
            determinarInteracciones(interacciones, tiempoActual);
            setInterval(function () {
                console.log("TIEMPO ACTUAL: " + tiempoActual);
                determinarInteracciones(interacciones, tiempoActual);
            }, 1000);
            // Devuelve el tiempo del video y ejecuta las interacciones sólo cuando se esté reproduciendo
            socket.on("video", function (time) {
                tiempoActual = time;
            });
        });
    });

});