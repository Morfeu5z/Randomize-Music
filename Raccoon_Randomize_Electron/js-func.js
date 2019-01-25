// Get drives list
localStorage.setItem('DiskLoop', 0);

/** Electron imports **/
const electron = require('electron');
const { remote, ipcRenderer } = require('electron');
const popmotion = require('popmotion');
const fs = require('fs');
const diskInfo = require('diskinfo');
const ytdl = require('ytdl-core');


/** FM Comtrollers **/
const ulList = document.querySelector('#file-list ul');
const ulDisk = document.querySelector('#app-disk ul');
const diskRefresh = document.querySelector('#disks-refresh');

var clickedMenuBox = false; //left slider
var doAnimation = false; // left slider animation
var pathTable = []; // Starter path on windows
var path = '';

/** YTD controllers **/
var newTitle = '';
var downloadBtnName = 'Pobierz MP3';
var downloadAudio = true;
var videoID;
var activeYTDL = false;
var downloadActive = false;
var downloadSuccess = false;



/** -----------------------App ---------------------- **/
function closeApp() {
    remote.app.quit();
}
function minmax() {
    const currentWindow = remote.getCurrentWindow();
    if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
    } else {
        currentWindow.maximize();
    }
}
function hiddeWindow() {
    remote.getCurrentWindow().minimize();
}



/** -----------------------File Manager---------------------- **/
/** Create list of disks */
function getDiskList() {
    ulDisk.innerHTML = '';
    diskInfo.getDrives((err, drives) => {
        // console.log(drives.length);
        for (var i = (!localStorage.getItem('DiskLoop') ? 0 : localStorage.getItem('DiskLoop')); i < drives.length; i++) {
            var newDisk = document.createElement('li');
            var newLabel = document.createTextNode(drives[i].mounted + '\\');
            newDisk.appendChild(newLabel);
            ulDisk.appendChild(newDisk);
        }
        localStorage.setItem('DiskLoop', drives.length);
        pathTable = [];
        pathTable.push(drives[0].mounted + '\\');
        path = pathbuilder('current');
        // Get actualy dirs and files
        getDir(path);
    });
}

/** Path maker
 * @param {*} mode 
 */
function pathbuilder(mode) {
    var first = true;
    switch (mode) {
        case 'current':
            var compleate = '';
            pathTable.forEach(element => {
                (!first) ? compleate += element + '\\' : compleate += element;
                first = false;
            });
            return compleate;
            break;
        case 'back':
            if (pathTable.length > 1) pathTable.pop();
            var compleate = '';
            pathTable.forEach(element => {
                (!first) ? compleate += element + '\\' : compleate += element;
                first = false;
            });
            return compleate;
            break;
        case 'home':
            var tmp = pathTable[0];
            pathTable = [];
            pathTable.push(tmp);
            var compleate = pathTable[0];
            return compleate;
            break;
    }
}

/** Create list of dirs and files
 * @param {*} path 
 */
function getDir(path) {
    files = fs.readdirSync(path);
    ulList.innerHTML = '';
    // console.log(files);
    files.forEach(element => {
        //console.log(element.slice(-4, -1));
        if (element[0] != "$" && element.slice(-4, -1) != ".sy" && element.slice(-4, -1) != ".Ms") {
            newli = document.createElement('li'); // new li element
            newtxt = document.createTextNode(element); // add file or dir name
            newli.appendChild(newtxt);
            ulList.appendChild(newli); // add to ul
        }
    });
    // console.log(newlist);
    document.querySelector('#current-path').innerHTML = path;
}



/** -----------------------Randomize Tools---------------------- **/
/** Randomize files with prefix */
function randomize() {
    // console.log(path);
    if (!confirm("Are you sure you want to randomize this directory: " + path + "?")) return 0;
    reRandomize(false);
    var wasRandom = false;
    var list = fs.readdirSync(path);
    var miss = 0;
    var prefix = 0;
    var ll = list.length;
    for (var i = 0; i < ll; i++) {
        // console.log(list);
        var x = 0;
        x = Math.floor(Math.random() * (list.length - 1));
        // console.log(x);
        prefix++;
        if (fs.lstatSync(path + list[x]).isDirectory()) {
            //Do nothing
            miss++;
        } else {
            fs.renameSync(path + list[x], path + prefix + "_-_" + list[x]);
            wasRandom = true;
        }
        list.splice(x, 1);
    }
    getDir(path);
    if (wasRandom) {
        addInfoSlide('Randomize Complete.');
        addInfoSlide('Miss directory: ' + miss);
    } else {
        addInfoSlide('Nothing to randomize.');
    }
}

