module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: ['serialport'],
      builderOptions: {
        "productName": "COOPER Quick",
        "appId": "org.hardwario.cooper-quick",
        "files": ["**", "build/icon.*"],
        "linux": {
          "target": [
            "AppImage"
          ],
          "category": "Utility",
        },
        "win": {
          "target": [
            "nsis",
            "portable"
          ],
          "publisherName": "HARDWARIO s.r.o.",
        },
        "dmg": {
          "contents": [
            {
              "x": 130,
              "y": 220,
            },
            {
              "x": 410,
              "y": 220,
              "type": "link",
              "path": "/Applications"
            }
          ]
        },
        "appImage": {
          "systemIntegration": "doNotAsk"
        }      
      }
    }
  }
}
