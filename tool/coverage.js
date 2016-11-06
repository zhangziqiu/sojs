var cli = require('../node_modules/istanbul/lib/cli.js');
cli.runToCompletion([ 'cover', 'tool/unit.js', '--dir=test/coverage']);