/** reRandomize files
 * @param {*} setInfo 
 */
function reRandomize(setInfo = true) {
    if (setInfo) if (!confirm("Are you sure you want to re-randomize this directory: " + path + "?")) return 0;;
    // console.log(path);
    var list = fs.readdirSync(path);
    var prefix = 0;
    var wasRandom = false;
    list.forEach(item => {
        var ext = item.split('.');
        ext = ext[ext.length - 1];
        var end = item.length - ext.length;

        for (var i = 0; i < end; i++) {
            var old_prefix = item.slice(i, i + 2);
            var prefix = item.slice(i, i + 3);
            if (prefix == "_-_") {
                try {
                    wasRandom = true;
                    fs.renameSync(path + item, path + item.slice(i + 3, item.length));
                    i = end;
                } catch (error) {
                    addInfoSlide('Error! File: \"' + item + '\" is used by another program.', 'error', 10000);
                }
            } else if (old_prefix == '. ') {
                try {
                    wasRandom = true;
                    fs.renameSync(path + item, path + item.slice(i + 2, item.length));
                    i = end;
                } catch (error) {
                    addInfoSlide('Error! File: \"' + item + '\" is used by another program.', 'error', 10000);
                }
            }
        }
    });
    getDir(path);
    if (setInfo) if (wasRandom) {
        addInfoSlide('Re-Randomize Complete.');
    } else {
        addInfoSlide('Nothing to Re-Randomize.');
    };
}



/** -----------------------YTDL---------------------- **/
function yt_downloader_show() {
    document.querySelector('#ytdl-container').classList.add('ytdl-container-active');
}

function yt_downloader_hide() {
    document.querySelector('#ytdl-container').classList.remove('ytdl-container-active');
    if (downloadActive) addInfoSlide('Pobieranie w tle.', '', 10000);
}

/** Check title when user modify it
 * @param {*} name 
 */
function ytdl_nameChange(name){
    newTitle = titleStandarization(name);
    console.log(newTitle);
    ytd_panel_mode('mp3mp4');
}

/** check the correctness of url and title
 * @param {link} url 
 */
function ytdl_linkCheck(url) {
    if (downloadActive == false) {
        try {
            videoID = ytdl(url);
            ytdl.getInfo(ytdl.getURLVideoID(url), (err, info) => {
                if (err) throw err;
                console.log(info);
                newTitle = titleStandarization(info.title);
                ytd_panel_mode('linkAccept');
            });
        } catch (error) {
            ytd_panel_mode('linkError');
        }
    }
}

/** Audio/Video chooser
 * @param {*} format 
 */
function setYTD_Radio(format){
    // console.log(format);
    if(downloadActive === false){
        switch(format){
            case 'mp3':
                downloadBtnName = 'Pobierz MP3';
                downloadAudio = true;
                ytd_panel_mode('mp3mp4');
                break;
                
                case 'mp4':
                downloadBtnName = 'Pobierz MP4';
                downloadAudio = false;
                ytd_panel_mode('mp3mp4');
                break;
        }
    }
}

/** Active or deactive radio buttons
 * mode: active, deactive
 * @param {*} mode 
 */
function radioBtnMode(mode){
    var YTD_radio = document.getElementsByName('ytd_radio');
    switch (mode) {
        case 'active':
                YTD_radio.forEach(radio => {
                    radio.disabled = false;
                });   
                break;
                case 'deactive':
                YTD_radio.forEach(radio => {
                    radio.disabled = true;
            });   
        break;

    }    
}

/** Download Audio Script
 * FIXME: It's definitly not best quality, for that I need converting with ffmpeg used
 * @param {*} url 
 */
function yt_downloader_btn(url) {
    if(downloadAudio){
        // videoID = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
        // videoID = ytdl(url, {filter: (format) => format.audioBitrate === 128 });
        /** best audio */
        videoID = ytdl(url, { filter: 'audioonly'});
        yt_downloader(url, '.mp3');
    }else{
        // videoID = ytdl(url, { filter: 'audioandvideo', quality: 'highest' });
        videoID = ytdl(url, { quality: 'highest'});
        yt_downloader(url, '.mp4');
    }
}

/** YouTube Downloader Script
 * @param {*} url 
 */
