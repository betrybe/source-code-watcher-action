const fs = require('fs');
const escomplex = require('typhonjs-escomplex');
const ESLint = require("eslint").ESLint;
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function fileComplexity(file){
    try{
        let out_json = {}
        const report = escomplex.analyzeModule(file);
    
        out_json['cyclomatic'] = report.methodAverage.cyclomatic
        out_json['cyclomaticDensity'] = report.methodAverage.cyclomaticDensity
        // halstead
        for (item in report.methodAverage.halstead){
            if (item != 'operands' && item != 'operators')
            out_json['halstead_'+item] = report.methodAverage.halstead[item]
        }
        out_json['maintainability'] = report.maintainability
        return out_json
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

process_file(process.argv[2]).then(function(result) {
    fs.writeFileSync('result.json', JSON.stringify(result))
    process.exit();
});

