module.exports = {
    pluginOptions: {
      electronBuilder: {
        externals: ['serialport'],
        builderOptions:{
          productName: "COOPER Quick",
          "appId": "com.electron.hardwario-cooper-quick",
          "artifactName": "cooper-quick-${version}-${os}-${arch}.${ext}",
          "publish": null,
          "mac": {
            "artifactName": "cooper-quick-${version}-macos-${arch}.${ext}",
            "category": "public.app-category.utilities"
          },
          "win": {
            "artifactName": "cooper-quick-${version}-windows-${arch}.${ext}",
            "target": [
              "nsis",
              "portable"
            ],
            "publisherName": "HARDWARIO s.r.o."
          },
          "linux": {
            "artifactName": "cooper-quick-${version}-linux-${arch}.${ext}",
            "target": [
              "deb",
            ],
            "category": "Utility"
          },
          "appImage": {
            "systemIntegration": "doNotAsk"
          },
          "nsis": {
            "artifactName": "cooper-quick-${version}-${os}-setup-${arch}.${ext}"
          }
        }
      }
    }
  }