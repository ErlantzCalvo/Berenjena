const fs = require('fs')
const ytdl = require('ytdl-core')
const readline = require('readline')
const ffmpeg = require('fluent-ffmpeg')
const {dialog,app, screen} = require('electron').remote

ffmpeg.setFfmpegPath('./bin/ffmpeg')
var screenSize = screen.getPrimaryDisplay().size
var title
let validURL=false
var url
var front=true
var downloading=false
var wdt =0
var folderenjena = app.getPath('desktop')+"\\"

function linkChanged(text){
    if (ytdl.validateURL(text)) {
      validURL=true
      url=text
      ytdl.getInfo(text,(err, info)=>{
        if (err)throw err
          title=info.title.replace(/[^a-zA-Z ]/g, "")
      })
      document.getElementById("txtLink").setAttribute("class","fine")


  }else {
    document.getElementById("txtLink").setAttribute("class","error")
    validURL=false
  }
}

 function downloadMedia(audio){
  if (validURL) {
    downloading=true
    var berenjeno=setInterval(angryBerenjena(),1000)
    let video = ytdl(url)

    video.pipe(fs.createWriteStream(folderenjena+title+".mp4"));
    video.once('response', () => {
    document.getElementById("pbDownload").style.display="block"

  })

  video.on('progress',(chunkLength, downloaded, total)=>{

    downloadingProcess(chunkLength, downloaded, total)



  })

  video.on('end',()=>{
    document.getElementById("pbDownload").style.display="none"
    document.getElementById("pbText").innerHTML=""
    document.getElementById("pbDownloadStatus").setAttribute("style","width:"+0+"%")
    video=null
    if(audio)downloadAudio()
    clearInterval(berenjeno)
    downloading=false
  })


}else{alert("invalid link")}

}

function downloadingProcess(chunkLength, downloaded, total){
  document.getElementById("pbDownload").setAttribute("aria-valuemax",total)
  const floatDownloaded = downloaded / total
  document.getElementById("pbDownload").setAttribute("aria-valuenow",floatDownloaded)
  document.getElementById("pbDownloadStatus").setAttribute("style","width:"+(floatDownloaded*100)+"%")
  document.getElementById("pbText").innerHTML=Math.round(floatDownloaded*100)+"%"

  readline.cursorTo(process.stdout, 0);
process.stdout.write(`${(floatDownloaded * 100).toFixed(2)}% downloaded`);
process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
readline.moveCursor(process.stdout, 0, -1);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

 function downloadAudio(){

    var proc = new ffmpeg({source:folderenjena+title+'.mp4'})
        .setFfmpegPath("./bin/ffmpeg")
        .toFormat('mp3')
        .saveToFile(folderenjena+title+'.mp3')

removeVideo()

//old audio
  /*let stream = ytdl(url,{filter:'audioonly'})

  let start = Date.now();
  document.getElementById("pbDownload").style.display="block"
  var downloadText =document.getElementById("pbText")
  downloadText.innerHTML="Downloading"
  var shittyInterval = setInterval(shittyAnimation,50)

  downloading=true
ffmpeg(stream)
  .audioBitrate(128)
  .save(folderenjena+title+".mp3")
  .on('progress', (p) => {

    shittyAnimation()
    readline.cursorTo(process.stdout, 0);
    downloadText.innerHTML=`${p.targetSize} kb downloaded`
    process.stdout.write(`${p.targetSize}kb downloaded`);
  })
  .on('end', () => {
    downloading=false
    document.getElementById("pbDownload").style.display="none"
    document.getElementById("pbText").innerHTML=""
    document.getElementById("pbDownloadStatus").setAttribute("style","width:"+0+"%")
    clearInterval(shittyInterval)
    document.getElementById("angryEggplant").style.display="none"
  });*/
}


function angryBerenjena(){
  /*if (front && wdt<100) {
    document.getElementById("pbDownloadStatus").setAttribute("style","width:"+wdt+"%")
    wdt++
  }else if (!front && wdt>0) {
    document.getElementById("pbDownloadStatus").setAttribute("style","width:"+wdt+"%")
    wdt--
  }else {
    front=!front
  }*/
  document.getElementById("angryEggplant").style.display="block"
  let angry = document.getElementById("angryEggplant")
  let rand = Math.random()
  if (rand<=0.5) {
      //if (Math.random()<=0.5) {

    $("#angryEggplant").animate({top: '-='+rand*1000+'px'}, rand*5000).animate({top: '+='+rand*1000+'px'},rand*5000)


    //  }
  }

}
function closeApp(){

  if (downloading) {
    let d = dialog.showMessageBox({type:'warning', title:'warning', buttons:['yes','no','cancel'], message:'Download in progress, are you sure you want to close Berenjena? '})
  }
//require('electron').remote.getCurrentWindow().close()

}
function selectFolderenjena(){
  let newFolder =dialog.showOpenDialog({title: "Save as...", defaultPath: folderenjena,properties:['openDirectory']})
  folderenjena = (newFolder!== undefined && newFolder.length>0)?newFolder[0]+'\\':folderenjena

}

function removeVideo(){
  if (fs.existsSync(folderenjena+title+'.mp4')) {
      fs.unlinkSync(folderenjena+title+'.mp4', (err) => {
          if (err) {
              alert("An error ocurred updating the file" + err.message);
              console.log(err);
              return;
          }
          console.log("File succesfully deleted");
      })
  }

}
