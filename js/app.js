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

    Declaración de pines

------------------------------------*/

var pinPeltier;
var pinAgua;
var pinHumo;



/*------------------------------------

    Configuración de Johnny Five

------------------------------------*/

var board = new five.Board();

var interacciones = [];

board.on("ready", function() {

    /*------------------------------------

    Inicialización de pines

    ------------------------------------*/

    // TEMP
    var numPinPeltier = 51;
    pinPeltier = new five.Pin({
        pin: numPinPeltier,
        mode: 1
    });

    // AGUA
    var numPinAgua = 26;
    pinAgua = new five.Pin({
        pin: numPinAgua,
        mode: 1
    });

    // HUMO
    var numPinHumo = 35;
    pinHumo = new five.Pin({
        pin: numPinHumo,
        mode: 1
    });



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
            console.log("INTERACCIONES RECIBIDAS");
            determinarInteracciones(interacciones, tiempoActual);
            setInterval(function () {
                console.log("TIEMPO ACTUAL: " + tiempoActual);
                determinarInteracciones(interacciones, tiempoActual);
            }, 1000);
            // Devuelve el tiempo del video y ejecuta las interacciones sólo cuando se esté reproduciendo
            socket.on("video", function (time) {
                tiempoActual = time;
                //console.log(tiempoActual);
            });
        });
    });

});



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

    Funciones para cada acción

------------------------------------*/

function crearViento(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual >= transform.start_time && tiempoActual < fin) {
        console.log("SÍ VIENTO");

    } else {
        console.log("NO VIENTO");

    }
}

function crearAgua(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ AGUA");
        pinAgua.high();
    } else {
        console.log("NO AGUA");
        pinAgua.low();
    }
}

function crearLuz(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ LUZ");

    } else {
        console.log("NO LUZ");

    }
}

function crearHumo(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ HUMO");
        pinHumo.high();
    } else {
        console.log("NO HUMO");
        pinHumo.low();
    }
}

function crearTemp(transform) {
    var fin = transform.start_time + transform.duration;
    if (tiempoActual > transform.start_time && tiempoActual < fin) {
        console.log("SÍ TEMP");
        //pinPeltier.high();
    } else {
        console.log("NO TEMP");
        //pinPeltier.low();
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