const {app, BrowserWindow} = require('electron')
let win = null
function createWindow(){
  win = new BrowserWindow({width: 800, height: 600,icon:'./img/berenjena.png', resizable:false, show:false, frame:true })
  win.loadFile('html/index.html')
}

app.on('ready',()=>{
  createWindow()
  win.on('ready-to-show',()=>{
    win.show()
  })
  win.on('closed',()=>{
    win=null
  })

})
