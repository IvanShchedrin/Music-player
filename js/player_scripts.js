// Глобалльные переменные
var context, // web audio context
    source, // источник звука
    bufferGlobal, // глобальный буфер песни, для повторного воспроизведения (создается при загрузке песни)
    filterNode, // фильтр (эквалайзер)
    destination, // получатель звука
    sp, // визуализатор waveform
    timeFull,
    isPaused = 0,
    progress; 

var title = "Unknown title",
    artist = "Unknown artist",
    name = "",
    artistLink = "about:blank",
    coverLink = "about:blank";

var startOffset = 0,
    startTime = 0;

// создаем context и фильтр
window.addEventListener("load", function() { 
	try {
		context = new (window.AudioContext || window.webkitAudioContext)();
	} catch(e) {
		alert("Web Audio API is not supported in this browser");
	}

    filterNode = context.createBiquadFilter();

}, false);

function toTime(ms){
    var date = new Date(null);
    date.setSeconds(ms/1000);
    return date.toISOString().substring(14, 19);
}

function updateMetaData(file) {
    ID3.loadTags(file.name, function () {
        tags = ID3.getAllTags(file.name);
        title = tags.title || "Unknown title";

        if(tags.artist){
            artist = tags.artist;
            artistLink = "https://music.yandex.ru/search?text=" + tags.artist;
        } else {
            artist = "Unknown artist";
            artistLink = "about:blank";
        }
        if(tags.album){
            coverLink = "https://music.yandex.ru/search?text=" + tags.album;
        } else {
            coverLink = "about:blank";
        }

        $("#title").text(title);
        $("#artist").text(artist);
        $("#artist-link").attr("href", artistLink)
        $("#cover-link").attr("href", coverLink)

        if ("picture" in tags) {
            var cover = tags.picture;
            var base64String = "";
            for (var i = 0; i < cover.data.length; i++) {
                base64String += String.fromCharCode(cover.data[i]);
            }
            $("#cover").hide();
            $("#cover").attr("src", "data:" + cover.format + ";base64," + window.btoa(base64String));
            $("#cover").fadeIn(1000);

        } else {
            $("#cover").hide();
            $("#cover").attr("src", "images/album.png");
            $("#cover").fadeIn(1000);
        }

    },
    
    {
        tags: ["artist", "title", "picture", "album"], dataReader: FileAPIReader(file)
    });
}

