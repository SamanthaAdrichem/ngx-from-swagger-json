# ngx-from-swagger-json

This packages allows you to generated services and their models from a swagger.json file

# Installation

Yarn: Run `yarn global add @aiwha/ngx-from-swagger-json`

NPM:  Run `npm install -g @aiwha/ngx-from-swagger-json`

# Configuration

After installing this package create a `ngx-from-swagger-json.json` file and set the configuration
Example config:
```json
{
	"hostname": "example.com",
	"folders": [
		"docs"
	],
	"destinationDir": "services",
	"ignoreTls": "false"
}
```

The following can be configured:

| Name | Description |
|----------|-------------|
| hostname | The hostname where swagger is hosted |
| folders | The folders on the hostname to parse (multiple folders can be parsed) default is docs |
| destinationDir | Where to compile them to this is relative from where ngx-from-swagger-json is executed |
| ignoreTls | If you want to generate them from a dev environment you can disable Tls verification |

# Execution

Run `ngx-from-swagger-json` to start the export of the models

The following command line arguments are available

| Argument | Description |
|----------|-------------|
| -v | Verbose output |
| --verbose | see -v |
| --config file | custom config file if you want to run it for multiple api's |

***Note:** All files ending in `.enum.ts` and `.model.generated.ts` will be overwritten each time this script is run, all other files will need to be deleted if you want to re-generate them.*

# Output example

Look for an example in this repo's `examples` directory

# Planned changes

- Use alias paths for example import {x} from '@app/data'
- Generation of module files defined per service group
- Check for actually required values
