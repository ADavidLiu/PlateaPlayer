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
    pinPeltier = new five.Pin(numPinPeltier);

    // AGUA
    var numPinAgua = 52;
    pinAgua = new five.Pin(numPinAgua);

    // HUMO
    var numPinHumo = 32;
    pinHumo = new five.Pin(numPinHumo);



    /*------------------------------------

    Conexión con el Player

    ------------------------------------*/

    io.on("connect", function (socket) {
        console.log("PlateaPlayer conectado!");

        // Lee la información de interacciones desde el JSON (una vez por cada interacción)
        socket.on("sense", function (datos) {
            console.log("SENSE RECIBIDO");
            var string = JSON.stringify(datos);
            var sense = JSON.parse(string);
            interacciones.push(sense);
        });

        // Actualiza el tiempo del video
        socket.on("video", function (time) {
            tiempoActual = time;
        });

        // Imprime el tiempo actual cada segundo
        setInterval(function () {
            console.log("TIEMPO ACTUAL: " + tiempoActual);
        }, 1000);

        // Después de haber recibido todas las interacciones
        setTimeout(function () {
            console.log("DETERMINAR INTERACCIONES");
            determinarInteracciones(interacciones);
        }, 500);
    });

});



/*------------------------------------

    Determina las interacciones SENSE respectivas

------------------------------------*/

function determinarInteracciones(interacciones) {
    for (var i = 0; i < interacciones.length; i++) {
        var interaccion = interacciones[i];
        for (var j = 0; j < interaccion.type.data.shift.length; j++) {
            var shift = interaccion.type.data.shift[j];
            for (var k = 0; k < shift.transform.length; k++) {
                switch (shift.type) {
                    case "WIND":
                        crearViento(shift.transform[k]);
                        break;
                    case "WATER":
                        crearAgua(shift.transform[k]);
                        break;
                    case "LIGHT":
                        crearLuz(shift.transform[k]);
                        break;
                    case "TEMP":
                        crearTemp(shift.transform[k]);
                        break;
                    case "SMOKE":
                        crearHumo(shift.transform[k]);
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
    var intervalo = setInterval(function () {
        if (tiempoActual >= transform.start_time && tiempoActual < fin) {
            console.log("SÍ VIENTO");

            var timeout = setTimeout(function () {

                clearTimeout(timeout);
                clearInterval(intervalo);
            }, transform.duration * 1000);
        }
    }, 1000);
}

function crearAgua(transform) {
    var fin = transform.start_time + transform.duration;
    var intervalo = setInterval(function () {
        if (tiempoActual > transform.start_time && tiempoActual < fin) {
            console.log("SÍ AGUA");
            pinAgua.high();
            encenderLED(13);
            var timeout = setTimeout(function () {
                pinAgua.low();
                apagarLED(13);
                clearTimeout(timeout);
                clearInterval(intervalo);
            }, transform.duration * 1000);
        }
    }, 1000);
}

function crearLuz(transform) {
    var fin = transform.start_time + transform.duration;
    var intervalo = setInterval(function () {
        if (tiempoActual > transform.start_time && tiempoActual < fin) {
            console.log("SÍ LUZ");

            var timeout = setTimeout(function () {

                clearTimeout(timeout);
                clearInterval(intervalo);
            }, transform.duration * 1000);
        }
    }, 1000);
}

function crearHumo(transform) {
    var fin = transform.start_time + transform.duration;
    var intervalo = setInterval(function () {
        if (tiempoActual > transform.start_time && tiempoActual < fin) {
            console.log("SÍ HUMO");
            pinHumo.high();
            var timeout = setTimeout(function () {
                pinHumo.low();
                clearTimeout(timeout);
                clearInterval(intervalo);
            }, transform.duration * 1000);
        }
    }, 1000);
}

function crearTemp(transform) {
    var fin = transform.start_time + transform.duration;
    var intervalo = setInterval(function () {
        if (tiempoActual > transform.start_time && tiempoActual < fin) {
            console.log("SÍ TEMP");
            //pinPeltier.high();
            var timeout = setTimeout(function () {
                //pinPeltier.low();
                clearTimeout(timeout);
                clearInterval(intervalo);
            }, transform.duration * 1000);
        }
    }, 1000);
}

function encenderLED(pin) {
    var led = new five.Led(pin);
    led.on();
}

function apagarLED(pin) {
    var led = new five.Led(pin);
    led.off();
}