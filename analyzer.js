const fs = require('fs');
const escomplex = require('typhonjs-escomplex');
const ESLint = require("eslint").ESLint;
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const path = require("path")
const minimatch = require("minimatch")
const allowed_extensions = ['.js', '.jsx']

function fileComplexity(file){
    try{
        let dict = {}
        const report = escomplex.analyzeModule(file);
        dict['cyclomatic'] = report.methodAverage.cyclomatic
        dict['cyclomaticDensity'] = report.methodAverage.cyclomaticDensity
        // halstead
        for (item in report.methodAverage.halstead){
            if (item != 'operands' && item != 'operators')
            dict['halstead_'+item] = report.methodAverage.halstead[item]
        }
        dict['maintainability'] = report.maintainability
        return dict
    }
    catch (e) {
        return {};
    }

}

async function fileLinter(file){
    try{
        let dict = {};
        const cli = new ESLint({
            useEslintrc: false,
            overrideConfig: {
                extends: [
                    'plugin:security/recommended'
                ],
                "parserOptions": {
                    "ecmaFeatures": {
                      "jsx": true
                    },
                    "sourceType": "module"
                },
                "env": {
                    "browser": true,
                    "es2020": true
                  },
            }
        });
        const result = await cli.lintText(file);
        const messages = result[0]['messages'] 
        for (message in messages){
            if (messages[message].ruleId != null){
                if(messages[message].ruleId in dict) {
                    dict[messages[message].ruleId] = dict[messages[message].ruleId] + 1;
                }
                else{
                    dict[messages[message].ruleId] = 1;
                }      
            }
        }
        return dict
    }
    catch (e) {
        return {};
    }
}


function fileStats(file){
  let dict = {};
  try{
    // get content
    const ast = parser.parse(file, {
        sourceType: 'unambiguous',
        plugins: ["jsx"]
    });
    traverse(ast, {
        enter(path) {
            if(path.type in dict) {
                dict[path.type] = dict[path.type] + 1;
            }
            else{
                dict[path.type] = 1;
            }
        }
    });
    dict['Comments'] = ast.comments.length
    let json =  dict;
    return json;
  }
  catch (e) {
    return {};
  }
  
}

async function process_file(file){
    let content = fs.readFileSync(file, 'utf8')
    token_dict = fileStats(content)
    rules_dict = await fileLinter(content)
    complex_dict = fileComplexity(content)
    let dict_out = {...token_dict, ...rules_dict, ...complex_dict}
    return dict_out
}

function main(dir){
    // attemp to get ignore
    if (fs.existsSync(dir + "/" + ".eslintignore")){
        var ignore_pattern = fs.readFileSync(dir + "/" + ".eslintignore").toString().split("\n");
    }
    else{
        var ignore_pattern = []
    }
    // get files
    var files = getAllFiles(dir)
    files.forEach(function(file){
        // check pattern
        let file_path = file.replace(dir, "/")
        file_path = file_path.replace("//", "")
        let allowed = true
        for(var p in ignore_pattern){
            if (minimatch(file_path, ignore_pattern[p], { matchBase: true})){
                allowed = false
            }
        }
        // good to go
        if ((allowed) && (allowed_extensions.includes(path.extname(file_path)))){
            console.log(file_path)
            process_file(file).then(function(result) {
                // fs.writeFileSync('result.json', JSON.stringify(result))
                //console.log(JSON.stringify(result))
                // process.exit();
            });
        }
        
    });
 

}

const getAllFiles = dir =>
  fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
  }, []);

main(process.argv[2])
