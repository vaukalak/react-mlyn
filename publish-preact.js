// TODO: this is temp code

const fs = require("fs");
const shell = require('child_process').execSync;

const preactDir = "./preact";

if (fs.existsSync(preactDir)) {
    fs.rmSync(preactDir, { recursive: true });

}
fs.mkdirSync("./preact");

shell(`cp -r src ${preactDir}/src`);
shell(`cp -r package.json ${preactDir}/package.json`);
shell(`cp -r babel.config.js ${preactDir}/babel.config.js`);
shell(`cp -r tsconfig.json ${preactDir}/tsconfig.json`);

const packageJSONPath = `${preactDir}/package.json`;
const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath));

packageJSON.name = "preact-mlyn";
delete packageJSON.peerDependencies["react"];
packageJSON.peerDependencies["preact"] = "10.5.15";

fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON));

shell(`cd preact && yarn && yarn build`);