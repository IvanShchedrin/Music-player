// Глобалльные переменные
var context, // web audio context
    source, // источник звука
    bufferGlobal, // глобальный буфер песни, для повторного воспроизведения (создается при загрузке песни)
    filterNode, // фильтр (эквалайзер)
    destination, // получатель звука
    sp; // визуализатор waveform

var title = "Unknown title",
    artist = "Unknown artist",
    name = "";

// создаем context и фильтр
window.addEventListener("load", function() { 
	try {
		context = new (window.AudioContext || window.webkitAudioContext)();
	} catch(e) {
		alert("Web Audio API is not supported in this browser");
	}

    filterNode = context.createBiquadFilter();

}, false);

$(document).ready(function(){

    // обработка нажания на кнопку Play
	$("#play-button").click(function(){
        if (source){
            // прячем play и показываем stop
            $("#play-button").css('display', 'none');
            $("#pause-button").css('display', 'inline-block');

            // создаем источник звука и помещаем в него загруженный буфер песни
            source = context.createBufferSource();
            source.buffer = bufferGlobal;
            // создаем получатель звука (колонки) и коннектим его к буферу-источнику
            destination = context.destination;
            source.connect(destination);
            // подключаем визуализатор
            source.connect(sp);
            sp.connect(context.destination);
            // подключаем фильтр
            source.connect(filterNode);
            filterNode.connect(destination);

            source.start(0);
        } else {
            $("#name").text("Файл еще не загружен...");
        }
	});

    // обработка нажания на кнопку Stop
	$("#pause-button").click(function(){
		$("#play-button").css('display', 'inline-block');
		$("#pause-button").css('display', 'none');
        source.stop(0);
	});

    /* Параметры для настройки фильтра:
    *   type - тип фильтра (lowpass – 1, highpass – 2, bandpass – 3, 
    *           lowshelf – 4, highshelf – 5, peaking – 6, notch – 7, allpass - 8);
    *   frequency.value - частота, на которой базируется фильтр (Hz);
    *   gain.value - уровень усиления или ослабления данной частоты;
    *   Q.value -  – (добротность) – ширина полосы вокруг выбранной частоты, к которой будет 
    *           применяться усиление или ослабление. Чем выше значение Q, тем уже полоса. Чем ниже – тем шире.
    */

    // установка фильтра к переметрам Pop
    $("#equalizer-btns #Pop").click(function(){
        if(source){
            $("#equalizer-btns button").css('background-color', '#ddd');
            $(this).css('background-color', '#aaa');

            // сначала отключаем предыдущий фильтр
            filterNode.disconnect(destination);
            filterNode = null;
            filterNode = context.createBiquadFilter();

            filterNode.type = 4;
            filterNode.frequency.value = 320;
            filterNode.gain.value = 10;

            filterNode.type = 5;
            filterNode.frequency.value = 1700;
            filterNode.gain.value = -10;
            // подключаем фильтр
            source.connect(filterNode);
            filterNode.connect(destination);
        } else {
            $("#name").text("Чтобы изменить настройки эквалайзера, необходимо воспроизвести файл");
        }
    });

    // установка фильтра к переметрам Rock
    $("#equalizer-btns #Rock").click(function(){
        if(source){
            $("#equalizer-btns button").css('background-color', '#ddd');
            $(this).css('background-color', '#aaa');

            filterNode.disconnect(destination);
            filterNode = null;
            filterNode = context.createBiquadFilter();

            filterNode.type = 4;
            filterNode.frequency.value = 1500;
            filterNode.gain.value = -10;

            source.connect(filterNode);
            filterNode.connect(destination);
        } else {
            $("#name").text("Чтобы изменить настройки эквалайзера, необходимо воспроизвести файл");
        }
    });

    // установка фильтра к переметрам Jazz
    $("#equalizer-btns #Jazz").click(function(){
        if(source){
            $("#equalizer-btns button").css('background-color', '#ddd');
            $(this).css('background-color', '#aaa');

            filterNode.disconnect(destination);
            filterNode = null;
            filterNode = context.createBiquadFilter();

            filterNode.type = 4;
            filterNode.frequency.value = 250;
            filterNode.Q.value = 5;

            filterNode.type = 5;
            filterNode.frequency.value = 2000;
            filterNode.Q.value = 3;

            source.connect(filterNode);
            filterNode.connect(destination);
        } else {
            $("#name").text("Чтобы изменить настройки эквалайзера, необходимо воспроизвести файл");
        }
    });

    // установка фильтра к переметрам Classic
    $("#equalizer-btns #Classic").click(function(){
        if(source){
            $("#equalizer-btns button").css('background-color', '#ddd');
            $(this).css('background-color', '#aaa');

            filterNode.disconnect(destination);
            filterNode = null;
            filterNode = context.createBiquadFilter();

            filterNode.type = 6;
            filterNode.frequency.value = 950;
            filterNode.Q.value = 0.2;
            filterNode.gain.value = 12;

            source.connect(filterNode);
            filterNode.connect(destination);
        } else {
            $("#name").text("Чтобы изменить настройки эквалайзера, необходимо воспроизвести файл");
        }
    });

    // установка фильтра к переметрам Normal
    $("#equalizer-btns #Normal").click(function(){
        if(source){
            $("#equalizer-btns button").css('background-color', '#ddd');
            $(this).css('background-color', '#aaa');

            filterNode.disconnect(destination);
            filterNode = null;
            filterNode = context.createBiquadFilter();

            source.connect(filterNode);
            filterNode.connect(destination);
        } else {
            $("#name").text("Чтобы изменить настройки эквалайзера, необходимо воспроизвести файл");
        }
    });
});