function yt_downloader(url, ext='.mp3') {
    if (activeYTDL && downloadActive == false) {
        if (path == "C:\\") {
            addInfoSlide("Należy wskazać folder docelowy!", 'error', 10000);
        } else {
            // Blocking script if downloading is active
            activeYTDL = false;
            newTitle = titleStandarization(newTitle);
            ytdl.getInfo(ytdl.getURLVideoID(url), (err, info) => {
                if (err) throw err;
                /** TODO: Set Start and End point of music (cut) */
                var filePointer = path + newTitle + ext;
                // console.log("Path: " + filePointer);
                videoID.pipe(fs.createWriteStream(filePointer));
                ytd_panel_mode('start');
            });
            var ile = 0;
            videoID.on("progress", () => {
                console.log("Progress...");
                document.querySelector('#downloadButton h3').textContent = "Pobieranie: " + ile++;
            })

            videoID.on("end", () => {
                ytd_panel_mode('success');
            })
        }
    } else if (downloadSuccess) ytd_panel_mode('reset');
}

/** Function return file name without problematic symbols
 * @param {string} title 
 */
function titleStandarization(title = 'tmp') {
    var omv = 'Official';
    var sliceEnd = title.length;
    if (title.length > 60) sliceEnd = 60;
    title = title.slice(0, sliceEnd);

    for (var i = 0; i < title.length; i++) {
        var error = 0;
        //console.log(title.slice(i, i+9));
        if (title.slice(i, i + 8) == omv) {
            if (title[i - 2] != ' ') {
                title = title.slice(0, i - 1);
            } else {
                title = title.slice(0, i - 2);
            }
        } else {
            switch (title[i]) {
                case '\\':
                    error++;
                    break;
                case '/':
                    error++;
                    break;
                    break;
                case ':':
                    error++;
                    break;
                    break;
                case '*':
                    error++;
                    break;
                    break;
                case '?':
                    error++;
                    break;
                    break;
                case '"':
                    error++;
                    break;
                    break;
                case '<':
                    error++;
                    break;
                    break;
                case '>':
                    error++;
                    break;
                    break;
                case '|':
                    error++;
                    break;
                default:
                    error = 0;
            }
            if (error > 0) title = title.slice(0, i) + title.slice(i + 1, title.length);
        }
    }
    return title;
}

/** Change visual design using info about ytd status
 * mode: 'success', 'start', 'reset'
 * @param {ytd panel mode} mode 
 */
function ytd_panel_mode(mode) {
    switch (mode) {
        case 'mp3mp4':
            if(downloadSuccess){
                document.querySelector('#downloadButton').classList.remove("successBtn");
                downloadSuccess = false;
            }
            document.querySelector('#downloadButton h3').textContent = downloadBtnName;
            document.querySelector('#ytdl_title').disabled = false;
            ytd_panel_mode('linkAccept');
            break;

        case 'reset':
            document.querySelector('#url').value = '';
            document.querySelector('#downloadButton').classList.remove("successBtn");
            document.querySelector('#downloadButton h3').textContent = "Wprowadź link";
            document.querySelector('#ytdl_title').value = '';
            document.querySelector('#url').disabled = false;
            break;
            
        case 'success':
            console.log("Download Complete");
            addInfoSlide("Pobieranie zakończone");
            document.querySelector('#downloadButton h3').textContent = "Clear!";
            document.querySelector('#downloadButton').classList.remove("activeBtn");
            document.querySelector('#downloadButton').classList.add("successBtn");
            document.querySelector('#downloadPic').classList.remove("downloadPicActive");
            downloadActive = false;
            downloadSuccess = true;
            radioBtnMode('active');
            break;
            
        case 'start':
            console.log("Pobieranie!");
            addInfoSlide("Rozpoczynam pobieranie");
            document.querySelector('#downloadPic').classList.add("downloadPicActive");
            downloadActive = true;
            getDir(path);
            radioBtnMode('deactive');
            document.querySelector('#ytdl_title').disabled = true;
            document.querySelector('#url').disabled = true;
            break;

        case 'linkError':
            console.log("Link error.");
            addInfoSlide("Nieprawidowy link!", 'error');
            document.querySelector('#downloadButton').classList.remove("activeBtn");
            document.querySelector('#downloadButton h3').textContent = "Wprowadź link";
            document.querySelector('#ytdl_title').textContent = "Nieprawidowy link!";
            break;

        case 'linkAccept':
            document.querySelector('#ytdl_title').value = newTitle;
            document.querySelector('#downloadButton').classList.add("activeBtn");
            document.querySelector('#downloadButton h3').textContent = downloadBtnName;
            addInfoSlide("Gotowe do pobrania.");
            activeYTDL = true;
            break;
    }
}



/** -----------------------File delete---------------------- **/
/** Delete file global path*/
var toDelete;