$(document).ready(function(){

    setTimeout(function() {
        $("#container").animate({"opacity" : "0"}, 1000); 
    }, 1000);
    setTimeout(function() {
        $("#container").css({"height" : "450px", "width" : "500px", "margin": "-225px 0 0 -250px"});
    }, 2100);
    setTimeout(function() {
        $("#container").animate({"opacity" : "1"}, 1000);
    }, 2200);

    $("#container").draggable();

    $("#pause-button").click(function(){
        $("#resume-button").fadeIn(200);
        $(this).fadeOut(200);
        source.stop();
        startOffset += context.currentTime - startTime;
        isPaused = 1;
    });

    $("#about").click(function() {
        var box = $("#about-box");
        box.toggle(300);
        setTimeout(function() {
            box.css({"top": "150px", "left": "125px"});
        }, 300);
        box.draggable();
    });

    $("#resume-button").click(function(){
        $("#pause-button").fadeIn(200);
        $(this).fadeOut(200);

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
        
        startTime = context.currentTime;
        isPaused = 0;
        source.start(0, startOffset % bufferGlobal.duration);
    });

    $("#file").on("dragenter", function(){
        $("#move-here").animate({'background-color':'#333'},300);
    });

    $("#file").on("dragleave", function(){
        $("#move-here").animate({'background-color':'#ddd'},300);
    });

    $("#songJump").click(function(e){
        var posPescents =  (e.pageX - $(this).offset().left) / $(this).width();
        
        source.stop();
        startOffset = (timeFull / 1000) * posPescents;
        isPaused = 1;

        $("#pause-button").css('display', 'inline-block');
        $("#resume-button").css('display', 'none');

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
        
        startTime = context.currentTime;

        if(startOffset < 0 || startOffset > timeFull / 1000){
            source.start(0, 1 % bufferGlobal.duration);
        } else{
            source.start(0, startOffset % bufferGlobal.duration);
        }

        isPaused = 0;
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
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
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
    });

    // установка фильтра к переметрам Rock
    $("#equalizer-btns #Rock").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = 4;
        filterNode.frequency.value = 1500;
        filterNode.gain.value = -10;

        source.connect(filterNode);
        filterNode.connect(destination);
    });

    // установка фильтра к переметрам Jazz
    $("#equalizer-btns #Jazz").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
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
    });

    // установка фильтра к переметрам Classic
    $("#equalizer-btns #Classic").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = "lowpass";
        filterNode.frequency.value = 0;
        filterNode.Q.value = 0;
        filterNode.gain.value = -1;

        source.connect(filterNode);
        filterNode.connect(destination);
    });

    // установка фильтра к переметрам Normal
    $("#equalizer-btns #Normal").click(function(){
        $("#equalizer-btns button").css('background-color', 'rgba(229, 229, 229, .7)');
        $(this).css('background-color', '#aaa');

        filterNode.disconnect(destination);
        filterNode = null;
        filterNode = context.createBiquadFilter();

        filterNode.type = 1;
        filterNode.frequency.value = 0;
        filterNode.Q.value = 0;

        source.connect(filterNode);
        filterNode.connect(destination);
    });

    $("#file").hover(function() {
        $("#move-here").animate({"background-color" : "#333"}, 300);
        $("#move-here span").animate({"color" : "#eee"}, 300);
    }, function() {
        $("#move-here").animate({"background-color" : "#ddd"}, 300);
        $("#move-here span").animate({"color" : "#333"}, 300);
    });

    // переменные для работы с визуализатором
    var canvas = document.getElementById("visualizer");
    var canvasW = canvas.offsetWidth;
    var canvasH = canvas.offsetHeight;
    var canvasHh = Math.floor( canvasH / 2 );
    
    // настраиваем поле для визуализатора
    canvas.ctx = canvas.getContext( "2d" );
    canvas.ctx.strokeStyle = "#eee";
    canvas.ctx.lineWidth = 2;
    canvas.ctx.fillStyle = "rgba(0, 0, 0, 0)";
    canvas.ctx.fillRect( 0, 0, canvasW, canvasH );

    // функция отрисовки линий waveform
    function vizualize(sample) {
        canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
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

            progress = $("#progress");
            sp = context.createScriptProcessor ? context.createScriptProcessor( 512, 2, 2 ) : context.createJavaScriptNode( 512, 2, 2 );

            // функция анализа исходящего сигнала
            sp.onaudioprocess = function (ape) {
                var time = 0;

                if(!isPaused){
                    time = (context.currentTime - startTime + startOffset) * 1000;
                    $("#timer").text(toTime(time % timeFull) + "/" + toTime(timeFull));
                    progress.css("width", (time * 100) / (timeFull) + "%");
                }

                if(time > timeFull){
                    source.stop();
                    isPaused = 1;
                    startOffset = 0;
                    $("#resume-button").css('display', 'inline-block');
                    $("#pause-button").css('display', 'none');
                }



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

            startTime = context.currentTime;
            timeFull = source.buffer.duration * 1000;
            startOffset = 0;

            // запускаем и меняем кнопки
            isPaused = 0;
            source.start(0);
            $("#manualing").fadeIn(800);
            $("#loading").animate({'opacity':'0'},500);


            $("#wait-button").css('display', 'none');
            $("#pause-button").css('display', 'inline-block');
            $("#resume-button").css('display', 'none');
            // выводим имя файла в текстовое поле
            $("#name").text(name);
        }, function (error) {
            console.error("failed to decode:", error);
        });
    }

    // функция обработки события изменения файла в input`е
    function onfilechange(then, evt) {
        $("#move-here").css({'background-color':'#ddd'},500);
        var files = evt.target.files;

        if(files[0]){
            $("#loading").animate({'opacity':'1'},500);
            var selFile = files[0];
            var reader = new FileReader();
            // выводим имя файла в текстовое поле
            name = selFile.name;
            $("#name").text(name);

            // функция обработки события загрузки файла
            reader.onload = function (e) {
                updateMetaData(selFile);
                then(e.target.result);
            };

            reader.onerror = function (e) {
                console.error(e);
            };

            reader.readAsArrayBuffer(selFile);
        }
    };

    document.getElementById('file').addEventListener('change', onfilechange.bind(null, playsound), false);

});