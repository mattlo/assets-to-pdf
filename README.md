# Assets to PDF
Inputs N amount of jpgs, pngs, or pdfs and outputs a single PDF with each asset as it's own page.

## Setup
### OS X
- Get Cask `brew install caskroom/cask/brew-cask`
- `brew cask install virtualbox`
- `brew cask install vagrant`
- `cd` into your project directory
- `vagrant up`

## Dev Workflow Notes
- Restart Node Instance after `vagrant` is running:
 - `cd` into your project directory
 - `. tools/restart.sh`

 ## How To Use
 The program expects files to be within the `/src/input` and `/src/output` directories. 
 Initialization of any processes is done through HTTP.

 - *Download PDF* HTTP `GET` `/fetch/<HASH>/<DOWNLOAD_FILE_NAME>`
  - `HASH` - Base62 filename thats within `/src/output`
 - *Create PDF* HTTP `POST` `/create-pdf`
  - Response Body Example:
```
{
	"uniquePkgName": "42MD-Hazmat-1",
	"inputFiles": [
		"d5390357712c88ed584ceea78b589ac7.jpg",
		"5f5a2aceda732249a607cc2b7eee2f3c.pdf",
		"7a6427d1826be4ed2af94fb0f5bdfb75.png"
	]
}
```

The order of the `inputFiles` will be the order the pages are created within 1 pdf.