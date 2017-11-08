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
    pinPeltierFrioViento,
    pinPeltierCalorViento,
    pinAgua,
    pinHumo,
    pinHumoViento,
    pinLuzR,
    pinLuzG,
    pinLuzB,
    pinViento1,
    pinViento2;



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
    var numPinPeltierFrioViento = 52;
    var numPinPeltierCalorViento = 53;
    pinPeltierFrio = new five.Pin(numPinPeltierFrio);
    pinPeltierCalor = new five.Pin(numPinPeltierCalor);
    pinPeltierFrioViento = new five.Pin(numPinPeltierFrioViento);
    pinPeltierCalorViento = new five.Pin(numPinPeltierCalorViento);

    // AGUA
    var numPinAgua = 34;
    pinAgua = new five.Pin(numPinAgua);

    // HUMO
    var numPinHumo = 32;
    var numPinHumoViento = 33;
    pinHumo = new five.Pin(numPinHumo);
    pinHumoViento = new five.Pin(numPinHumoViento);

    // LUZ
    var numPinLuzR = 10;
    var numPinLuzG = 9;
    var numPinLuzB = 8;
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
    this.pinMode(numPinLuzR, five.Pin.PWM);
    this.pinMode(numPinLuzG, five.Pin.PWM);
    this.pinMode(numPinLuzB, five.Pin.PWM);

    // VIENTO
    var numPinViento1 = 30;
    var numPinViento2 = 31;
    pinViento1 = new five.Pin(numPinViento1);
    pinViento2 = new five.Pin(numPinViento2);



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

        // Después de haber recibido todas las interacciones, las determina
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
            }, transform.duration * 1000); // A segundos
        }
    }, 1000);
}



/*------------------------------------

    Funciones para cada acción

------------------------------------*/

function crearViento(transform) {
    var funcion = {
        iniciar: function() {
            pinViento1.high();
            pinViento2.high();
        },
        detener: function() {
            pinViento1.low();
            pinViento2.low();
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
            board.analogWrite(10, color.R);
            board.analogWrite(9, color.G);
            board.analogWrite(8, color.B);
        },
        detener: function() {
            board.analogWrite(10, 0);
            board.analogWrite(9, 0);
            board.analogWrite(8, 0);
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
    var state = transform.state; // 1 = Frío, 0 = Calor
    var funcion = {
        iniciar: function () {
            if (state === 0) {
                pinPeltierFrio.high();
                pinPeltierFrioViento.high();
            } else {
                pinPeltierCalor.high();
                pinPeltierCalorViento.high();
            }
        },
        detener: function () {
            if (state === 0) {
                pinPeltierFrio.low();
                pinPeltierFrioViento.low();
            } else {
                pinPeltierCalor.low();
                pinPeltierCalorViento.low();
            }
        }
    };
    ejecutarInteraccion(transform, funcion, "TEMP");
}