/** Delete global path builder
 * @param {*} ev 
 */
function setTriggerToDelete(ev) {
    toDelete = path + ev;
}

/** Delete file or directory */
function deleteFile() {
    console.log("File to delete: " + toDelete);
    try {
        if (fs.lstatSync(toDelete).isDirectory()) {
            if (!confirm("Napewno chcesz usunąć folder: \"" + toDelete + "\"?")) {
                aminate_slider();
                return 0;
            }
        } else if (fs.lstatSync(toDelete).isFile()) {
            if (!confirm("Napewno chcesz usunąć plik: \"" + toDelete + "\"?")) {
                aminate_slider();
                return 0;
            }
        } else {
            aminate_slider();
            return 0;
        }
        aminate_slider();
        try {
            fs.unlinkSync(toDelete);
            console.log("Deleted file: " + toDelete);
            addInfoSlide("Usunięto: " + toDelete);
            getDir(path);
        } catch (error) {
            console.log("Delete error!");
            addInfoSlide("Wystąpil problem podczas usuwania!", 'error');
            getDir(path);
        }
    } catch (error) {
        aminate_slider();
        addInfoSlide("Brak dostępu do obiektu!", 'error');
        getDir(path);
    }

}



/** -----------------------Slider menu and info---------------------- **/
/** Slider (left menu) button maker */
function addButton(ico, txt, func = closeApp, style = 'slider-button') {
    var button = document.createElement('div');
    var div_ico = document.createElement('div');
    var div_txt = document.createElement('div');
    var icon = document.createElement('i');
    icon.classList.add(ico);
    var content = document.createTextNode(txt);
    div_ico.appendChild(icon);
    div_txt.appendChild(content);
    button.appendChild(div_ico);
    button.appendChild(div_txt);
    button.classList.add(style);
    button.addEventListener('click', func);
    return button;
}

/** info about file on slider */
function infoFuncEvent(e) {
    addInfoSlide(ev.target.textContent);
    // console.log(ev.target.textContent);
}

/** Left menu maker (slider) */
function aminate_slider(btnList = []) {
    dur = 250;
    if (!clickedMenuBox && !doAnimation) {
        clickedMenuBox = true;
        doAnimation = true
        var box = document.querySelector('#box');
        var slider_div = document.createElement("div");
        slider_div.classList.add("slider-box");
        slider_div.id = "slider-box";


        slider_div.appendChild(addButton('icon-shuffle', 'Randomize', randomize));
        slider_div.appendChild(addButton('icon-arrows-cw', 'Re-Randomize', reRandomize));
        slider_div.appendChild(addButton('icon-download', 'YouTube Downloader', yt_downloader_show));
        //bonus buttons
        if (btnList.length > 0) {
            btnList.forEach(btn => {
                slider_div.appendChild(addButton(btn[0], btn[1], btn[2]));
            });
        }
        //
        slider_div.appendChild(addButton('icon-logout', 'Exit', closeApp));


        box.appendChild(slider_div);

        const animBox = popmotion.styler(slider_div);
        popmotion.tween({
            to: {
                marginLeft: 0
            },
            duration: dur
        }).start(animBox.set);
        setTimeout(function () {
            doAnimation = false;
        }, dur + 150);

    } else if (clickedMenuBox && !doAnimation) {
        clickedMenuBox = false;
        doAnimation = true;
        box = document.querySelector('#slider-box');
        animBox = popmotion.styler(box);
        popmotion.tween({
            to: {
                marginLeft: -250
            },
            duration: dur
        }).start(animBox.set);
        setTimeout(function () {
            box.remove();
            doAnimation = false;
        }, dur + 150);
    }
};

/** Info block maker */
function addInfoSlide(txt, clas = '', wait = 4000) {
    if (clickedMenuBox) aminate_slider();
    var infoBox = document.querySelector('#info-slide');
    var infoItem = document.createElement('div');
    var infoTxt = document.createTextNode(txt);
    infoItem.appendChild(infoTxt);
    infoItem.classList.add('info-item-' + clas);
    infoBox.appendChild(infoItem);
    var animation = popmotion.styler(infoItem);
    popmotion.tween({
        to: {
            opacity: 1
        },
        duration: 300
    }).start(animation.set);

    setTimeout(() => {
        popmotion.tween({
            from: {
                opacity: 1
            },
            to: {
                opacity: 0
            },
            duration: 300
        }).start(animation.set);
        setTimeout(() => {
            infoItem.remove();
        }, 200);
    }, wait);
}