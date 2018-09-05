const fs = require('fs')
const ytdl = require('ytdl-core')
const readline = require('readline')
const ffmpeg = require('fluent-ffmpeg')
const {dialog,app, screen} = require('electron').remote
const urlExists = require('url-exists')

ffmpeg.setFfmpegPath('./bin/ffmpeg')

var myApp ={          title:"",
                      berenjeno:null,
                      validURL:false,
                      url:"",
                      downloading:false,
                      folderenjena:app.getPath('desktop')+"\\",
                      API_KEY:"YOUR API KEY"
                      }


function linkChanged(text){
    if (ytdl.validateURL(text)) {
      myApp.validURL=true
      myApp.url=text

      document.getElementById("txtLink").setAttribute("class","fine")
      document.getElementById("btnVideo").removeAttribute("disabled")
      document.getElementById("btnAudio").removeAttribute("disabled")

  }else if(text.includes("https://www.youtube.com/playlist")){
    myApp.validURL=true
    let listId = text.split("list=")[1]
    myApp.url="https://www.youtube.com/watch?v=xxxxxxxxxxx&list="+listId

    document.getElementById("txtLink").setAttribute("class","fine")
    document.getElementById("btnVideo").removeAttribute("disabled")
    document.getElementById("btnAudio").removeAttribute("disabled")
  }
  else{
    document.getElementById("txtLink").setAttribute("class","error")
    document.getElementById("btnVideo").setAttribute("disabled","disabled")
    document.getElementById("btnAudio").setAttribute("disabled","disabled")

    myApp.validURL=false
  }
}

 function existsURL(){
   //to check if the video exists is as simple as make a request to the video thumbnail.
   //If the video exists it returns the status 200, else it returns the status 404
   let urlParts = myApp.url.split("/")
   let id = urlParts[urlParts.length-1]
   if (urlParts[urlParts.length-1].includes("="))id=id.split("=")[1]
   var http = $.ajax({
       type:"HEAD",
       url: 'https://img.youtube.com/vi/'+id+'/0.jpg',
       async: false
   })
   return http.status==200

}
  async function downloadMedia(audio){
return new Promise((resolve)=>{
  if (myApp.validURL) {

    myApp.downloading=true
    document.getElementById("btnVideo").setAttribute("disabled","disabled")
    document.getElementById("btnAudio").setAttribute("disabled","disabled")

    if (isPlaylist()) {
      let d = dialog.showMessageBox({type:'warning', title:'warning', buttons:['yes','no','cancel'], message:'The link belongs to a Playlist, do you want to download all the playlist?'})
      if (d==0) {
        let asynchronously= dialog.showMessageBox({type:'warning', title:'warning', buttons:['Yes(at once)','No(one by one)'], message:'Do you want to download all the videos at once? this can slow down the computer'})

        if (asynchronously==1) {
          downloadPlaylist(audio,true)
        }else {
          downloadPlaylist(audio,false)
        }

        return
      }else {
        myApp.url= myApp.url.split("&list")[0]
      }
    }

    if (!existsURL())return alert("I can't connect with any video with the link posted.\n\nPlease check the link.")
    if (myApp.berenjeno===null) myApp.berenjeno=setInterval(angryBerenjena,5000)


    let video = ytdl(myApp.url)

    video.on('info',function(info){
      myApp.title=info.title.replace(/[^a-zA-Z ]/g, "")
      video.pipe(fs.createWriteStream(myApp.folderenjena+myApp.title+".mp4"));
    })
    let auxTitle = myApp.title
    video.once('response', () => {
    document.getElementById("pbDownload").style.display="block"
      })



  video.on('progress',(chunkLength, downloaded, total)=>{

    downloadingProcess(chunkLength, downloaded, total)



  })

   video.on('end',async ()=>{
    document.getElementById("pbDownload").style.display="none"
    document.getElementById("pbText").innerHTML=""
    document.getElementById("pbDownloadStatus").setAttribute("style","width:"+0+"%")
    video=null

    if(audio){
       await downloadAudio(auxTitle)
    }
        myApp.downloading=false
        resolve(true)
  })

  document.getElementById("btnVideo").removeAttribute("disabled")
  document.getElementById("btnAudio").removeAttribute("disabled")

}else{alert("invalid link")
      resolve(false)
    }
})

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

 function downloadAudio(mp4FileTitle){
return new Promise((resolve)=>{
    var proc = new ffmpeg({source:myApp.folderenjena+mp4FileTitle+'.mp4'})
        .setFfmpegPath("./bin/ffmpeg")
        .toFormat('mp3')
        .saveToFile(myApp.folderenjena+mp4FileTitle+'.mp3').on('end',function(){
          removeVideo(myApp.folderenjena+mp4FileTitle+'.mp4')
          resolve(true)
        })

})
}

 async function downloadPlaylist(audio,sync){

          let playlistId=myApp.url.split("list=")
          playlistId=playlistId[1].split("&")
          let request = new XMLHttpRequest()

          //Get json with all the videos in the playlist
          request.open("GET","https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId="+playlistId[0]+"&key="+ myApp.API_KEY,false)
          request.send(null)
          let videoList= JSON.parse(request.responseText)
          if (sync) {
            downloadPlaylistSynchronous(audio,videoList)
          }else {
            downloadPlaylistAsynchronous(audio,videoList)
          }

}

async function downloadPlaylistSynchronous(audio,videoList){
  if (Object.keys(videoList)[0]!=="error") {
  let downloadedVideos= document.getElementById("downloadedVideos")
  for (var i = 0; i < videoList.items.length; i++) {
    downloadedVideos.innerHTML="Downloaded videos: "+i+"/"+videoList.items.length
    myApp.url="https://www.youtube.com/watch?v="+videoList.items[i].snippet.resourceId.videoId;
    myApp.title=videoList.items[i].snippet.title.replace(/[^a-zA-Z ]/g, "");
    await downloadMedia(audio)
      }
      downloadedVideos.innerHTML=""
    }
}

function downloadPlaylistAsynchronous(audio,videoList){
  if (Object.keys(videoList)[0]!=="error") {
  let downloadedVideos= document.getElementById("downloadedVideos")

  for (var i = 0; i < videoList.items.length; i++) {
    downloadedVideos.innerHTML="Downloaded videos: "+i+"/"+videoList.items.length
    myApp.url="https://www.youtube.com/watch?v="+videoList.items[i].snippet.resourceId.videoId;
    myApp.title=videoList.items[i].snippet.title.replace(/[^a-zA-Z ]/g, "");
    downloadMedia(audio)
      }
      downloadedVideos.innerHTML=""
    }
  }

function angryBerenjena(){
  document.getElementsByTagName("IMG")[0].setAttribute("src","../img/Eggplant.png")
  document.getElementById("angryEggplant").style.display="block"
  let angry = document.getElementById("angryEggplant")
  let rand = Math.random()
  if (rand<=0.5) {
      $("#angryEggplant").animate({left: '-='+rand*400+'px'}, 100).animate({top: '-='+rand*1000+'px'}, rand*5000).animate({top: '+='+rand*1000+'px'},rand*5000).animate({left: '+='+rand*400+'px'}, 100)
  }else{
    $("#angryEggplant").animate({left: '+='+rand*400+'px'}, 100).animate({top: '-='+rand*600+'px'}, rand*2000).animate({top: '+='+rand*600+'px'},rand*2000).animate({left: '-='+rand*400+'px'}, 100)
  }



}

function closeApp(){
  if (myApp.downloading) {
    let d = dialog.showMessageBox({type:'warning', title:'warning', buttons:['yes','no','cancel'], message:'Download in progress, are you sure you want to close Berenjena? '})
    if (d!==0) {
      return;
    }
  }
    require('electron').remote.getCurrentWindow().close()

}
function selectFolderenjena(){
  let newFolder =dialog.showOpenDialog({title: "Save as...", defaultPath: myApp.folderenjena,properties:['openDirectory']})
  myApp.folderenjena = (newFolder!== undefined && newFolder.length>0)?newFolder[0]+'\\':myApp.folderenjena

}

function removeVideo(path){
  if (fs.existsSync(path))fs.unlinkSync(path)
    }

function splash(){
document.getElementsByTagName("IMG")[0].setAttribute("src","../img/splash.png")
clearInterval(myApp.berenjeno)
myApp.berenjeno=null

}


function moveVideoToDeleteFolder(videoPath){
  let deleteFolder=myApp.folderenjena+'\\Delete\\'

  if (!fs.existsSync(deleteFolder)){
      fs.mkdirSync(deleteFolder)
  }

  fs.rename(videoPath,deleteFolder+myApp.title+'.mp4' , function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy()
            }
            return
        }

    })
}

function isPlaylist(){
  return myApp.url.includes("list")
}