window.onload = function(){

    // переменные для работы с визуализатором
    var canvas = document.getElementById("visualizer");
    var canvasW = canvas.offsetWidth;
    var canvasH = canvas.offsetHeight;
    var canvasHh = Math.floor( canvasH / 2 );
    
    // настраиваем поле для визуализатора
    canvas.ctx = canvas.getContext( "2d" );
    canvas.ctx.strokeStyle = "#000";
    canvas.ctx.lineWidth = 2;
    canvas.ctx.fillStyle = "#eee";
    canvas.ctx.fillRect( 0, 0, canvasW, canvasH );

    // функция отрисовки линий waveform
    function vizualize(sample) {
        canvas.ctx.fillRect( 0, 0, canvasW, canvasH );
        canvas.ctx.beginPath();
 
        canvas.ctx.moveTo(-1, canvasHh);
        var y;
        for ( var x = 0; x < canvasW; x++ ) {
            y = canvasHh - Math.floor( sample[x] * canvasHh );
            canvas.ctx.lineTo( x, y );
        }
        canvas.ctx.stroke();
    }

    function playsound(raw) {
        context.decodeAudioData(raw, function (buffer) {
            // если получили пустой буфер, значит файл не прочитался - завершаем работу
            if (!buffer) {
                $("#name").text("Невозможно прочитать файл");
                return;
            }
            // останавливаем предыдущую песню
            if (source){
                source.stop(0);
            }
            // сбрасываем предыдущий визуализатор
            if (sp){
                sp.disconnect(destination);
                sp = null;
            }

            // сохраняем буфер в глобальный буфер
            bufferGlobal = buffer;
            // создаем источник звука и помещаем в него загруженный буфер песни
            source = context.createBufferSource();
            source.buffer = bufferGlobal;
            //создание объекта ScriptProcessor
            //аргументы: длина буфера, количество входящих каналов, количество исходящих каналов
            //чем больше буфер - тем меньшее число раз будет вызыван код обработки,
            //должен быть кратен степени двойки
            sp = context.createScriptProcessor ? context.createScriptProcessor( 512, 2, 2 ) : context.createJavaScriptNode( 512, 2, 2 );

            // функция анализа исходящего сигнала
            sp.onaudioprocess = function (ape) {
                // переменные для анализа сигнала
                var inputBuffer = ape.inputBuffer;
                var outputBuffer = ape.outputBuffer;
                var channel;
                var channelsLen = outputBuffer.numberOfChannels;
                var sample;
                var sampleLen = inputBuffer.length;

                // для визулизации создаем монобуфер
                var mono = new Array(sampleLen);
                for (sample = 0; sample < sampleLen; sample++) 
                    mono[sample] = 0;

                for (channel = 0; channel < channelsLen; channel++) {  

                    var inputData = inputBuffer.getChannelData(channel);

                    // микшируем в монобуфер все каналы
                    for (sample = 0; sample < sampleLen; sample++) 
                        mono[sample] = (mono[sample] + inputData[sample]) / 2;
                }
                vizualize(mono);
            };
            
            // создаем получатель звука (колонки) и коннектим его к буферу-источнику
            destination = context.destination;
            source.connect(context.destination);
            // подключаем визуализатор
            source.connect(sp);
            sp.connect(context.destination);
            // подключаем фильтр
            source.connect(filterNode);
            filterNode.connect(destination);
            // запускаем и меняем кнопки
            source.start(0);
            $("#play-button").css('display', 'none');
            $("#pause-button").css('display', 'inline-block');
            // выводим имя файла в текстовое поле
            $("#name").text(name);
        }, function (error) {
            console.error("failed to decode:", error);
        });
    }

    // функция обработки события изменения файла в input`е
    function onfilechange(then, evt) {
        var files = evt.target.files;
        var selFile = files[0];
        var reader = new FileReader();
        // выводим имя файла в текстовое поле
        name = selFile.name;
        $("#name").text(name);

        // функция обработки события загрузки файла
        reader.onload = function (e) {
            /* работа с бинарными данными (https://github.com/jDataView/jDataView)
            *   используем для вытаскивания мета-данных из файла
            *   поддерживаются только ID3v1 и ID3v2 теги
            */
            var dv = new jDataView(this.result);
            // забираем мета-данные и проставляем в форму
            if (dv.getString(3, dv.byteLength - 128) == 'TAG') {
                title = dv.getString(30, dv.tell());
                artist = dv.getString(30, dv.tell());
                $("#title").text(title);
                $("#artist").text(artist);
            } else {
                $("#title").text("Unknown title");
                $("#artist").text("Unknown artist");
            }

            then(e.target.result);
        };

        reader.onerror = function (e) {
            console.error(e);
        };

        reader.readAsArrayBuffer(selFile);
    };

    document.getElementById('file').addEventListener('change', onfilechange.bind(null, playsound), false);
}