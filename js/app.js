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

var pinPeltierFrio,
    pinPeltierCalor,
    pinAgua,
    pinHumo,
    pinLuzR,
    pinLuzG,
    pinLuzB,
    pinViento;



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
    var numPinPeltierFrio = 50;
    var numPinPeltierCalor = 51;
    pinPeltierFrio = new five.Pin(numPinPeltierFrio);
    pinPeltierCalor = new five.Pin(numPinPeltierCalor);

    // AGUA
    var numPinAgua = 34;
    pinAgua = new five.Pin(numPinAgua);

    // HUMO
    var numPinHumo = 32;
    pinHumo = new five.Pin(numPinHumo);

    // LUZ
    var numPinLuzR = 42;
    var numPinLuzG = 44;
    var numPinLuzB = 46;
    pinLuzR = new five.Pin({
        pin: numPinLuzR,
        mode: 3
    });
    pinLuzG = new five.Pin({
        pin: numPinLuzG,
        mode: 3
    });
    pinLuzB = new five.Pin({
        pin: numPinLuzB,
        mode: 3
    });

    // VIENTO
    var numPinViento = 22;
    pinViento = new five.Pin(numPinViento);



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

    Determina las interacciones respectivas

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

    Ejecución de interacciones

------------------------------------*/

function ejecutarInteraccion(transform, funcion, label) {
    var fin = transform.start_time + transform.duration;
    var intervalo = setInterval(function () {
        if (tiempoActual >= transform.start_time && tiempoActual < fin) {
            console.log("SÍ " + label);
            funcion.iniciar();
            var timeout = setTimeout(function () {
                funcion.detener();
                clearTimeout(timeout);
                clearInterval(intervalo);
            }, transform.duration * 1000);
        }
    }, 1000);
}



/*------------------------------------

    Funciones para cada acción

------------------------------------*/

function crearViento(transform) {
    var funcion = {
        iniciar: function() {
            pinViento.high();
        },
        detener: function() {
            pinViento.low();
        }
    };
    ejecutarInteraccion(transform, funcion, "VIENTO");
}

function crearAgua(transform) {
    var funcion = {
       iniciar: function() {
           pinAgua.high();
       },
       detener: function () {
           pinAgua.low();
       }
    };
    ejecutarInteraccion(transform, funcion, "AGUA");
}

function crearLuz(transform) {
    var color = {
        R: transform.color[0],
        G: transform.color[1],
        B: transform.color[2]
    };
    var funcion = {
        iniciar: function() {
            board.io.pwmWrite(pinLuzR, color.R);
            board.io.pwmWrite(pinLuzG, color.G);
            board.io.pwmWrite(pinLuzB, color.B);
        },
        detener: function() {
            board.io.pwmWrite(pinLuzR, 0);
            board.io.pwmWrite(pinLuzG, 0);
            board.io.pwmWrite(pinLuzB, 0);
        }
    };
    ejecutarInteraccion(transform, funcion, "LUZ");
}

function crearHumo(transform) {
    var funcion = {
        iniciar: function() {
            pinHumo.high();
        },
        detener: function () {
            pinHumo.low();
        }
    };
    ejecutarInteraccion(transform, funcion, "HUMO");
}

function crearTemp(transform) {
    var state = transform.state; // 0 = Frío, 1 = Calor
    var funcion = {
        iniciar: function () {
            if (state === 0) {
                pinPeltierFrio.high();
            } else {
                pinPeltierCalor.high();
            }
        },
        detener: function () {
            if (state === 0) {
                pinPeltierFrio.low();
            } else {
                pinPeltierCalor.low();
            }
        }
    };
    ejecutarInteraccion(transform, funcion, "TEMP");
}