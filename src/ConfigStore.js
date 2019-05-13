const electron = require('electron');
const path = require('path');
const fs = require('fs');

class ConfigStore {
    constructor(filename, defaults={}) {
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');

        this.filePath = path.join(userDataPath, filename);

        console.log("ConfigStore open", this.filePath);

        try {
            this.data = JSON.parse(fs.readFileSync(this.filePath), { encoding: "utf8" });

            for (let section in defaults) {
                this.data[section] = Object.assign(defaults[section], this.data[section]);
            }

        } catch(error) {
            if (error.code != 'ENOENT')
                console.error(error);
            this.data = defaults;
        }
    }

    get(section, key) {
        if (key == undefined) {
            return this.data[section];
        }
        return this.data[section][key];
    }

    getAll() {
        return this.data;
    }

    set(section, key, val) {
        if (key == undefined) {
            this.data[section] = val;
        }else {
            this.data[section][key] = val;
        }

        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, '  '), { encoding: "utf8" });
    }
}

module.exports = ConfigStore;
